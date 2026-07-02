from rest_framework import serializers
from session.models import Session

class SessionSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source="room.name", read_only=True)

    class Meta:
        model = Session
        fields = ["id", "user", "room", "room_name", "start_time", "end_time", "focus_minutes", "is_active"]
        read_only_fields = ["id", "user", "start_time", "end_time", "focus_minutes", "is_active"]
