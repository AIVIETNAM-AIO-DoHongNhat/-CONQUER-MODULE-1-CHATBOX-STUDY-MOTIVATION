from django.db import models
from django.contrib.auth.models import AbstractUser

from core.models import BaseModel

class CustomUser(AbstractUser, BaseModel):
  email = models.CharField(max_length=255, unique=True, blank=False, null=False)
  full_name = models.CharField(max_length=255, blank=False, null=False)
  is_verified = models.BooleanField(default=False, null=True, blank=True)
  verification_token = models.CharField(max_length=255, blank=True, null=True)
  verification_token_expires_at = models.DateTimeField(blank=True, null=True)
  recovery_token = models.CharField(max_length=255, blank=True, null=True)
  recovery_token_expires_at = models.DateTimeField(blank=True, null=True)
  level = models.PositiveIntegerField(default=1)
  xp = models.PositiveIntegerField(default=0)
  current_streak = models.PositiveIntegerField(default=0)
  longest_streak = models.PositiveIntegerField(default=0)
  phone_number = models.CharField(max_length=255, blank=True, null=True)
  profile_picture = models.CharField(max_length=1024, blank=True, null=True)

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['username']

  class Meta:
    verbose_name = "User"
    verbose_name_plural = "Users"
    ordering = ["-created_at"]
    db_table = "auth_user"
    indexes = [
      models.Index(fields=["email"]),
    ]
