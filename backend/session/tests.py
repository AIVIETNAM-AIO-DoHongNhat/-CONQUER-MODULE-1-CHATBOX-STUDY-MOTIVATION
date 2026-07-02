from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from authentication.tests.base import AuthenticationTestCase
from rooms.models import Room
from session.models import Session
from gamify.models import DailyGoal
from datetime import date

class SessionAndGoalTests(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user(email="study@example.com")
        self.headers = self.get_auth_headers(self.user)
        self.token = self.headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        
        self.room = Room.objects.create(name="Study Room", description="Test Room")

    def test_daily_goal_get_and_set_today(self):
        """Test retrieving and setting today's daily goal target."""
        # Retrieve today's goal (should auto-create with 0 target)
        response = self.client.get("/api/v1/daily-goals/today/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["target_minutes"], 0)
        self.assertEqual(response.data["achieved_minutes"], 0)
        self.assertEqual(response.data["date"], str(date.today()))

        # Set target_minutes
        response = self.client.post(
            "/api/v1/daily-goals/today/",
            {"target_minutes": 60},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["target_minutes"], 60)
        
        # Verify db
        goal = DailyGoal.objects.get(user=self.user, date=date.today())
        self.assertEqual(goal.target_minutes, 60)

    def test_session_lifecycle_and_daily_goal_update(self):
        """Test starting, retrieving, and ending a session, which updates DailyGoal."""
        # 1. Start session (chọn thời lượng học dự kiến 60')
        response = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id, "planned_minutes": 60},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        session_id = response.data["id"]
        self.assertEqual(response.data["status"], Session.STATUS_RUNNING)
        self.assertEqual(response.data["room"], self.room.id)
        self.assertEqual(response.data["planned_minutes"], 60)

        # Try to start another session (should fail)
        response_fail = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id},
            format="json",
        )
        self.assertEqual(response_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Get active session
        response_active = self.client.get("/api/v1/sessions/active/")
        self.assertEqual(response_active.status_code, status.HTTP_200_OK)
        self.assertEqual(response_active.data["id"], session_id)

        # Lùi started_at về 50' trước để mô phỏng một phiên đã học thật (số phút
        # focus không thể vượt thời gian thực đã trôi).
        Session.objects.filter(id=session_id).update(
            started_at=timezone.now() - timedelta(minutes=50)
        )

        # 3. End session and verify achieved_minutes increase
        response_end = self.client.post(
            "/api/v1/sessions/end/",
            {"focus_minutes": 45},
            format="json",
        )
        self.assertEqual(response_end.status_code, status.HTTP_200_OK)
        self.assertEqual(response_end.data["session"]["status"], Session.STATUS_COMPLETED)
        self.assertEqual(response_end.data["session"]["focus_minutes"], 45)
        self.assertEqual(response_end.data["daily_goal"]["achieved_minutes"], 45)

        # Verify database
        session = Session.objects.get(id=session_id)
        self.assertEqual(session.status, Session.STATUS_COMPLETED)
        self.assertEqual(session.focus_minutes, 45)

        goal = DailyGoal.objects.get(user=self.user, date=date.today())
        self.assertEqual(goal.achieved_minutes, 45)

    def test_end_caps_focus_minutes_at_real_elapsed_time(self):
        """Không thể ghi công nhiều phút hơn thời gian thực đã trôi."""
        response = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id},
            format="json",
        )
        session_id = response.data["id"]
        # Mới trôi 2 phút nhưng client khai 999 phút → chặn còn tối đa 2.
        Session.objects.filter(id=session_id).update(
            started_at=timezone.now() - timedelta(minutes=2)
        )

        response_end = self.client.post(
            "/api/v1/sessions/end/",
            {"focus_minutes": 999},
            format="json",
        )
        self.assertEqual(response_end.status_code, status.HTTP_200_OK)
        self.assertEqual(response_end.data["session"]["focus_minutes"], 2)
        self.assertEqual(response_end.data["daily_goal"]["achieved_minutes"], 2)

    def test_expired_session_credits_zero_minutes(self):
        """Phiên bỏ dở (quá hạn) không được cộng phút nào vào mục tiêu."""
        response = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id},
            format="json",
        )
        session_id = response.data["id"]
        # Lùi started_at về rất lâu trước → phiên đã quá hạn (mồ côi).
        Session.objects.filter(id=session_id).update(
            started_at=timezone.now() - timedelta(hours=5)
        )

        response_end = self.client.post(
            "/api/v1/sessions/end/",
            {"focus_minutes": 120},
            format="json",
        )
        self.assertEqual(response_end.status_code, status.HTTP_200_OK)
        self.assertEqual(response_end.data["session"]["focus_minutes"], 0)
        self.assertEqual(response_end.data["daily_goal"]["achieved_minutes"], 0)

    def test_end_caps_focus_minutes_at_planned_duration(self):
        """Không thể ghi công nhiều phút hơn thời lượng dự kiến của phiên."""
        response = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id, "planned_minutes": 30},
            format="json",
        )
        session_id = response.data["id"]
        # Đã trôi 40' thật (chưa quá hạn) nhưng phiên chỉ dự kiến 30' → tối đa 30.
        Session.objects.filter(id=session_id).update(
            started_at=timezone.now() - timedelta(minutes=40)
        )

        response_end = self.client.post(
            "/api/v1/sessions/end/",
            {"focus_minutes": 999},
            format="json",
        )
        self.assertEqual(response_end.status_code, status.HTTP_200_OK)
        self.assertEqual(response_end.data["session"]["focus_minutes"], 30)

    def test_start_rejects_invalid_planned_minutes(self):
        """Thời lượng dự kiến ngoài khoảng cho phép bị từ chối."""
        response = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id, "planned_minutes": 0},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("planned_minutes", response.data)

    def test_active_auto_closes_expired_session_and_allows_new(self):
        """Vào phòng lại khi còn phiên quá hạn → phiên cũ tự đóng, mở được phiên mới."""
        response = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id},
            format="json",
        )
        old_id = response.data["id"]
        Session.objects.filter(id=old_id).update(
            started_at=timezone.now() - timedelta(hours=5)
        )

        # /active dọn phiên quá hạn → báo không còn phiên đang chạy.
        response_active = self.client.get("/api/v1/sessions/active/")
        self.assertEqual(response_active.status_code, status.HTTP_404_NOT_FOUND)

        old = Session.objects.get(id=old_id)
        self.assertEqual(old.status, Session.STATUS_COMPLETED)
        self.assertEqual(old.focus_minutes, 0)

        # Không còn phiên chặn → bắt đầu phiên mới thành công.
        response_new = self.client.post(
            "/api/v1/sessions/start/",
            {"room_id": self.room.id},
            format="json",
        )
        self.assertEqual(response_new.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(response_new.data["id"], old_id)

        # Phiên quá hạn tự đóng nhưng KHÔNG tạo/ghi mục tiêu ngày (không cộng phút).
        self.assertFalse(
            DailyGoal.objects.filter(user=self.user, date=date.today()).exists()
        )

    def test_ai_chat_endpoint_missing_message(self):
        """Test AI Chat endpoint returns 400 Bad Request when message is missing."""
        response = self.client.post("/api/v1/sessions/chat/", {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_ai_chat_endpoint_fallback(self):
        """Test AI Chat endpoint fallback reply when using default env configuration."""
        response = self.client.post(
            "/api/v1/sessions/chat/",
            {"message": "Chào Bo"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("reply", response.data)
        self.assertTrue(len(response.data["reply"]) > 0)

