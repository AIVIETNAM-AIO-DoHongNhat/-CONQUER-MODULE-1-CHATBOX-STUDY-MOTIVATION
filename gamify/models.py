from django.db import models
from django.conf import settings
from datetime import date
from core.models import BaseModel

class DailyGoal(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_goals"
    )
    date = models.DateField(default=date.today)
    target_minutes = models.PositiveIntegerField(default=0)
    achieved_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Daily Goal"
        verbose_name_plural = "Daily Goals"
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="unique_user_date_goal")
        ]

    def __str__(self):
        return f"{self.user.email} - {self.date} (Target: {self.target_minutes}m, Achieved: {self.achieved_minutes}m)"
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
