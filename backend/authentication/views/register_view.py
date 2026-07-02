from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.views import APIView, Response
from rest_framework import status
from authentication.serializers.register_serializer import RegisterSerializer


class RegisterView(APIView):
    serializer_class = RegisterSerializer

    @extend_schema(
        summary="Register a user",
        description="""
            Register a user with email.
            Returns a success message.
            """,
        request=RegisterSerializer,
        responses={
            status.HTTP_201_CREATED: OpenApiResponse(description="User registered successfully"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': 'Register successful!',
        }, status=status.HTTP_201_CREATED)
