from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.serializers.reset_password_serializer import (
    ResetPasswordSerializer,
)


class ResetPasswordView(APIView):
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Reset a password",
        description="""
        Reset password using email, OTP, and new password.
        Returns JWT access and refresh tokens after successful reset.
        """,
        request=ResetPasswordSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="Password reset successfully"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def put(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = serializer.save()
        return Response(response_data, status=status.HTTP_200_OK)
