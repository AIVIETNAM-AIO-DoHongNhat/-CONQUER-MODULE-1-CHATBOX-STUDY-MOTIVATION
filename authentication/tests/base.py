"""Base test case and helpers for authentication tests."""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from django.conf import settings
from django.test import override_settings
from rest_framework.test import APITestCase

from authentication.models.user import CustomUser


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="test@example.com",
)
class AuthenticationTestCase(APITestCase):
    """Base class for auth tests with common helpers."""

    def create_user(
        self,
        email="user@example.com",
        password="testpass123",
        full_name= "Test User",
        phone_number="1234567890",
        profile_picture="https://example.com/profile.jpg",
        is_verified=True,
        verification_token=None,
        verification_token_expires_at=None,
        recovery_token=None,
        recovery_token_expires_at=None,
    ):


        user = CustomUser.objects.create_user(
            email=email,
            username=email.split("@")[0],
            password=password or "testpass123",
            full_name=full_name,
            phone_number=phone_number,
            profile_picture=profile_picture,
            is_verified=is_verified,
            verification_token=verification_token,
            verification_token_expires_at=verification_token_expires_at,
            recovery_token=recovery_token,
            recovery_token_expires_at=recovery_token_expires_at,
        )
        return user

    def get_auth_headers(self, user):
        """Return headers with valid JWT for the user."""
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {refresh.access_token}"}

    def future_expiry(self, minutes=10):
        """Return a datetime in the future for OTP/recovery token expiry."""
        return datetime.now(tz=timezone.utc) + timedelta(minutes=minutes)

    def past_expiry(self, minutes=10):
        """Return a datetime in the past for expired tokens."""
        return datetime.now(tz=timezone.utc) - timedelta(minutes=minutes)
