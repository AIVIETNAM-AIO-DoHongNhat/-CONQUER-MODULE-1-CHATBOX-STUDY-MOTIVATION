"""Tests for VerifyEmailView."""

from rest_framework import status

from authentication.models import CustomUser, PendingRegistration
from authentication.tests.base import AuthenticationTestCase


class VerifyEmailViewTests(AuthenticationTestCase):
    def test_verify_email_success(self):
        """Valid email and OTP verifies user and returns success."""
        PendingRegistration.objects.create(
            email="verify@example.com",
            full_name="Verify User",
            password="testpassword123",
            verification_token="123456",
            verification_token_expires_at=self.future_expiry(),
        )
        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {"email": "verify@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get("message"), "Email verified successfully!")
        
        # Check that user is created in CustomUser
        user = CustomUser.objects.get(email="verify@example.com")
        self.assertTrue(user.is_verified)
        
        # Check that PendingRegistration is deleted
        self.assertFalse(PendingRegistration.objects.filter(email="verify@example.com").exists())

    def test_verify_email_invalid_otp_returns_400(self):
        """Wrong OTP returns 400."""
        PendingRegistration.objects.create(
            email="verify@example.com",
            full_name="Verify User",
            password="testpassword123",
            verification_token="123456",
            verification_token_expires_at=self.future_expiry(),
        )
        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {"email": "verify@example.com", "otp": "999999"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_expired_otp_returns_400(self):
        """Expired OTP returns 400."""
        PendingRegistration.objects.create(
            email="verify@example.com",
            full_name="Verify User",
            password="testpassword123",
            verification_token="123456",
            verification_token_expires_at=self.past_expiry(),
        )
        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {"email": "verify@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_already_verified_returns_400(self):
        """Already verified user returns 400."""
        self.create_user(
            email="verify@example.com",
            is_verified=True,
        )
        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {"email": "verify@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_nonexistent_email_returns_400(self):
        """Non-existent email returns 400."""
        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {"email": "nonexistent@example.com", "otp": "123456"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_missing_fields_returns_400(self):
        """Missing email or OTP returns 400."""
        response = self.client.post(
            "/api/v1/auth/verify-email/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
