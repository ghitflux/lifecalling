from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id","username","email","first_name","last_name","is_staff","is_superuser","role")

    def get_role(self, obj):
        if obj.is_superuser:
            return "superadmin"
        order = ["admin","gerente","supervisor","calculista","atendente"]
        for name in order:
            if obj.groups.filter(name=name).exists():
                return name
        return "user"