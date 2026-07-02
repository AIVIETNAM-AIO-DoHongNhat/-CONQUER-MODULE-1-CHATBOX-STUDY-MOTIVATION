from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gamify.views import DailyGoalViewSet, UserBadgeListView, WeeklyLeaderboardView

router = DefaultRouter()
router.register(r"daily-goals", DailyGoalViewSet, basename="daily-goal")

urlpatterns = [
    path("", include(router.urls)),
    path("badges/", UserBadgeListView.as_view(), name="user-badges"),
    path("leaderboard/weekly/", WeeklyLeaderboardView.as_view(), name="weekly-leaderboard"),
]
