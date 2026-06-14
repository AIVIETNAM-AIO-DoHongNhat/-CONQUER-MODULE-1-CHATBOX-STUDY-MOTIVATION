from rest_framework import serializers
from authentication.models import PendingRegistration, CustomUser
from authentication.services.auth_service import AuthService
from authentication.services.mail_service import MailService
from core.exceptions import BaseAPIException
from datetime import datetime, timezone

auth_service = AuthService()
mail_service = MailService()


class RequestRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise BaseAPIException("Email already exists")
        if PendingRegistration.objects.filter(email=email).exists():
            raise BaseAPIException("Email already registered, please verify")
        return attrs

    def create(self, validated_data):
        otp, expiry_time = auth_service.generate_otp()
        expiry_minutes = int((expiry_time - datetime.now(timezone.utc)).total_seconds() // 60)

        pending_reg = PendingRegistration.objects.create(
            email=validated_data['email'],
            verification_token=otp,
            verification_token_expires_at=expiry_time,
        )

        email_heading = "Verify Your Account"
        action_description = "Please use the verification code below to verify your email."
        mail_service.send_otp_email(validated_data['email'], otp, expiry_minutes, email_heading, action_description)

        return pending_reg
