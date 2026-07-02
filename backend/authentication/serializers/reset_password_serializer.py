from rest_framework import serializers
from datetime import datetime, timezone
from authentication.contants import MIN_PASSWORD_LENGTH
from authentication.services.auth_service import AuthService
from core.exceptions import BaseAPIException

auth_service = AuthService()


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=MIN_PASSWORD_LENGTH)

    def validate(self, attrs):
        email = attrs.get("email")
        otp = attrs.get("otp")
        user = auth_service.get_user_by_email(email)
        if user.recovery_token != otp:
            raise BaseAPIException("Invalid OTP")
        if user.recovery_token_expires_at < datetime.now(tz=timezone.utc):
            raise BaseAPIException("OTP expired")
        return attrs
    
    def save(self):
        email = self.validated_data['email']
        new_password = self.validated_data['new_password']
        user = auth_service.get_user_by_email(email)
        user.set_password(new_password)
        user.recovery_token = None
        user.recovery_token_expires_at = None
        user.save()

        return auth_service.generate_token(user)
