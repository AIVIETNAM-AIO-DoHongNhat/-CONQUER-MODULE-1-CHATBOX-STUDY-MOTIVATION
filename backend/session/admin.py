from django.contrib import admin
from session.models import Session


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("user", "room", "status", "started_at", "ended_at", "focus_minutes")
    list_filter = ("status", "room")
    search_fields = ("user__email", "room__name")
