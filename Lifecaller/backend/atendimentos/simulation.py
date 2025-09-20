from decimal import Decimal, ROUND_HALF_UP

from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import AtendimentoEvent, AtendimentoSimulacao
from .models_coef import Coeficiente


def _quantize(value: Decimal, places: str = "0.00") -> Decimal:
    return value.quantize(Decimal(places), rounding=ROUND_HALF_UP)


def _get_coeficiente(banco: str, prazo: int) -> Decimal | None:
    try:
        coef = Coeficiente.objects.get(banco__iexact=banco.strip(), parcelas=prazo)
    except Coeficiente.DoesNotExist:
        return None
    return coef.coeficiente


class SimulateMixin:
    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def simulate(self, request, pk=None):
        obj = self.get_object()
        user = request.user
        if not (
            user.is_superuser
            or user.groups.filter(name__in=["calculista", "admin", "gerente", "supervisor"]).exists()
        ):
            return Response({"detail": "Sem permissão para simular."}, status=403)
        payload = request.data or {}

        banco = str(payload.get("banco", "")).strip()
        prazo = int(payload.get("prazo_meses") or payload.get("parcelas") or 0)
        saldo = Decimal(str(payload.get("saldo_devedor", "0") or "0"))
        seguro = Decimal(str(payload.get("seguro_banco", "0") or "0"))
        percentual = Decimal(str(payload.get("percentual_co", "0") or "0"))

        if not banco or prazo <= 0:
            return Response({"detail": "Informe banco e prazo (parcelas)."}, status=422)

        if percentual < 0 or percentual >= 1:
            return Response({"detail": "percentual_co deve ser entre 0 e 1 (ex.: 0.12 = 12%)."}, status=422)

        coeficiente = _get_coeficiente(banco, prazo)
        if coeficiente is None:
            return Response({
                "detail": "Coeficiente não encontrado para banco/prazo.",
                "banco": banco,
                "prazo_meses": prazo,
            }, status=422)
        coeficiente = Decimal(str(coeficiente))

        divisor = Decimal("1") - percentual
        pv = (saldo + seguro) / divisor if divisor != 0 else Decimal("0")
        parcela_total = pv * coeficiente
        valor_liberado = pv - saldo
        valor_liquido = valor_liberado - seguro
        custo_consultoria = pv * percentual
        liberado_cliente = valor_liquido - custo_consultoria

        simulacao = AtendimentoSimulacao.objects.create(
            atendimento=obj,
            banco=banco,
            parcela=_quantize(parcela_total, "0.00"),
            coeficiente=coeficiente,
            saldo_devedor=_quantize(saldo, "0.00"),
            seguro_banco=_quantize(seguro, "0.00"),
            percentual_co=percentual,
            prazo_meses=prazo,
            pv_total_financiado=_quantize(pv, "0.00"),
            valor_liberado=_quantize(valor_liberado, "0.00"),
            valor_liquido=_quantize(valor_liquido, "0.00"),
            custo_consultoria=_quantize(custo_consultoria, "0.00"),
            liberado_cliente=_quantize(liberado_cliente, "0.00"),
        )

        aprovado = pv > 0
        AtendimentoEvent.objects.create(
            atendimento=obj,
            actor=request.user,
            from_stage=obj.stage,
            to_stage=obj.stage,
            note=(
                f"simulação {banco}/{prazo}x coef={coeficiente} parcela={_quantize(parcela_total, '0.00')}"
                f" aprovado={aprovado}"
            ),
        )

        return Response({
            "banco": banco,
            "prazo_meses": prazo,
            "coeficiente": str(coeficiente),
            "parcela_total": str(_quantize(parcela_total, "0.00")),
            "valor_liberado": str(_quantize(valor_liberado, "0.00")),
            "valor_liquido": str(_quantize(valor_liquido, "0.00")),
            "custo_consultoria": str(_quantize(custo_consultoria, "0.00")),
            "liberado_cliente": str(_quantize(liberado_cliente, "0.00")),
            "pv_total_financiado": str(_quantize(pv, "0.00")),
            "aprovado": aprovado,
            "created_at": simulacao.created_at.isoformat(),
        })
