from django.db import models

from core.models import BaseModel


class Room(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    category = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    max_users = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    # Người tạo phòng. null=True để phòng seed/cũ (không có người tạo) vẫn hợp lệ;
    # SET_NULL để xoá user không kéo theo mất phòng.
    owner = models.ForeignKey(
        "authentication.CustomUser",
        on_delete=models.SET_NULL,
        related_name="owned_rooms",
        blank=True,
        null=True,
    )

    class Meta:
        verbose_name = "Room"
        verbose_name_plural = "Rooms"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
