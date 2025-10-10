from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Atendimento, AtendimentoEvent, AtendimentoLancamento, AtendimentoSimulacao
)

class AtendimentoSerializer(serializers.ModelSerializer):
    available_actions = serializers.SerializerMethodField()
    owner_username = serializers.SerializerMethodField()
    assigned_username = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    lancamentos = serializers.SerializerMethodField()
    simulacoes_count = serializers.SerializerMethodField()

    class Meta:
        model = Atendimento
        fields = [
            "id","cpf","matricula","banco","stage",
            "owner_atendente","assigned_to","owner_username","assigned_username",
            "simulacao_status","simulacao_notes","gerente_notes","financeiro_notes",
            "contrato_formalizado","created_at","updated_at",
            "available_actions","status_label","lancamentos","simulacoes_count",
        ]
        read_only_fields = ["created_at","updated_at","owner_atendente"]

    def get_owner_username(self, obj):
        return obj.owner_atendente.username if obj.owner_atendente else None

    def get_assigned_username(self, obj):
        return obj.assigned_to.username if obj.assigned_to else None

    def get_status_label(self, obj):
        return dict(Atendimento.STAGES).get(obj.stage, obj.stage)

    def _in_group(self, user, group):
        return user.is_superuser or user.groups.filter(name=group).exists()

    def get_available_actions(self, obj):
        req = self.context.get("request")
        user = getattr(req, "user", None)
        if not user or not user.is_authenticated:
            return {}
        can_claim = obj.assigned_to is None
        can_release = obj.assigned_to_id == user.id
        # regra simples: só quem está com o item pode encaminhar
        can_forward = obj.assigned_to_id == user.id
        return {"can_claim": can_claim, "can_release": can_release, "can_forward": can_forward}

    def get_lancamentos(self, obj):
        return [
            {"id": l.id, "banco": l.banco, "competencia": l.competencia, "imported_at": l.imported_at.isoformat()}
            for l in obj.lancamentos.all()
        ]

    def get_simulacoes_count(self, obj):
        return obj.simulacoes.count()


class AtendimentoEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.SerializerMethodField()

    class Meta:
        model = AtendimentoEvent
        fields = ["id","actor","actor_username","from_stage","to_stage","note","created_at"]

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None
