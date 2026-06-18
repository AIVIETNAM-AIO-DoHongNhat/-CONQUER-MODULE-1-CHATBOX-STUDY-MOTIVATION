from django.db import models
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
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.user.email} - {self.room.name}"
