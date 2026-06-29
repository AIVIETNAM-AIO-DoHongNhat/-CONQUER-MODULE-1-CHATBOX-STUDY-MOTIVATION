from django.test import TestCase
from gamify.models import DailyGoal
from authentication.models import CustomUser
from datetime import date

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
