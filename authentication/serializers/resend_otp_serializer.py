from rest_framework import serializers
from authentication.services.auth_service import AuthService
from authentication.services.mail_service import MailService

auth_service = AuthService()
mail_service = MailService()


class ResendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        if attrs.get('email') is not None:
            attrs['email'] = attrs['email'].strip()
        return attrs

    def create(self, validated_data):
        email = validated_data.get('email')
        user = auth_service.get_user_by_email(email)
        otp, expiry_time = auth_service.generate_otp()
        user.recovery_token = otp
        user.recovery_token_expires_at = expiry_time
        user.save()
        email_heading = "Reset Your Password"
        action_description = "We received a request to reset the password for your account. Please use the verification code below to authorize this change." 
        mail_service.send_otp_email(email, otp, expiry_time, email_heading, action_description)
        return user
