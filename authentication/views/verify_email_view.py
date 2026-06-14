from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.serializers.verify_email_serializer import VerifyEmailSerializer
from drf_spectacular.utils import OpenApiResponse, extend_schema


class VerifyEmailView(APIView):
    serializer_class = VerifyEmailSerializer

    @extend_schema(
        summary="Verify an email",
        description="""
            Verify an email.
            Returns a success message.
            """,
        request=VerifyEmailSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="Email verified successfully"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid data"),
        },
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)
