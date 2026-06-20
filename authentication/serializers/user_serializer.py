from rest_framework import serializers
from authentication.models.user import CustomUser


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField()
    full_name = serializers.CharField()
    phone_number = serializers.CharField()
    profile_picture = serializers.CharField()

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'email',
            'full_name',
            'phone_number',
            'profile_picture',
            'is_verified',
            'level',
            'xp',
            'current_streak',
            'longest_streak',
            'created_at',
        )
        read_only_fields = fields
