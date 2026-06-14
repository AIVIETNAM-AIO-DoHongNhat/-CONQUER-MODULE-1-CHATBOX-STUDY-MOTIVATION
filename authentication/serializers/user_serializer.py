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
            'profile_picture')
        extra_kwargs = {
            'id': {'read_only': True},
            'email': {'read_only': True},
            'full_name': {'read_only': True},
            'phone_number': {'read_only': True},
            'profile_picture': {'read_only': True},
        }
