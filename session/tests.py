from rest_framework import status
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
        # 1. Start session
        response = self.client.post(
            "/api/v1/sessions/",
            {"room": self.room.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        session_id = response.data["id"]
        self.assertTrue(response.data["is_active"])
        self.assertEqual(response.data["room"], self.room.id)

        # Try to start another session (should fail)
        response_fail = self.client.post(
            "/api/v1/sessions/",
            {"room": self.room.id},
            format="json",
        )
        self.assertEqual(response_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Get active session
        response_active = self.client.get("/api/v1/sessions/active/")
        self.assertEqual(response_active.status_code, status.HTTP_200_OK)
        self.assertEqual(response_active.data["id"], session_id)

        # 3. End session and verify achieved_minutes increase
        response_end = self.client.post(
            "/api/v1/sessions/end/",
            {"focus_minutes": 45},
            format="json",
        )
        self.assertEqual(response_end.status_code, status.HTTP_200_OK)
        self.assertFalse(response_end.data["session"]["is_active"])
        self.assertEqual(response_end.data["session"]["focus_minutes"], 45)
        self.assertEqual(response_end.data["daily_goal"]["achieved_minutes"], 45)

        # Verify database
        session = Session.objects.get(id=session_id)
        self.assertFalse(session.is_active)
        self.assertEqual(session.focus_minutes, 45)

        goal = DailyGoal.objects.get(user=self.user, date=date.today())
        self.assertEqual(goal.achieved_minutes, 45)
