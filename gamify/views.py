from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import date
from gamify.models import Badge, DailyGoal, UserBadge
from gamify.serializers import DailyGoalSerializer, UserBadgeSerializer
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from session.models import Session

class DailyGoalViewSet(viewsets.GenericViewSet):
    serializer_class = DailyGoalSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    queryset = DailyGoal.objects.all()

    @action(detail=False, methods=["get", "post"], url_path="today")
    def today(self, request):
        goal, created = DailyGoal.objects.get_or_create(
            user=request.user,
            date=date.today(),
            defaults={"target_minutes": 0, "achieved_minutes": 0}
        )

        if request.method == "POST":
            target_minutes = request.data.get("target_minutes")
            if target_minutes is None:
                return Response({"target_minutes": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            try:
                goal.target_minutes = int(target_minutes)
                goal.save()
            except (ValueError, TypeError):
                return Response({"target_minutes": ["A valid integer is required."]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(goal)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="streak")
    def streak(self, request):
        return Response(
            {
                "current_streak": request.user.current_streak,
                "longest_streak": request.user.longest_streak,
            },
            status=status.HTTP_200_OK,
        )


class UserBadgeListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        badges = Badge.objects.filter(is_active=True).order_by(
            "condition_type",
            "threshold",
            "name",
        )
        unlocked_badges = {
            user_badge.badge_id: user_badge
            for user_badge in UserBadge.objects.filter(
                user=request.user,
                badge__is_active=True,
            ).select_related("badge")
        }
        serializer = UserBadgeSerializer(
            badges,
            many=True,
            context={"unlocked_badges": unlocked_badges},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class WeeklyLeaderboardView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_week_range(self):
        today = timezone.localdate()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=7)

        start = timezone.make_aware(
            timezone.datetime.combine(start_of_week, timezone.datetime.min.time())
        )
        end = timezone.make_aware(
            timezone.datetime.combine(end_of_week, timezone.datetime.min.time())
        )
        return start, end
    
    def get(self, request):
        limit = int(request.query_params.get("limit", 10))
        start, end =self.get_week_range()
        leaderboard = (
            Session.objects.filter(
                status=Session.STATUS_COMPLETED,
                started_at__gte=start,
                started_at__lt=end,
                focus_minutes__isnull=False,
            )
            .values(
                "user",
                "user__username",
                "user__email",
                "user__full_name",
                "user__profile_picture",
                "user__level",
                "user__xp",
            )
            .annotate(total_minutes=Sum("focus_minutes"))
            .order_by("-total_minutes", "user__id")
        )

        rows = list(leaderboard)
        ranked_rows = []
        current_user_rank = None

        for index, row in enumerate(rows, start=1):
            item = {
                "rank": index,
                "user": {
                    "id": row["user"],
                    "username": row["user__username"],
                    "email": row["user__email"],
                    "full_name": row["user__full_name"],
                    "profile_picture": row["user__profile_picture"],
                    "level": row["user__level"],
                    "xp": row["user__xp"],
                },
                "total_minutes": row["total_minutes"],
            }

            if row["user"] == request.user.id:
                current_user_rank = item

            if index <= limit:
                ranked_rows.append(item)

        return Response(
            {
                "week": {
                    "start": start.date(),
                    "end": (end - timedelta(days=1)).date(),
                },
                "results": ranked_rows,
                "current_user": current_user_rank,
            },
            status=status.HTTP_200_OK,
        )
