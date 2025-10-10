from django.contrib import admin

from .models import Atendimento, AtendimentoEvent


@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    list_display = ("cpf", "matricula", "stage", "assigned_to", "created_at")
    search_fields = ("cpf", "matricula", "banco")
    list_filter = ("stage", "simulacao_status", "contrato_formalizado")


@admin.register(AtendimentoEvent)
class AtendimentoEventAdmin(admin.ModelAdmin):
    list_display = ("atendimento", "from_stage", "to_stage", "actor", "created_at")
    search_fields = ("note",)
    list_filter = ("from_stage", "to_stage")
