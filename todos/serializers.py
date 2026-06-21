from rest_framework import serializers
from todos.models import Todo

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ["id", "title", "is_done", "order", "session", "user", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "created_at", "updated_at"]

    def validate_session(self, value):
        if value and value.user != self.context["request"].user:
            raise serializers.ValidationError("Cannot assign todo to another user's session.")
        return value
