from django.db import models
from django.conf import settings
from core.models import BaseModel
from session.models import Session

class Todo(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="todos"
    )
    session = models.ForeignKey(
        Session,
        on_delete=models.CASCADE,
        related_name="todos",
        blank=True,
        null=True
    )
    title = models.CharField(max_length=255, blank=False, null=False)
    is_done = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Todo"
        verbose_name_plural = "Todos"
        ordering = ["order", "created_at"]

    def __str__(self):
        return self.title
