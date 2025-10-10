from django.db import models
from django.contrib.auth.models import User
from atendimentos.models import Atendimento

class Attachment(models.Model):
    atendimento = models.ForeignKey(Atendimento, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="attachments/%Y/%m/")
    name = models.CharField(max_length=255, blank=True, default="")
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
