"""Tests for ResendOtpView."""

from rest_framework import status

from authentication.models import CustomUser
from authentication.tests.base import AuthenticationTestCase


class ResendOtpViewTests(AuthenticationTestCase):
    def test_resend_otp_success(self):
        """Valid unverified email resends OTP and returns success."""
        user = self.create_user(
            email="resend@example.com",
            is_verified=False,
            verification_token="111111",
            verification_token_expires_at=self.past_expiry(),
        )
        response = self.client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "resend@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("message"), "OTP resent successfully!")
        user.refresh_from_db()
        self.assertIsNotNone(user.recovery_token)
        self.assertNotEqual(user.recovery_token, "111111")
        self.assertIsNotNone(user.recovery_token_expires_at)

    def test_resend_otp_already_verified_returns_400(self):
        """Already verified user returns 400."""
        user = self.create_user(email="verified@example.com", is_verified=True)
        response = self.client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "verified@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertIsNotNone(user.recovery_token)

    def test_resend_otp_nonexistent_email_returns_400(self):
        """Non-existent email returns 400."""
        response = self.client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "nonexistent@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resend_otp_missing_email_returns_400(self):
        """Missing email returns 400."""
        response = self.client.post(
            "/api/v1/auth/resend-otp/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
