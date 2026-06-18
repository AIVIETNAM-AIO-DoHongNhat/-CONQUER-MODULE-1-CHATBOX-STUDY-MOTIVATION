from django.db import models
from core.models import BaseModel


class GamifyHistory(BaseModel):
    user = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.CASCADE,
        related_name="gamify_history",
    )
    session = models.ForeignKey(
        "session.Session",
        on_delete=models.CASCADE,
        related_name="gamify_history",
    )
    xp_awarded = models.PositiveIntegerField(default=0)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Gamify History"
        verbose_name_plural = "Gamify History"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} +{self.xp_awarded} XP"
