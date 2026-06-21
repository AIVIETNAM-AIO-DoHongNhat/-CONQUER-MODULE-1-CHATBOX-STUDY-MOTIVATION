from django.db import models
from core.models import BaseModel


class Room(BaseModel):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    max_users = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Room"
        verbose_name_plural = "Rooms"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
