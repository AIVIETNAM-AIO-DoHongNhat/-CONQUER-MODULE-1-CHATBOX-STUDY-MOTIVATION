from django.urls import path, include
from rest_framework.routers import DefaultRouter
from session.views import SessionViewSet

router = DefaultRouter()
router.register(r"sessions", SessionViewSet, basename="session")

urlpatterns = [
    path("", include(router.urls)),
from django.urls import path
from session.views import StartSessionView, EndSessionView

urlpatterns = [
    path("start/", StartSessionView.as_view(), name="session-start"),
    path("end/", EndSessionView.as_view(), name="session-end"),
]
