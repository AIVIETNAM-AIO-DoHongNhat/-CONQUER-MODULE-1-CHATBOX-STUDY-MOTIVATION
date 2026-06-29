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
from django.utils import timezone
from core.models import BaseModel


class Session(BaseModel):
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
    ]

    user = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(blank=True, null=True)
    focus_minutes = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_RUNNING,
    )

    class Meta:
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.user.email} in {self.room.name} ({self.start_time})"
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user.email} - {self.room.name}"
