from io import StringIO, TextIOWrapper

from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Atendimento, AtendimentoEvent, AtendimentoLancamento
from .serializers import AtendimentoSerializer, AtendimentoEventSerializer
from .importers import parse_inetconsig_text
from .simulation import SimulateMixin


class AtendimentoViewSet(SimulateMixin, viewsets.ModelViewSet):
    queryset = Atendimento.objects.all().select_related("owner_atendente","assigned_to").prefetch_related("lancamentos","events")
    serializer_class = AtendimentoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["stage", "simulacao_status", "banco", "cpf", "matricula"]
    search_fields = ["cpf","matricula","banco"]
    ordering_fields = ["created_at","updated_at","cpf","matricula"]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    # ---------- Ações de workflow ----------
    @action(detail=True, methods=["post"])
    def claim(self, request, pk=None):
        obj = self.get_object()
        if obj.assigned_to and obj.assigned_to_id != request.user.id:
            return Response({"detail":"Já está atribuído a outro usuário."}, status=409)
        prev_stage = obj.stage
        if obj.owner_atendente is None and request.user.groups.filter(name="atendente").exists():
            obj.owner_atendente = request.user
        obj.assigned_to = request.user
        obj.stage = obj.stage if obj.stage != "esteira_global" else "atendente"
        obj.save(update_fields=["assigned_to","owner_atendente","stage","updated_at"])
        AtendimentoEvent.objects.create(
            atendimento=obj,
            actor=request.user,
            from_stage=prev_stage,
            to_stage=obj.stage,
            note="claim",
        )
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"])
    def release(self, request, pk=None):
        obj = self.get_object()
        if obj.assigned_to_id != request.user.id:
            return Response({"detail":"Somente quem está com o item pode liberar."}, status=403)
        obj.assigned_to = None
        obj.save(update_fields=["assigned_to","updated_at"])
        AtendimentoEvent.objects.create(atendimento=obj, actor=request.user, from_stage=obj.stage, to_stage=obj.stage, note="release")
        return Response(self.get_serializer(obj).data)

    @action(detail=True, methods=["post"])
    def note(self, request, pk=None):
        obj = self.get_object()
        note = (request.data or {}).get("note") or ""
        AtendimentoEvent.objects.create(atendimento=obj, actor=request.user, from_stage=obj.stage, to_stage=obj.stage, note=note)
        return Response({"ok": True})

    @action(detail=True, methods=["get"])
    def events(self, request, pk=None):
        obj = self.get_object()
        ser = AtendimentoEventSerializer(obj.events.all(), many=True)
        return Response(ser.data)

    @action(detail=True, methods=["get"])
    def actions(self, request, pk=None):
        obj = self.get_object()
        return Response(self.get_serializer(obj).data.get("available_actions", {}))

    @action(detail=True, methods=["post"])
    def forward(self, request, pk=None):
        """
        Regras:
        - atendente -> calculista
        - calculista -> atendente_pos_sim
        - atendente_pos_sim (approved true) -> gerente_fechamento; (false) só marca status
        - gerente_fechamento (contrato_formalizado true) -> atendente_docs
        - atendente_docs -> financeiro
        - financeiro -> contratos_supervisao
        """
        obj = self.get_object()
        if obj.assigned_to_id != request.user.id:
            return Response({"detail":"Pegue (claim) o atendimento antes de encaminhar."}, status=403)
        payload = request.data or {}
        prev = obj.stage

        if obj.stage == "atendente":
            obj.stage = "calculista"
        elif obj.stage == "calculista":
            obj.stage = "atendente_pos_sim"
        elif obj.stage == "atendente_pos_sim":
            approved = payload.get("approved", None)
            if approved is True:
                obj.simulacao_status = "aprovada"
                obj.stage = "gerente_fechamento"
            elif approved is False:
                obj.simulacao_status = "reprovada"
                # mantém em pós-sim para nova tratativa
                obj.stage = "atendente_pos_sim"
            else:
                return Response({"detail":"Informe 'approved': true|false"}, status=422)
        elif obj.stage == "gerente_fechamento":
            if payload.get("contrato_formalizado"):
                obj.contrato_formalizado = True
                obj.stage = "atendente_docs"
            else:
                return Response({"detail":"Informe 'contrato_formalizado': true"}, status=422)
        elif obj.stage == "atendente_docs":
            obj.stage = "financeiro"
        elif obj.stage == "financeiro":
            obj.stage = "contratos_supervisao"
        else:
            return Response({"detail":"Etapa não encaminhável."}, status=400)

        obj.save(update_fields=["stage","simulacao_status","contrato_formalizado","updated_at"])
        AtendimentoEvent.objects.create(
            atendimento=obj, actor=request.user, from_stage=prev, to_stage=obj.stage, note=(payload.get("note") or "")
        )
        return Response(self.get_serializer(obj).data)

    # ---------- Filas ----------
    @action(detail=False, methods=["get"], url_path="queue/(?P<name>[^/.]+)")
    def queue(self, request, name=None):
        m = {
            "global": {"stage__in": ["esteira_global", "atendente", "calculista", "atendente_pos_sim", "gerente_fechamento", "atendente_docs", "financeiro"]},
            "atendente": {"stage": "atendente"},
            "calculista": {"stage": "calculista"},
            "pos-sim": {"stage": "atendente_pos_sim"},
            "gerente": {"stage": "gerente_fechamento"},
            "docs": {"stage": "atendente_docs"},
            "financeiro": {"stage": "financeiro"},
            "supervisao": {"stage": "contratos_supervisao"},
        }
        flt = m.get(name, {})
        qs = self.filter_queryset(self.get_queryset().filter(**flt))
        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(self.get_serializer(page, many=True).data)
        return Response(self.get_serializer(qs, many=True).data)

    # ---------- Import (CSV/TXT iNETConsig) com permissões ----------
    @action(detail=False, methods=["post"], url_path="import_csv")
    def import_csv(self, request):
        u = request.user
        allowed = (u.is_superuser or u.groups.filter(name__in=["calculista","supervisor","gerente","admin"]).exists())
        if not allowed:
            return Response({"detail":"Sem permissão para importar."}, status=403)

        if "file" in request.FILES:
            content = TextIOWrapper(request.FILES["file"].file, encoding="utf-8").read()
        elif "csv" in request.data:
            content = str(request.data.get("csv"))
        else:
            return Response({"detail":"Envie 'file' (.csv ou .txt) ou 'csv' (texto)."}, status=400)

        created, updated = 0, 0

        if "inetconsig" in (content or "").lower() or "Entidade:" in (content or ""):
            rows = parse_inetconsig_text(content)
            with transaction.atomic():
                for r in rows:
                    cpf = (r["cpf"] or "").strip()
                    matricula = (r["matricula"] or "").strip()
                    banco = (r.get("banco") or "").strip()
                    competencia = (r.get("competencia") or "").strip() or "00/0000"
                    if not cpf or not matricula:
                        continue
                    obj, was_created = Atendimento.objects.update_or_create(
                        cpf=cpf, matricula=matricula, defaults={"banco": banco or ""}
                    )
                    AtendimentoLancamento.objects.get_or_create(
                        atendimento=obj, banco=banco or "INDEFINIDO", competencia=competencia
                    )
                    AtendimentoEvent.objects.create(
                        atendimento=obj, actor=request.user, from_stage=obj.stage, to_stage=obj.stage,
                        note=f"import: {banco} comp={competencia}"
                    )
                    created += int(was_created); updated += int(not was_created)
            return Response({"created": created, "updated": updated, "format": "inetconsig"})

        # CSV: cabeçalho mínimo cpf,matricula (opcional banco,competencia)
        import csv
        reader = csv.DictReader(StringIO(content))
        headers = set(h.strip().lower() for h in (reader.fieldnames or []))
        if not {"cpf","matricula"}.issubset(headers):
            return Response({"detail":"CSV precisa ter colunas: cpf, matricula (opcionais: banco, competencia)"}, status=422)

        with transaction.atomic():
            for row in reader:
                cpf = (row.get("cpf") or "").strip()
                matricula = (row.get("matricula") or "").strip()
                banco = (row.get("banco") or "").strip()
                competencia = (row.get("competencia") or "").strip() or "00/0000"
                if not cpf or not matricula:
                    continue
                obj, was_created = Atendimento.objects.update_or_create(
                    cpf=cpf, matricula=matricula, defaults={"banco": banco or ""}
                )
                if banco or competencia:
                    AtendimentoLancamento.objects.get_or_create(
                        atendimento=obj, banco=banco or (obj.banco or "INDEFINIDO"), competencia=competencia
                    )
                created += int(was_created); updated += int(not was_created)
        return Response({"created": created, "updated": updated, "format": "csv"})

