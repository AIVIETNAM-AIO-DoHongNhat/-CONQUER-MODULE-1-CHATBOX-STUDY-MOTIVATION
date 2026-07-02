from rest_framework import serializers
from authentication.services.auth_service import AuthService
from authentication.services.mail_service import MailService
from datetime import datetime, timezone

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
        expiry_minutes = int((expiry_time - datetime.now(timezone.utc)).total_seconds() // 60)
        email_heading = "Đặt lại mật khẩu"
        action_description = "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Hãy dùng mã xác thực bên dưới để xác nhận thay đổi này."
        mail_service.send_otp_email(email, otp, expiry_minutes, email_heading, action_description)
        user.recovery_token = otp
        user.recovery_token_expires_at = expiry_time
        user.save()
        return user
