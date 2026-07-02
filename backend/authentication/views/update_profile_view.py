from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.serializers.update_profile_serializer import (
    UpdateProfileSerializer,
)
from authentication.serializers.user_serializer import UserSerializer


class UpdateProfileView(APIView):
    serializer_class = UpdateProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        summary="Update current user's profile",
        description="""
        Update the authenticated user's profile.
        Returns the updated user.
        """,
        request=UpdateProfileSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(
                description="User updated successfully"
            ),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def patch(self, request):
        serializer = self.serializer_class(
            instance=request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "Profile updated successfully.",
                "data": UserSerializer(user, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )
