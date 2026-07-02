from datetime import date

from django.conf import settings
from django.db import models

from core.models import BaseModel


class DailyGoal(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_goals",
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
        return (
            f"{self.user.email} - {self.date} "
            f"(Target: {self.target_minutes}m, Achieved: {self.achieved_minutes}m)"
        )


class GamifyHistory(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
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


class Badge(BaseModel):
    CONDITION_STREAK_DAYS = "streak_days"
    CONDITION_TOTAL_FOCUS_MINUTES = "total_focus_minutes"
    CONDITION_TOTAL_SESSIONS = "total_sessions"
    CONDITION_XP = "xp"
    CONDITION_LEVEL = "level"
    CONDITION_CHOICES = [
        (CONDITION_STREAK_DAYS, "Streak days"),
        (CONDITION_TOTAL_FOCUS_MINUTES, "Total focus minutes"),
        (CONDITION_TOTAL_SESSIONS, "Total sessions"),
        (CONDITION_XP, "XP"),
        (CONDITION_LEVEL, "Level"),
    ]

    code = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    condition_type = models.CharField(max_length=40, choices=CONDITION_CHOICES)
    threshold = models.PositiveIntegerField()
    icon = models.CharField(max_length=120, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Badge"
        verbose_name_plural = "Badges"
        ordering = ["condition_type", "threshold", "name"]

    def __str__(self):
        return self.name

class UserBadge(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_badges",
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name="user_badges",
    )
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "User Badge"
        verbose_name_plural = "User Badges"
        ordering = ["-unlocked_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "badge"],
                name="unique_user_badge",
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.badge.name}"
