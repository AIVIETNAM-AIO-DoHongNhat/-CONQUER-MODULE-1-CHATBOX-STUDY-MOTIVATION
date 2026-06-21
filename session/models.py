from django.db import models
from django.conf import settings
from core.models import BaseModel
from rooms.models import Room

class Session(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_sessions"
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="study_sessions"
    )
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(blank=True, null=True)
    focus_minutes = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.user.email} in {self.room.name} ({self.start_time})"
