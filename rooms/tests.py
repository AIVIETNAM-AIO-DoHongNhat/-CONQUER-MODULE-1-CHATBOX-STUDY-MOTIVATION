from rest_framework import status
from authentication.tests.base import AuthenticationTestCase
from rooms.models import Room
from django.core.management import call_command

class RoomTests(AuthenticationTestCase):
    def test_seed_rooms_command(self):
        """Test seed_rooms command populates database with 3 rooms."""
        Room.objects.all().delete()
        self.assertEqual(Room.objects.count(), 0)
        call_command("seed_rooms")
        self.assertEqual(Room.objects.count(), 3)
        room_names = list(Room.objects.values_list("name", flat=True))
        self.assertIn("Research", room_names)
        self.assertIn("Product", room_names)
        self.assertIn("Freedom", room_names)

    def test_list_rooms_unauthenticated_returns_401(self):
        """Unauthenticated request to list rooms returns 401."""
        response = self.client.get("/api/v1/rooms/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_rooms_authenticated_returns_rooms(self):
        """Authenticated request to list rooms returns seeded rooms."""
        user = self.create_user(email="testroom@example.com")
        headers = self.get_auth_headers(user)
        token = headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        # Ensure rooms are seeded
        call_command("seed_rooms")
        
        response = self.client.get("/api/v1/rooms/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 3)
        room_names = [r["name"] for r in results]
        self.assertIn("Research", room_names)
        self.assertIn("Product", room_names)
        self.assertIn("Freedom", room_names)
