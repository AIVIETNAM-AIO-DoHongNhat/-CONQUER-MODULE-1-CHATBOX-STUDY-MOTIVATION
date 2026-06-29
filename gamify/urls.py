from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gamify.views import DailyGoalViewSet

router = DefaultRouter()
router.register(r"daily-goals", DailyGoalViewSet, basename="daily-goal")

urlpatterns = [
    path("", include(router.urls)),
]
