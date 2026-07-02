from django.urls import include, path
from rest_framework.routers import DefaultRouter

from session.livekit import LiveKitTokenView
from session.views import SessionViewSet

router = DefaultRouter()
router.register(r"sessions", SessionViewSet, basename="session")

urlpatterns = [
    path("livekit/token/", LiveKitTokenView.as_view(), name="livekit-token"),
    path("", include(router.urls)),
]
