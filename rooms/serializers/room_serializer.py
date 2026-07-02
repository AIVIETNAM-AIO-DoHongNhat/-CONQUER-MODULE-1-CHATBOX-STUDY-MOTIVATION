from rest_framework import serializers
from rooms.models import Room
from session.models import Session


class RoomSerializer(serializers.ModelSerializer):
    active_user_count = serializers.SerializerMethodField()
    # Chủ phòng chỉ để đọc: gán tự động từ người đang đăng nhập khi tạo (xem view).
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    owner_name = serializers.CharField(source="owner.full_name", read_only=True)

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
            "owner",
            "owner_name",
        ]
        read_only_fields = ["id", "active_user_count", "owner", "owner_name"]

    def get_active_user_count(self, obj) -> int:
        # Chỉ đếm phiên còn hiệu lực — phiên ma quá hạn bị loại ngay trong query.
        return Session.active_in_room(obj).values("user").distinct().count()
