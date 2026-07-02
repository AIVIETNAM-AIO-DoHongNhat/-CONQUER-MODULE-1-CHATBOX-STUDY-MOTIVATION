from rest_framework import serializers
from authentication.models.user import CustomUser


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'full_name',
            'phone_number',
            'profile_picture',
        )
        extra_kwargs = {
            'full_name': {'required': False, 'allow_blank': True},
            'profile_picture': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs):
        if attrs.get('full_name') is not None:
            attrs['full_name'] = attrs['full_name'].strip()
        if attrs.get('profile_picture') is not None:
            attrs['profile_picture'] = attrs['profile_picture'].strip()
        if attrs.get('phone_number') is not None:
            attrs['phone_number'] = attrs['phone_number'].strip()
        return attrs

    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.save()
        return instance
