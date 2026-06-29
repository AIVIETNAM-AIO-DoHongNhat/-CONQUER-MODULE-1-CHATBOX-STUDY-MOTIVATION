from rest_framework import status
from authentication.tests.base import AuthenticationTestCase
from rooms.models import Room
from session.models import Session
from todos.models import Todo

class TodoTests(AuthenticationTestCase):
    def setUp(self):
        super().setUp()
        self.user = self.create_user(email="todo@example.com")
        self.headers = self.get_auth_headers(self.user)
        self.token = self.headers["HTTP_AUTHORIZATION"].split(" ")[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        
        self.room = Room.objects.create(name="Study Room", description="Test Room")
        self.session = Session.objects.create(user=self.user, room=self.room, is_active=True)

    def test_create_todo_auto_links_active_session(self):
        """Creating a todo auto-links it to the user's active session."""
        response = self.client.post(
            "/api/v1/todos/",
            {"title": "Study Math"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Study Math")
        self.assertEqual(response.data["session"], self.session.id)
        
        # Verify database record
        todo = Todo.objects.get(id=response.data["id"])
        self.assertEqual(todo.user, self.user)
        self.assertEqual(todo.session, self.session)

    def test_list_todos_filters_by_active_session(self):
        """Listing todos only returns todos associated with the active session."""
        # Todo for active session
        todo1 = Todo.objects.create(user=self.user, session=self.session, title="Active Todo")
        
        # Todo for inactive session
        inactive_session = Session.objects.create(user=self.user, room=self.room, is_active=False)
        todo2 = Todo.objects.create(user=self.user, session=inactive_session, title="Inactive Todo")
        
        response = self.client.get("/api/v1/todos/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["title"], "Active Todo")

    def test_todo_crud_operations(self):
        """Test full CRUD operations on todo."""
        todo = Todo.objects.create(user=self.user, session=self.session, title="Test Todo")
        
        # Update (PUT)
        response = self.client.put(
            f"/api/v1/todos/{todo.id}/",
            {"title": "Updated Todo Title", "is_done": True, "order": 5},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Updated Todo Title")
        self.assertTrue(response.data["is_done"])
        self.assertEqual(response.data["order"], 5)
        
        # Partial Update (PATCH)
        response = self.client.patch(
            f"/api/v1/todos/{todo.id}/",
            {"is_done": False},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_done"])

        # Delete (DELETE)
        response = self.client.delete(f"/api/v1/todos/{todo.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Todo.objects.filter(id=todo.id).exists())
