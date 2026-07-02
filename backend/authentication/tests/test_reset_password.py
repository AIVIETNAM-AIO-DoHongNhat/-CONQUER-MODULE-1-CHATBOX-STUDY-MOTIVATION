"""Tests for ResetPasswordView."""

from rest_framework import status

from authentication.models import CustomUser
from authentication.tests.base import AuthenticationTestCase


class ResetPasswordViewTests(AuthenticationTestCase):
    def test_reset_password_success(self):
        """Valid email, OTP and new password resets password."""
        user = self.create_user(
            email="reset@example.com",
            password="oldpass123",
            is_verified=True,
            recovery_token="654321",
            recovery_token_expires_at=self.future_expiry(),
        )
        response = self.client.put(
            "/api/v1/auth/reset-password/",
            {
                "email": "reset@example.com",
                "otp": "654321",
                "new_password": "newpass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        user.refresh_from_db()
        self.assertTrue(user.check_password("newpass123"))
        self.assertIsNone(user.recovery_token)
        self.assertIsNone(user.recovery_token_expires_at)

    def test_reset_password_invalid_otp_returns_400(self):
        """Wrong OTP returns 400."""
        self.create_user(
            email="reset@example.com",
            is_verified=True,
            recovery_token="654321",
            recovery_token_expires_at=self.future_expiry(),
        )
        response = self.client.put(
            "/api/v1/auth/reset-password/",
            {
                "email": "reset@example.com",
                "otp": "999999",
                "new_password": "newpass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_expired_otp_returns_400(self):
        """Expired OTP returns 400."""
        self.create_user(
            email="reset@example.com",
            is_verified=True,
            recovery_token="654321",
            recovery_token_expires_at=self.past_expiry(),
        )
        response = self.client.put(
            "/api/v1/auth/reset-password/",
            {
                "email": "reset@example.com",
                "otp": "654321",
                "new_password": "newpass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_nonexistent_email_returns_400_or_404(self):
        """Non-existent email returns error."""
        response = self.client.put(
            "/api/v1/auth/reset-password/",
            {
                "email": "nonexistent@example.com",
                "otp": "123456",
                "new_password": "newpass123",
            },
            format="json",
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND),
        )

    def test_reset_password_missing_fields_returns_400(self):
        """Missing required fields returns 400."""
        response = self.client.put(
            "/api/v1/auth/reset-password/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_password_short_password_returns_400(self):
        """New password shorter than MIN_PASSWORD_LENGTH returns 400."""
        self.create_user(
            email="reset@example.com",
            is_verified=True,
            recovery_token="654321",
            recovery_token_expires_at=self.future_expiry(),
        )
        response = self.client.put(
            "/api/v1/auth/reset-password/",
            {
                "email": "reset@example.com",
                "otp": "654321",
                "new_password": "short",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
