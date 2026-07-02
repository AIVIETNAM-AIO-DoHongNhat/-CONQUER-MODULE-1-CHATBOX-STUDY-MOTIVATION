from datetime import date
import requests
from django.conf import settings

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
            Session.active_in_room(room).values("user").distinct().count()
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

    @action(detail=False, methods=["post"], url_path="chat")
    def chat(self, request):
        message = request.data.get("message")
        history = request.data.get("history", [])
        focus_minutes = request.data.get("focus_minutes")

        if not message:
            return Response(
                {"detail": "message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If focus_minutes is not passed, attempt to calculate it from the active session
        if focus_minutes is None:
            active_session = Session.objects.filter(
                user=request.user,
                status=Session.STATUS_RUNNING,
                ended_at__isnull=True,
            ).first()
            if active_session:
                elapsed_seconds = (timezone.now() - active_session.started_at).total_seconds()
                focus_minutes = int(elapsed_seconds / 60)
            else:
                focus_minutes = 0

        # Load Gemini API settings
        api_key = getattr(settings, "GEMINI_API_KEY", None)

        # Check if the api_key is configured and not a placeholder
        is_placeholder = api_key in [None, "", "your_gemini_api_key", "django_secret_key"]

        if is_placeholder:
            # Fallback to local mock response
            reply = self._get_fallback_response(message, focus_minutes)
            return Response({"reply": reply}, status=status.HTTP_200_OK)

        try:
            # Prepare request to Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

            # Map history into Gemini contents structure
            contents = []
            for item in history:
                role = "user" if item.get("role") == "user" else "model"
                text = item.get("text", "")
                if text:
                    contents.append({
                        "role": role,
                        "parts": [{"text": text}]
                    })

            # Add current user message
            contents.append({
                "role": "user",
                "parts": [{"text": message}]
            })

            system_instruction = (
                "Bạn là Bo, một linh vật học tập đáng yêu, vui tươi, ấm áp, luôn đồng hành cùng học viên. "
                "Hãy trả lời câu hỏi và đưa ra những lời khuyên, lời cổ vũ nhiệt tình. "
                f"Thông tin thêm: học viên này đã học tập tập trung trong phòng được {focus_minutes} phút ở phiên học hiện tại. "
                "Hãy dựa vào số phút tập trung này để đưa ra lời khen ngợi/cổ vũ phù hợp (ví dụ: học lâu rồi thì khen ngợi và bảo nghỉ ngơi một chút, "
                "mới học thì khích lệ duy trì,...). "
                "Luôn trả lời bằng tiếng Việt, ngôn ngữ tự nhiên, gần gũi, dùng nhiều biểu tượng cảm xúc (emoji).\n\n"
                "Ngoài ra, nếu học viên biểu hiện tâm trạng tiêu cực (mệt mỏi, buồn chán, áp lực, căng thẳng, lo lắng) hoặc chủ động hỏi về âm nhạc, "
                "bạn hãy gợi ý một thể loại nhạc nhẹ nhàng phù hợp để họ thư giãn khi học. Bạn PHẢI kèm theo đúng 1 link YouTube cụ thể từ danh sách sau tùy theo tâm trạng của họ:\n"
                "- Nhạc Lofi chill (hợp với buồn chán, mệt mỏi): https://www.youtube.com/watch?v=jfKfPfyJRdk\n"
                "- Nhạc Acoustic guitar (hợp với căng thẳng, áp lực): https://www.youtube.com/watch?v=y3h2N2_18L8\n"
                "- Nhạc không lời piano (hợp với lo lắng, bồn chồn): https://www.youtube.com/watch?v=84eKpe6r90A\n"
                "- Tiếng mưa rơi / White noise (hợp với mất tập trung): https://www.youtube.com/watch?v=mPZkdNFkNps\n"
                "Nhớ giới thiệu ngắn gọn lý do chọn bản nhạc này để tiếp lửa cho họ."
            )

            payload = {
                "contents": contents,
                "systemInstruction": {
                    "parts": [{"text": system_instruction}]
                }
            }

            response = requests.post(url, json=payload, timeout=10)
            if response.status_code == 200:
                data = response.json()
                # Extract text from response
                try:
                    reply = data["candidates"][0]["content"]["parts"][0]["text"]
                    return Response({"reply": reply}, status=status.HTTP_200_OK)
                except (KeyError, IndexError):
                    pass

            # Fallback if API returns error or unexpected format
            reply = self._get_fallback_response(message, focus_minutes)
            return Response({"reply": reply}, status=status.HTTP_200_OK)

        except Exception:
            # General fallback on network or request errors
            reply = self._get_fallback_response(message, focus_minutes)
            return Response({"reply": reply}, status=status.HTTP_200_OK)

    def _get_fallback_response(self, message, focus_minutes):
        t = message.lower()
        if any(k in t for k in ["mệt", "chán", "nản", "lười", "không muốn", "stress", "áp lực", "bỏ cuộc", "khó quá"]):
            if focus_minutes > 45:
                return f"Bo biết bạn đã rất cố gắng khi học liên tục {focus_minutes} phút rồi! Đừng ép bản thân quá nhé. Hãy đứng dậy đi uống nước, vươn vai 5 phút rồi chúng mình lại tiếp tục. Bo gợi ý bản nhạc Lofi chill này để thư giãn tinh thần: https://www.youtube.com/watch?v=jfKfPfyJRdk 🌱"
            elif focus_minutes > 0:
                return f"Bạn đã tập trung được {focus_minutes} phút rồi đó, một khởi đầu rất tuyệt vời! Cảm giác nản lòng chỉ là nhất thời thôi, mình cùng cố gắng thêm chút nữa nhé. Đây là chút nhạc Acoustic guitar nhẹ nhàng giúp bạn giải tỏa áp lực: https://www.youtube.com/watch?v=y3h2N2_18L8 Cố lên! 🔥"
            else:
                return "Bo nghe đây. Có vẻ hôm nay bạn đang cảm thấy hơi nản lòng đúng không? Đừng lo lắng, hãy nghe thử bản nhạc Lofi chill êm dịu này để thư giãn tâm trí rồi bắt đầu một hiệp học ngắn 15 phút cùng Bo nhé: https://www.youtube.com/watch?v=jfKfPfyJRdk 😊"

        elif any(k in t for k in ["nhạc", "âm nhạc", "music", "thư giãn", "hát", "nghe"]):
            return "Bo tặng bạn bản nhạc không lời piano vô cùng thư giãn này để tăng cường độ tập trung nhé: https://www.youtube.com/watch?v=84eKpe6r90A 🎵 Chúc bạn có một phiên học thật hiệu quả!"

        elif any(k in t for k in ["xong", "hoàn thành", "done", "đã học", "làm được", "qua rồi", "đạt", "hoàn tất"]):
            if focus_minutes > 0:
                return f"Tuyệt vời quá! 🎉 Bạn đã hoàn thành xuất sắc và tích lũy được {focus_minutes} phút tập trung rồi! Hãy tự hào về nỗ lực của bản thân hôm nay nhé! 🔥"
            else:
                return "Tuyệt đỉnh! Mỗi bước hoàn thành đều giúp bạn tiến gần hơn tới mục tiêu. Hãy tiếp tục giữ vững phong độ này nhé! 🎉"

        elif any(k in t for k in ["?", "sao", "thế nào", "cách", "làm gì", "nên", "gợi ý", "tập trung", "mục tiêu"]):
            return "Để tập trung tốt hơn, bạn hãy thử phương pháp Pomodoro (25 phút học, 5 phút nghỉ) nhé. Nhớ tắt bớt thông báo điện thoại để không bị xao nhãng. Bo tin bạn sẽ làm được mà! 💪"

        elif any(k in t for k in ["chào", "hi", "hello", "hế lô", "alo", "hey"]):
            if focus_minutes > 0:
                return f"Chào bạn! Bạn đang học rất chăm chỉ được {focus_minutes} phút rồi đấy! Có cần Bo trợ giúp hay tiếp thêm động lực gì không nào? 🔥"
            else:
                return "Chào bạn! Bo đã sẵn sàng đồng hành cùng bạn rồi đây. Hôm nay bạn cảm thấy thế nào? Bạn có muốn nghe một chút nhạc nhẹ để bắt đầu học không? 😊"

        else:
            if focus_minutes > 60:
                return f"Bạn đã học được {focus_minutes} phút rồi đấy, thật là đáng khâm phục! Đừng quên nghỉ ngơi một chút giữa các hiệp học nhé. Bo luôn ở đây để cổ vũ bạn! 💖"
            elif focus_minutes > 0:
                return f"Bo vẫn đang theo dõi và cổ vũ bạn đây! Bạn đã học được {focus_minutes} phút rất tập trung rồi, cố gắng duy trì nhé! 🚀"
            else:
                return "Bo nghe đây! Cứ chia nhỏ mục tiêu ra và thực hiện từng chút một nhé. Bạn muốn cùng Bo học môn gì hôm nay nào? 😊"
