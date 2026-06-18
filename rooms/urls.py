from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rooms.views import RoomViewSet

router = DefaultRouter()
router.register(r"", RoomViewSet, basename="room")

urlpatterns = [
    path("", include(router.urls)),
]
