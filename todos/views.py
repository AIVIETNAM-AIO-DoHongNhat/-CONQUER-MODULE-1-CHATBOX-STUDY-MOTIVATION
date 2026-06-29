from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from todos.models import Todo
from todos.serializers import TodoSerializer
from session.models import Session

class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        # Filter todos by the current active study session of the user
        active_session = Session.objects.filter(user=user, is_active=True).first()
        if active_session:
            return Todo.objects.filter(user=user, session=active_session)
        else:
            return Todo.objects.filter(user=user, session__isnull=True)

    def perform_create(self, serializer):
        # Auto-associate the todo with the user's active study session if one exists
        active_session = Session.objects.filter(user=self.request.user, is_active=True).first()
        serializer.save(user=self.request.user, session=active_session)
