from django.db import models
from core.models import BaseModel


class PendingRegistration(BaseModel):
    email = models.CharField(max_length=255, unique=True, blank=False, null=False)
    full_name = models.CharField(max_length=255, blank=False, null=False)
    password = models.CharField(max_length=255, blank=False, null=False)
    verification_token = models.CharField(max_length=255, blank=False, null=False)
    verification_token_expires_at = models.DateTimeField(blank=False, null=False)

    class Meta:
        verbose_name = "Pending Registration"
        verbose_name_plural = "Pending Registrations"
        ordering = ["-created_at"]
        db_table = "pending_registration"

    def __str__(self):
        return self.email
