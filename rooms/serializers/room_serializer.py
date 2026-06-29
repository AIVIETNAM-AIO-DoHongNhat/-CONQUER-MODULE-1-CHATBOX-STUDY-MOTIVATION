from rest_framework import serializers
from rooms.models import Room
from session.models import Session


class RoomSerializer(serializers.ModelSerializer):
    active_user_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "category",
            "description",
            "max_users",
            "is_active",
            "active_user_count",
        ]
        read_only_fields = ["id", "active_user_count"]

    def get_active_user_count(self, obj):
        return (
            Session.objects.filter(
                room=obj, status=Session.STATUS_RUNNING, ended_at__isnull=True
            )
            .values("user")
            .distinct()
            .count()
        )
