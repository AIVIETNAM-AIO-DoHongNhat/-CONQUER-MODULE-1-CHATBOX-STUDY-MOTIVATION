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

    def get_active_user_count(self, obj) -> int:
        # Chỉ đếm phiên còn hiệu lực — phiên ma quá hạn bị loại ngay trong query.
        return Session.active_in_room(obj).values("user").distinct().count()
