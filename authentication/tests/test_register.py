"""Tests for RegisterView."""

from rest_framework import status

from authentication.models import CustomUser
from authentication.tests.base import AuthenticationTestCase


class RegisterViewTests(AuthenticationTestCase):
    def test_register_success_creates_user_and_returns_201(self):
        """Valid email creates user and returns success message."""
        response = self.client.post(
            "/api/v1/auth/register/",
            {
                "email": "newuser@example.com",
                "full_name": "New User",
                "password": "newuserpass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("message"), "Register successful!")
        from authentication.models import PendingRegistration
        self.assertTrue(
            PendingRegistration.objects.filter(email="newuser@example.com").exists()
        )
        pending = PendingRegistration.objects.get(email="newuser@example.com")
        self.assertEqual(pending.full_name, "New User")
        self.assertIsNotNone(pending.verification_token)
        self.assertIsNotNone(pending.verification_token_expires_at)

    def test_register_duplicate_email_returns_400(self):
        """Registering with existing email returns 400."""
        self.create_user(email="existing@example.com")
        response = self.client.post(
            "/api/v1/auth/register/",
            {"email": "existing@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_missing_email_returns_400(self):
        """Missing email returns 400."""
        response = self.client.post(
            "/api/v1/auth/register/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_email_returns_400(self):
        """Invalid email format returns 400."""
        response = self.client.post(
            "/api/v1/auth/register/",
            {"email": "not-an-email"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
