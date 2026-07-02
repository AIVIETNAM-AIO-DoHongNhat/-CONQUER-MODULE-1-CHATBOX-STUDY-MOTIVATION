from rest_framework import serializers
from authentication.contants import MIN_PASSWORD_LENGTH

from authentication.services.auth_service import AuthService

auth_service = AuthService()

class LoginSerializer(serializers.Serializer):
  email = serializers.EmailField(required=True)
  password = serializers.CharField(required=True, min_length=MIN_PASSWORD_LENGTH)

  def validate(self, attrs):
    email = attrs.get('email')
    password = attrs.get('password')
    user = auth_service.authenticate_user(email, password)

    return {'user': user}

  def save(self):
    user = self.validated_data['user']
    return auth_service.generate_token(user)
