from rest_framework import serializers
from session.models import Session


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            "id",
            "user",
            "room",
            "started_at",
            "ended_at",
            "focus_minutes",
            "status",
        ]
        read_only_fields = ["id", "started_at", "ended_at", "focus_minutes"]
