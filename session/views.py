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


def close_expired_running_sessions(user, now=None):
    """Đóng các phiên đang chạy đã quá hạn (người dùng rời đi mà không kết thúc).

    Phiên bỏ dở được ghi 0 phút focus và KHÔNG cộng vào mục tiêu ngày, vì không
    thể biết thực sự đã học bao lâu. Nhờ vậy khi vào phòng lại sẽ mở phiên mới
    thay vì khôi phục một phiên đã "hết giờ" và tính công cả khối 120 phút.
    """
    now = now or timezone.now()
    closed = []
    running = Session.objects.filter(
        user=user,
        status=Session.STATUS_RUNNING,
        ended_at__isnull=True,
    )
    for session in running:
        if session.is_expired(now):
            session.ended_at = now
            session.focus_minutes = 0
            session.status = Session.STATUS_COMPLETED
            session.save(
                update_fields=["ended_at", "focus_minutes", "status", "updated_at"]
            )
            closed.append(session)
    return closed


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
        close_expired_running_sessions(request.user)
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
        close_expired_running_sessions(request.user)
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

        # Thời lượng học dự kiến do người dùng chọn. Mặc định nếu client không gửi.
        planned_raw = request.data.get("planned_minutes")
        if planned_raw is None:
            planned_minutes = Session.DEFAULT_PLANNED_MINUTES
        else:
            try:
                planned_minutes = int(planned_raw)
            except (TypeError, ValueError):
                return Response(
                    {"planned_minutes": ["A valid integer is required."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not (
                Session.MIN_PLANNED_MINUTES
                <= planned_minutes
                <= Session.MAX_PLANNED_MINUTES
            ):
                return Response(
                    {
                        "planned_minutes": [
                            f"Must be between {Session.MIN_PLANNED_MINUTES} and "
                            f"{Session.MAX_PLANNED_MINUTES} minutes."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        close_expired_running_sessions(request.user)
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
            planned_minutes=planned_minutes,
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

        now = timezone.now()
        elapsed_seconds = session.elapsed_seconds(now)
        # Số phút thực tế đã trôi; phiên rất ngắn (<1') vẫn tính tối thiểu 1'.
        elapsed_minutes = int(elapsed_seconds // 60)
        if elapsed_minutes == 0 and elapsed_seconds > 0:
            elapsed_minutes = 1

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
            focus_minutes = elapsed_minutes

        if session.is_expired(now):
            # Phiên bỏ dở: không biết thực sự đã học bao lâu → không ghi công.
            focus_minutes = 0
        else:
            # Chặn trần: không thể focus nhiều phút hơn thời gian thực đã trôi,
            # cũng không vượt quá thời lượng dự kiến của phiên (chống gửi số phút ảo).
            focus_minutes = min(focus_minutes, elapsed_minutes, session.planned_minutes)

        session.ended_at = now
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
