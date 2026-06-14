from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from authentication.serializers.user_serializer import UserSerializer
from authentication.models.user import CustomUser
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404


class UserView(ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @extend_schema(
        summary="Get all users",
        description="""
            Get all users.
            Returns a list of users.
            """,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="List of users"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get a user by ID",
        description="""
            Get a user.
            Returns a user by ID.
            """,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="User"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def retrieve(self, request, pk=None, *args, **kwargs):
        user = get_object_or_404(self.queryset, pk=pk)
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Get a user profile",
        description="""
            Get a user profile.
            Returns a user profile.
            """,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="User profile"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def profile(self, request):
        user = get_object_or_404(self.queryset, pk=request.user.id)
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
