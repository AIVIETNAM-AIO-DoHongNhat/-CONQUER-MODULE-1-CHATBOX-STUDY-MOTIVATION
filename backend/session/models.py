from datetime import timedelta

from django.db import models
from django.db.models import DateTimeField, DurationField, ExpressionWrapper, F
from django.utils import timezone

from core.models import BaseModel


class Session(BaseModel):
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [
        (STATUS_RUNNING, "Running"),
        (STATUS_COMPLETED, "Completed"),
    ]

    # Thời lượng học dự kiến (phút) do người dùng chọn khi vào phòng — một lần
    # đếm ngược đơn. Mỗi "hiệp" học tiếp là một phiên mới với thời lượng riêng.
    DEFAULT_PLANNED_MINUTES = 30
    MIN_PLANNED_MINUTES = 1
    MAX_PLANNED_MINUTES = 600  # 10 giờ — chặn giá trị vô lý
    # Sau khi hết giờ dự kiến, cho một khoảng đệm để người dùng kịp trả lời hộp
    # thoại "Học tiếp?" hoặc rời phòng. Trôi qua mốc này mà chưa kết thúc → coi
    # như phiên bị bỏ dở (mồ côi), không ghi công phút nào.
    EXPIRY_GRACE_SECONDS = 15 * 60

    def planned_seconds(self):
        return self.planned_minutes * 60

    def elapsed_seconds(self, now=None):
        now = now or timezone.now()
        return max(0.0, (now - self.started_at).total_seconds())

    def is_expired(self, now=None):
        return self.elapsed_seconds(now) > self.planned_seconds() + self.EXPIRY_GRACE_SECONDS

    @classmethod
    def active_in_room(cls, room, now=None):
        """Các phiên đang chạy còn hiệu lực trong phòng.

        Loại phiên "ma" (người dùng rời đi không kết thúc) bằng cùng mốc hết hạn
        với is_expired: quá planned_minutes + EXPIRY_GRACE_SECONDS thì không đếm,
        dù bản ghi vẫn còn status=running trong DB chờ được dọn.
        """
        now = now or timezone.now()
        running = list(
            cls.objects.filter(
                room=room,
                status=cls.STATUS_RUNNING,
                ended_at__isnull=True,
            )
        )
        active_ids = [s.id for s in running if not s.is_expired(now)]
        return cls.objects.filter(id__in=active_ids)

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
    planned_minutes = models.PositiveIntegerField(default=DEFAULT_PLANNED_MINUTES)
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
