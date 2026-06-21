from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from datetime import date
from session.models import Session
from session.serializers import SessionSerializer
from gamify.models import DailyGoal

class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_active=True, start_time=timezone.now())

    def create(self, request, *args, **kwargs):
        # Prevent starting a new session if one is already active
        active_session = Session.objects.filter(user=request.user, is_active=True).first()
        if active_session:
            return Response(
                {"error": "You already have an active study session. Please end it before starting a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        active_session = Session.objects.filter(user=request.user, is_active=True).first()
        if not active_session:
            return Response({"detail": "No active session found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(active_session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="end")
    def end(self, request):
        active_session = Session.objects.filter(user=request.user, is_active=True).first()
        if not active_session:
            return Response({"error": "No active study session found to end."}, status=status.HTTP_400_BAD_REQUEST)

        # Determine focus minutes: use request parameter if provided (handy for testing/override), otherwise calculate
        focus_minutes_payload = request.data.get("focus_minutes")
        if focus_minutes_payload is not None:
            try:
                focus_minutes = int(focus_minutes_payload)
                if focus_minutes < 0:
                    raise ValueError
            except (ValueError, TypeError):
                return Response({"focus_minutes": ["Must be a positive integer."]}, status=status.HTTP_400_BAD_REQUEST)
        else:
            duration = timezone.now() - active_session.start_time
            focus_minutes = int(duration.total_seconds() // 60)

        # Update Session
        active_session.is_active = False
        active_session.end_time = timezone.now()
        active_session.focus_minutes = focus_minutes
        active_session.save()

        # Update DailyGoal
        today = date.today()
        goal, created = DailyGoal.objects.get_or_create(
            user=request.user,
            date=today,
            defaults={"target_minutes": 0, "achieved_minutes": 0}
        )
        goal.achieved_minutes += focus_minutes
        goal.save()

        serializer = self.get_serializer(active_session)
        return Response({
            "session": serializer.data,
            "daily_goal": {
                "date": goal.date,
                "target_minutes": goal.target_minutes,
                "achieved_minutes": goal.achieved_minutes
            }
        }, status=status.HTTP_200_OK)
