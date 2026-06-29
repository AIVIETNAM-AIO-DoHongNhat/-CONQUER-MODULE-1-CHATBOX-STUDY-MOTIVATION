"""Tests for UserView (list, retrieve, profile)."""

from rest_framework import status

from authentication.tests.base import AuthenticationTestCase


class UserViewListTests(AuthenticationTestCase):
    def test_list_authenticated_returns_users(self):
        """Authenticated user can list all users."""
        user1 = self.create_user(email="user1@example.com")
        user2 = self.create_user(email="user2@example.com")
        token = self.get_auth_headers(user1)["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/user/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 2)
        emails = [u["email"] for u in response.data]
        self.assertIn("user1@example.com", emails)
        self.assertIn("user2@example.com", emails)

    def test_list_unauthenticated_returns_401(self):
        """Unauthenticated request returns 401."""
        response = self.client.get("/api/v1/auth/user/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserViewRetrieveTests(AuthenticationTestCase):
    def test_retrieve_authenticated_returns_user(self):
        """Authenticated user can retrieve user by id."""
        user = self.create_user(
            email="retrieve@example.com",
            first_name="Retrieve",
            last_name="User",
        )
        headers = self.get_auth_headers(user)
        token = headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get(f"/api/v1/auth/user/{user.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "retrieve@example.com")
        self.assertEqual(response.data["full_name"], "Retrieve User")

    def test_retrieve_unauthenticated_returns_401(self):
        """Unauthenticated request returns 401."""
        user = self.create_user(email="retrieve@example.com")
        response = self.client.get(f"/api/v1/auth/user/{user.pk}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_nonexistent_returns_404(self):
        """Non-existent user id returns 404."""
        user = self.create_user(email="auth@example.com")
        headers = self.get_auth_headers(user)
        token = headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/user/99999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserViewProfileTests(AuthenticationTestCase):
    def test_profile_authenticated_returns_current_user(self):
        """Authenticated user can get own profile."""
        user = self.create_user(
            email="profile@example.com",
            first_name="Profile",
            last_name="User",
        )
        headers = self.get_auth_headers(user)
        token = headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/user/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "profile@example.com")
        self.assertEqual(response.data["full_name"], "Profile User")

    def test_profile_unauthenticated_returns_401(self):
        """Unauthenticated request returns 401."""
        response = self.client.get("/api/v1/auth/user/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_authenticated_returns_current_user(self):
        """Authenticated user can get own profile via me alias."""
        user = self.create_user(
            email="me_alias@example.com",
            first_name="Me",
            last_name="User",
        )
        headers = self.get_auth_headers(user)
        token = headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "me_alias@example.com")
        self.assertEqual(response.data["full_name"], "Me User")

    def test_me_unauthenticated_returns_401(self):
        """Unauthenticated request to me alias returns 401."""
        response = self.client.get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
