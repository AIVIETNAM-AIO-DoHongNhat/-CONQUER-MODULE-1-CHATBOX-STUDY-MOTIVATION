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
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import OpenApiResponse, extend_schema

from session.models import Session
from session.serializers.session_serializer import SessionSerializer
from rooms.models import Room
from gamify.models import GamifyHistory


class StartSessionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        summary="Start a new session",
        request=None,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(description="Session started")
        },
    )
    def post(self, request):
        room_id = request.data.get("room_id")
        if not room_id:
            return Response(
                {"detail": "room_id is required."}, status=status.HTTP_400_BAD_REQUEST
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
        user_has_running_session = Session.objects.filter(
            user=request.user,
            room=room,
            status=Session.STATUS_RUNNING,
            ended_at__isnull=True,
        ).exists()

        if not user_has_running_session and active_user_count >= room.max_users:
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
        serializer = SessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EndSessionView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        summary="End an active session",
        request=None,
        responses={status.HTTP_200_OK: OpenApiResponse(description="Session ended")},
    )
    def post(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response(
                {"detail": "session_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = get_object_or_404(Session, pk=session_id, user=request.user)
        if session.status == Session.STATUS_COMPLETED or session.ended_at is not None:
            return Response(
                {"detail": "Session is already completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ended_at = timezone.now()
        elapsed_seconds = max(0, (ended_at - session.started_at).total_seconds())
        focus_minutes = int(elapsed_seconds // 60)
        if focus_minutes == 0 and elapsed_seconds > 0:
            focus_minutes = 1

        session.ended_at = ended_at
        session.focus_minutes = focus_minutes
        session.status = Session.STATUS_COMPLETED
        session.save()

        xp_awarded = focus_minutes
        gamify_record = GamifyHistory.objects.create(
            user=request.user,
            session=session,
            xp_awarded=xp_awarded,
            description="Session completed",
        )

        request.user.xp = request.user.xp + xp_awarded
        request.user.save(update_fields=["xp"])

        serializer = SessionSerializer(session)
        return Response(
            {
                "session": serializer.data,
                "xp_awarded": xp_awarded,
                "gamify_record_id": gamify_record.id,
            },
            status=status.HTTP_200_OK,
        )
