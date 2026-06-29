from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from session.models import Session
from todos.models import Todo
from todos.serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    serializer_class = TodoSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        active_session = self._get_active_session()
        if active_session:
            return Todo.objects.filter(user=self.request.user, session=active_session)
        return Todo.objects.filter(user=self.request.user, session__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, session=self._get_active_session())

    def _get_active_session(self):
        return Session.objects.filter(
            user=self.request.user,
            status=Session.STATUS_RUNNING,
            ended_at__isnull=True,
        ).first()
