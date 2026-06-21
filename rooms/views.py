from rest_framework import mixins, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework_simplejwt.authentication import JWTAuthentication
from drf_spectacular.utils import OpenApiResponse, extend_schema

from rooms.models import Room
from rooms.serializers.room_serializer import RoomSerializer


class RoomViewSet(mixins.CreateModelMixin, ReadOnlyModelViewSet):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication, SessionAuthentication]

    @extend_schema(
        summary="Create a new room",
        request=RoomSerializer,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(description="Room created")
        },
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        summary="List active rooms",
        responses={status.HTTP_200_OK: OpenApiResponse(description="Room list")},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Get room detail",
        responses={status.HTTP_200_OK: OpenApiResponse(description="Room detail")},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
