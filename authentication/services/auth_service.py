import random
from django.contrib.auth import authenticate
from authentication.models.user import CustomUser
from datetime import datetime, timedelta, timezone
from authentication.contants import OTP_EXPIRATION_TIME
from core.exceptions import BaseAPIException
from rest_framework_simplejwt.tokens import RefreshToken


class AuthService:
    def __init__(self):
        pass

    def generate_otp(self):
        otp = random.randint(100000, 999999)
        expiry_time = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRATION_TIME)
        return otp, expiry_time

    def generate_token(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

    def get_user_by_email(self, email):
        try:
            user = CustomUser.objects.get(email=email)
            return user
        except CustomUser.DoesNotExist:
            raise BaseAPIException("User with this email does not exist.")

    def authenticate_user(self, email, password):
        user = self.get_user_by_email(email)
        if not user.is_verified:
            raise BaseAPIException("Email is not verified.")

        user = authenticate(email=email, password=password)
        if user is None:
            raise BaseAPIException("Invalid email or password.")
        return user
