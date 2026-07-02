from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiResponse, extend_schema

from authentication.serializers.login_serializer import LoginSerializer


class LoginView(APIView):
    serializer_class = LoginSerializer

    @extend_schema(
        summary="Login a user",
        description="""
        Authenticate with email and password.
        Returns JWT access and refresh tokens.
        """,
        request=LoginSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="User logged in successfully"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid credentials"),
        },
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        response_data = serializer.save()
        return Response(response_data, status=status.HTTP_200_OK)
