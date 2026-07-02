"""Tests for LoginView."""

from rest_framework import status

from authentication.tests.base import AuthenticationTestCase


class LoginViewTests(AuthenticationTestCase):
    def test_login_success_returns_tokens(self):
        """Valid credentials return access and refresh tokens."""
        self.create_user(
            email="login@example.com",
            password="validpass123",
            is_verified=True,
        )
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "login@example.com", "password": "validpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_invalid_password_returns_400(self):
        """Wrong password returns 400."""
        self.create_user(
            email="login@example.com",
            password="validpass123",
            is_verified=True,
        )
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "login@example.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_unverified_email_returns_400(self):
        """Unverified user cannot login."""
        self.create_user(
            email="unverified@example.com",
            password="validpass123",
            is_verified=False,
        )
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "unverified@example.com", "password": "validpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_email_returns_400(self):
        """Non-existent email returns 400."""
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "nonexistent@example.com", "password": "somepass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_email_returns_400(self):
        """Missing email returns 400."""
        response = self.client.post(
            "/api/v1/auth/login/",
            {"password": "validpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_password_returns_400(self):
        """Missing password returns 400."""
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "user@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_short_password_returns_400(self):
        """Password shorter than MIN_PASSWORD_LENGTH returns 400."""
        response = self.client.post(
            "/api/v1/auth/login/",
            {"email": "user@example.com", "password": "short"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
