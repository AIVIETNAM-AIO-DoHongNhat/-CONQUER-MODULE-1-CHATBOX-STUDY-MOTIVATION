from django.test import TestCase
from gamify.models import Badge, DailyGoal, UserBadge
from gamify.services import unlock_badges_for_user
from authentication.models import CustomUser
from authentication.tests.base import AuthenticationTestCase
from datetime import date
from django.utils import timezone
from rooms.models import Room
from session.models import Session

class DailyGoalModelTest(TestCase):
    def test_daily_goal_creation(self):
        """Test daily goal model creation and string representation."""
        user = CustomUser.objects.create_user(
            email="gamify@example.com",
            username="gamify",
            password="password123",
            full_name="Gamify User"
        )
        goal = DailyGoal.objects.create(
            user=user,
            date=date.today(),
            target_minutes=60,
            achieved_minutes=15
        )
        self.assertEqual(goal.user, user)
        self.assertEqual(goal.target_minutes, 60)
        self.assertEqual(goal.achieved_minutes, 15)
        self.assertIn("gamify@example.com", str(goal))


class BadgeUnlockTest(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="badge@example.com",
            username="badge",
            password="password123",
            full_name="Badge User",
        )
        self.room = Room.objects.create(name="Badge Room")

    def test_unlocks_badge_when_progress_reaches_threshold(self):
        badge = Badge.objects.create(
            code="focus_100_test",
            name="100 Focus Minutes Test",
            description="Complete 100 focus minutes.",
            condition_type=Badge.CONDITION_TOTAL_FOCUS_MINUTES,
            threshold=100,
        )
        Session.objects.create(
            user=self.user,
            room=self.room,
            status=Session.STATUS_COMPLETED,
            focus_minutes=100,
        )

        unlocked_badges = unlock_badges_for_user(self.user)

        self.assertEqual([badge.id for badge in unlocked_badges], [badge.id])
        self.assertTrue(UserBadge.objects.filter(user=self.user, badge=badge).exists())

    def test_does_not_unlock_duplicate_badge(self):
        badge = Badge.objects.create(
            code="sessions_1_test",
            name="1 Session Test",
            description="Complete 1 session.",
            condition_type=Badge.CONDITION_TOTAL_SESSIONS,
            threshold=1,
        )
        Session.objects.create(
            user=self.user,
            room=self.room,
            status=Session.STATUS_COMPLETED,
            focus_minutes=10,
        )

        first_unlock = unlock_badges_for_user(self.user)
        second_unlock = unlock_badges_for_user(self.user)

        self.assertEqual([badge.id for badge in first_unlock], [badge.id])
        self.assertEqual(second_unlock, [])
        self.assertEqual(UserBadge.objects.filter(user=self.user, badge=badge).count(), 1)


class UserBadgeAPITest(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user(email="badge-api@example.com")
        self.headers = self.get_auth_headers(self.user)
        self.token = self.headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_lists_badges_with_unlock_status(self):
        unlocked_badge = Badge.objects.create(
            code="api_unlocked_badge",
            name="API Unlocked Badge",
            description="Already unlocked.",
            condition_type=Badge.CONDITION_XP,
            threshold=10,
        )
        locked_badge = Badge.objects.create(
            code="api_locked_badge",
            name="API Locked Badge",
            description="Not unlocked yet.",
            condition_type=Badge.CONDITION_XP,
            threshold=100,
        )
        UserBadge.objects.create(user=self.user, badge=unlocked_badge)

        response = self.client.get("/api/v1/badges/")

        self.assertEqual(response.status_code, 200)
        badges_by_code = {badge["code"]: badge for badge in response.data}
        self.assertTrue(badges_by_code[unlocked_badge.code]["is_unlocked"])
        self.assertIsNotNone(badges_by_code[unlocked_badge.code]["unlocked_at"])
        self.assertFalse(badges_by_code[locked_badge.code]["is_unlocked"])
        self.assertIsNone(badges_by_code[locked_badge.code]["unlocked_at"])

    def test_weekly_leaderboard_returns_ranked_users(self):
        other_user = self.create_user(email="leaderboard-other@example.com")
        room = Room.objects.create(name="Leaderboard Room")
        Session.objects.create(
            user=self.user,
            room=room,
            started_at=timezone.now(),
            ended_at=timezone.now(),
            status=Session.STATUS_COMPLETED,
            focus_minutes=90,
        )
        Session.objects.create(
            user=other_user,
            room=room,
            started_at=timezone.now(),
            ended_at=timezone.now(),
            status=Session.STATUS_COMPLETED,
            focus_minutes=30,
        )

        response = self.client.get("/api/v1/leaderboard/weekly/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["user"]["id"], self.user.id)
        self.assertEqual(response.data["results"][0]["total_minutes"], 90)
        self.assertEqual(response.data["current_user"]["rank"], 1)
