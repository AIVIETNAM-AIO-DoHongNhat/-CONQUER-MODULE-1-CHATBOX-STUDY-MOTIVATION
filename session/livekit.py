"""Cấp LiveKit access token cho client tham gia phòng học realtime.

Token được KÝ ở server bằng LIVEKIT_API_SECRET (bí mật, không lộ ra client). Client
chỉ nhận token + wss URL rồi kết nối THẲNG tới LiveKit Cloud — media không đi qua
backend này, nên endpoint chỉ là một thao tác nhẹ (ký JWT vài ms).
"""

from django.conf import settings
from livekit import api
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from rooms.models import Room


def room_name_for(room_id) -> str:
    """Tên phòng LiveKit suy ra từ id phòng trong DB → mỗi Room = một phòng media."""
    return f"room-{room_id}"


class LiveKitTokenView(APIView):
    """POST /api/v1/livekit/token/ → { token, url, room, identity }.

    Body: { "room_id": <id phòng đang mở> }. Người dùng phải đăng nhập (JWT). Token
    chỉ cho phép tham gia đúng phòng của room_id.
    """

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        if not (
            settings.LIVEKIT_API_KEY
            and settings.LIVEKIT_API_SECRET
            and settings.LIVEKIT_URL
        ):
            return Response(
                {"detail": "LiveKit chưa được cấu hình trên server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        room_id = request.data.get("room_id")
        if not room_id:
            return Response(
                {"detail": "room_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Chỉ cho token khi phòng có thật và đang mở (tránh cấp quyền vào phòng lạ).
        try:
            room = Room.objects.get(pk=room_id, is_active=True)
        except Room.DoesNotExist:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        room_name = room_name_for(room.id)
        # identity phải duy nhất trong phòng → dùng user id. name để hiển thị.
        identity = str(user.id)
        display_name = getattr(user, "full_name", "") or user.email

        token = (
            api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
            .with_identity(identity)
            .with_name(display_name)
            .with_grants(
                api.VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                )
            )
        )

        return Response(
            {
                "token": token.to_jwt(),
                "url": settings.LIVEKIT_URL,
                "room": room_name,
                "identity": identity,
            },
            status=status.HTTP_200_OK,
        )
