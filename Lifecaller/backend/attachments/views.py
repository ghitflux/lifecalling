from rest_framework import viewsets, permissions, filters
from .models import Attachment
from .serializers import AttachmentSerializer

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all().order_by("-created_at")
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at","id"]

    def get_queryset(self):
        qs = super().get_queryset()
        at = self.request.query_params.get("atendimento")
        if at:
            qs = qs.filter(atendimento_id=at)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
