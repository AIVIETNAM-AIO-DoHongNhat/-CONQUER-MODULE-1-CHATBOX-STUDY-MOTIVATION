from rest_framework import serializers
from datetime import datetime, timezone
from authentication.models import CustomUser, PendingRegistration
from authentication.services.auth_service import AuthService
from core.exceptions import BaseAPIException

auth_service = AuthService()


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        otp = attrs.get('otp')

        try:
            pending_reg = PendingRegistration.objects.get(email=email)
        except PendingRegistration.DoesNotExist:
            raise BaseAPIException("No pending registration found for this email")

        if pending_reg.verification_token_expires_at < datetime.now(tz=timezone.utc):
            pending_reg.delete()
            raise BaseAPIException("OTP expired!")

        if pending_reg.verification_token != otp:
            raise BaseAPIException("Invalid OTP!")


        user = CustomUser.objects.create_user(
            email=pending_reg.email,
            full_name=pending_reg.full_name,
            password=pending_reg.password,
            username=pending_reg.email.split('@')[0],
            is_verified=True,
        )
        user.save()

        pending_reg.delete()

        return attrs
