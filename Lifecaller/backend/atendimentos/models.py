from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Atendimento(models.Model):
    STAGES = [
        ("esteira_global", "Esteira Global"),
        ("atendente", "Atendente"),
        ("calculista", "Calculista"),
        ("atendente_pos_sim", "Atendente (Pós-Sim)"),
        ("gerente_fechamento", "Gerente (Fechamento)"),
        ("atendente_docs", "Atendente (Docs)"),
        ("financeiro", "Financeiro"),
        ("contratos_supervisao", "Contratos/Supervisão"),
    ]

    cpf = models.CharField(max_length=20, db_index=True)
    matricula = models.CharField(max_length=50, db_index=True)
    banco = models.CharField(max_length=128, blank=True, default="")
    stage = models.CharField(max_length=64, choices=STAGES, default="esteira_global")

    owner_atendente = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="atend_owner")
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="atend_assigned")

    simulacao_status = models.CharField(max_length=32, null=True, blank=True)  # 'aprovada'|'reprovada'|null
    simulacao_notes = models.TextField(blank=True, default="")
    gerente_notes = models.TextField(blank=True, default="")
    financeiro_notes = models.TextField(blank=True, default="")
    contrato_formalizado = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cpf", "matricula"], name="uniq_cpf_matricula")
        ]
        indexes = [
            models.Index(fields=["stage", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.cpf}/{self.matricula} [{self.stage}]"


class AtendimentoEvent(models.Model):
    atendimento = models.ForeignKey(Atendimento, on_delete=models.CASCADE, related_name="events")
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    from_stage = models.CharField(max_length=64, blank=True, default="")
    to_stage = models.CharField(max_length=64, blank=True, default="")
    note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class AtendimentoLancamento(models.Model):
    """
    'Ramificações' por banco + competência (MM/AAAA) importadas por CSV/TXT (iNETConsig).
    Sempre pertencem a um Atendimento (CPF+Matrícula).
    """
    atendimento = models.ForeignKey(Atendimento, on_delete=models.CASCADE, related_name="lancamentos")
    banco = models.CharField(max_length=128)
    competencia = models.CharField(max_length=7, help_text="MM/AAAA")
    imported_at = models.DateTimeField(default=timezone.now)
    origem = models.CharField(max_length=32, default="import")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["atendimento", "banco", "competencia"], name="uniq_atd_banco_comp")
        ]
        ordering = ["-imported_at"]

    def __str__(self):
        return f"{self.atendimento_id} | {self.banco} | {self.competencia}"


class AtendimentoSimulacao(models.Model):
    """
    Histórico das simulações do calculista.
    """
    atendimento = models.ForeignKey(Atendimento, on_delete=models.CASCADE, related_name="simulacoes")
    banco = models.CharField(max_length=128, blank=True, default="")
    parcela = models.DecimalField(max_digits=12, decimal_places=2)
    coeficiente = models.DecimalField(max_digits=10, decimal_places=7)
    saldo_devedor = models.DecimalField(max_digits=12, decimal_places=2)
    seguro_banco = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    percentual_co = models.DecimalField(max_digits=5, decimal_places=4, default=0)  # 0.1200 = 12%
    prazo_meses = models.IntegerField(default=0)
    # resultados
    pv_total_financiado = models.DecimalField(max_digits=14, decimal_places=6)
    valor_liberado = models.DecimalField(max_digits=14, decimal_places=6)
    valor_liquido = models.DecimalField(max_digits=14, decimal_places=6)
    custo_consultoria = models.DecimalField(max_digits=14, decimal_places=6)
    liberado_cliente = models.DecimalField(max_digits=14, decimal_places=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
