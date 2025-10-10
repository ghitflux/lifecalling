from rest_framework import serializers
from .models import Attachment

class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id","atendimento","file","name","uploaded_by","created_at"]
        read_only_fields = ["id","uploaded_by","created_at"]
