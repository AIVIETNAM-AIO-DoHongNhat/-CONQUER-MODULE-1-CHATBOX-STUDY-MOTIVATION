from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from authentication.serializers.logout_serializer import LogoutSerializer
from core.exceptions import BaseAPIException


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(
        summary="Logout user",
        description="Blacklist refresh token to logout the user.",
        request=LogoutSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="Logout successful"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(
                description="Invalid refresh token"
            ),
        },
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            RefreshToken(serializer.validated_data["refresh_token"]).blacklist()
        except TokenError:
            raise BaseAPIException("Invalid or expired refresh token.")

        return Response(
            {"message": "Logout successful"},
            status=status.HTTP_200_OK,
        )
