from datetime import date

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from gamify.models import DailyGoal, GamifyHistory
from rooms.models import Room
from session.models import Session
from session.serializers import SessionSerializer
from gamify.services import recalculate_streak, unlock_badges_for_user


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Session.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, started_at=timezone.now())

    def create(self, request, *args, **kwargs):
        active_session = Session.objects.filter(
            user=request.user,
            status=Session.STATUS_RUNNING,
            ended_at__isnull=True,
        ).first()
        if active_session:
            return Response(
                {
                    "error": "You already have an active study session. Please end it before starting a new one."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        active_session = Session.objects.filter(
            user=request.user,
            status=Session.STATUS_RUNNING,
            ended_at__isnull=True,
        ).first()
        if not active_session:
            return Response(
                {"detail": "No active session found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(active_session)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        room_id = request.data.get("room_id")
        if not room_id:
            return Response(
                {"detail": "room_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_session = Session.objects.filter(
            user=request.user,
            status=Session.STATUS_RUNNING,
            ended_at__isnull=True,
        ).first()
        if existing_session:
            return Response(
                {"detail": "You already have an active study session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        room = get_object_or_404(Room, pk=room_id, is_active=True)
        active_user_count = (
            Session.objects.filter(
                room=room,
                status=Session.STATUS_RUNNING,
                ended_at__isnull=True,
            )
            .values("user")
            .distinct()
            .count()
        )

        if active_user_count >= room.max_users:
            return Response(
                {"detail": "Room is full."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = Session.objects.create(
            user=request.user,
            room=room,
            started_at=timezone.now(),
            status=Session.STATUS_RUNNING,
        )
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="end")
    def end(self, request):
        session_id = request.data.get("session_id")
        if session_id:
            session = get_object_or_404(Session, pk=session_id, user=request.user)
        else:
            session = Session.objects.filter(
                user=request.user,
                status=Session.STATUS_RUNNING,
                ended_at__isnull=True,
            ).first()
            if not session:
                return Response(
                    {"detail": "No active session found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if session.status == Session.STATUS_COMPLETED or session.ended_at is not None:
            return Response(
                {"detail": "Session is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        focus_minutes_payload = request.data.get("focus_minutes")
        if focus_minutes_payload is not None:
            try:
                focus_minutes = int(focus_minutes_payload)
                if focus_minutes < 0:
                    raise ValueError
            except (TypeError, ValueError):
                return Response(
                    {"focus_minutes": ["Must be a positive integer."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            ended_at = timezone.now()
            elapsed_seconds = max(0, (ended_at - session.started_at).total_seconds())
            focus_minutes = int(elapsed_seconds // 60)
            if focus_minutes == 0 and elapsed_seconds > 0:
                focus_minutes = 1

        session.ended_at = timezone.now()
        session.focus_minutes = focus_minutes
        session.status = Session.STATUS_COMPLETED
        session.save(update_fields=["ended_at", "focus_minutes", "status", "updated_at"])

        goal, _ = DailyGoal.objects.get_or_create(
            user=request.user,
            date=date.today(),
            defaults={"target_minutes": 0, "achieved_minutes": 0},
        )
        goal.achieved_minutes += focus_minutes
        goal.save(update_fields=["achieved_minutes", "updated_at"])

        streak = recalculate_streak(request.user, goal.date)

        xp_awarded = focus_minutes
        GamifyHistory.objects.create(
            user=request.user,
            session=session,
            xp_awarded=xp_awarded,
            description="Session completed",
        )

        request.user.xp += xp_awarded
        request.user.level = (request.user.xp // 100) + 1
        request.user.save(update_fields=["xp", "level", "updated_at"])

        unlocked_badges = unlock_badges_for_user(request.user)

        serializer = self.get_serializer(session)
        return Response(
            {
                "session": serializer.data,
                "daily_goal": {
                    "date": goal.date,
                    "target_minutes": goal.target_minutes,
                    "achieved_minutes": goal.achieved_minutes,
                },
                "xp_awarded": xp_awarded,
                "level": request.user.level,
                "streak": streak,
                "unlocked_badges": [
                    {
                        "id": badge.id,
                        "code": badge.code,
                        "name": badge.name,
                        "description": badge.description,
                        "condition_type": badge.condition_type,
                        "threshold": badge.threshold,
                        "icon": badge.icon,
                    }
                    for badge in unlocked_badges
                ],
            },
            status=status.HTTP_200_OK,
        )
