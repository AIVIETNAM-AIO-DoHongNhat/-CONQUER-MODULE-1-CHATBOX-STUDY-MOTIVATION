from django.contrib import admin
from rooms.models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "owner", "max_users", "is_active", "created_at")
    list_filter = ("category", "is_active")
    search_fields = ("name", "category", "description", "owner__email", "owner__full_name")
    raw_id_fields = ("owner",)
