from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from authentication.serializers.resend_otp_serializer import ResendOtpSerializer


class ResendOtpView(APIView):
    serializer_class = ResendOtpSerializer

    @extend_schema(
        summary="Resend signup OTP",
        description="""
        Resend OTP for a pending signup session.
        Returns a success message.
        """,
        request=ResendOtpSerializer,
        responses={
            status.HTTP_200_OK: OpenApiResponse(description="OTP resent successfully"),
            status.HTTP_400_BAD_REQUEST: OpenApiResponse(description="Invalid signup session or data"),
        },
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "OTP resent successfully!"},
            status=status.HTTP_200_OK,
        )
