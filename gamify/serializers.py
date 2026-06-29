from rest_framework import serializers
from gamify.models import DailyGoal

class DailyGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyGoal
        fields = ["id", "user", "date", "target_minutes", "achieved_minutes", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "date", "achieved_minutes", "created_at", "updated_at"]
