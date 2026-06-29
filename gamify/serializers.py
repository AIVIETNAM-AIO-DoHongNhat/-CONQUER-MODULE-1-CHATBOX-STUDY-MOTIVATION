from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from gamify.models import Badge, DailyGoal, UserBadge


class DailyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyGoal
        fields = ["id", "user", "date", "target_minutes", "achieved_minutes", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "date", "achieved_minutes", "created_at", "updated_at"]


class UserBadgeSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    unlocked_at = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = [
            "id",
            "code",
            "name",
            "description",
            "condition_type",
            "threshold",
            "icon",
            "is_unlocked",
            "unlocked_at",
        ]

    def _get_user_badge(self, obj):
        unlocked_badges = self.context.get("unlocked_badges", {})
        return unlocked_badges.get(obj.id)

    def get_is_unlocked(self, obj) -> bool:
        return self._get_user_badge(obj) is not None

    @extend_schema_field(serializers.DateTimeField(allow_null=True))
    def get_unlocked_at(self, obj):
        user_badge = self._get_user_badge(obj)
        if not user_badge:
            return None
        return user_badge.unlocked_at


class LeaderboardUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()
    full_name = serializers.CharField()
    profile_picture = serializers.CharField(allow_blank=True, allow_null=True)
    level = serializers.IntegerField()
    xp = serializers.IntegerField()


class LeaderboardEntrySerializer(serializers.Serializer):
    rank = serializers.IntegerField()
    user = LeaderboardUserSerializer()
    total_minutes = serializers.IntegerField()


class LeaderboardWeekSerializer(serializers.Serializer):
    start = serializers.DateField()
    end = serializers.DateField()


class WeeklyLeaderboardSerializer(serializers.Serializer):
    week = LeaderboardWeekSerializer()
    results = LeaderboardEntrySerializer(many=True)
    current_user = LeaderboardEntrySerializer(allow_null=True)
