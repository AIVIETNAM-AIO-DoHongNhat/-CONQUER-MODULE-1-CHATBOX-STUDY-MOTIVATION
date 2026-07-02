from django.contrib import admin

from gamify.models import Badge, DailyGoal, GamifyHistory, UserBadge


@admin.register(DailyGoal)
class DailyGoalAdmin(admin.ModelAdmin):
    list_display = ("user", "date", "target_minutes", "achieved_minutes")
    list_filter = ("date",)
    search_fields = ("user__email", "user__username")


@admin.register(GamifyHistory)
class GamifyHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "session", "xp_awarded", "description", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "user__username", "description")


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "condition_type",
        "threshold",
        "is_active",
    )
    list_filter = ("condition_type", "is_active")
    search_fields = ("code", "name", "description")


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "unlocked_at")
    list_filter = ("badge__condition_type", "unlocked_at")
    search_fields = ("user__email", "user__username", "badge__code", "badge__name")
