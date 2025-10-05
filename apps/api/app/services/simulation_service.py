from pydantic import BaseModel
from typing import List
from decimal import Decimal, ROUND_HALF_UP


class SimulationBankInput(BaseModel):
    bank: str
    parcela: float        # R$
    saldoDevedor: float   # R$
    valorLiberado: float  # R$


class SimulationInput(BaseModel):
    banks: List[SimulationBankInput]  # 1 a 6 bancos
    prazo: int                        # meses (fixo em 96)
    coeficiente: str                  # texto livre
    seguro: float                     # R$
    percentualConsultoria: float      # 0-100%


class SimulationTotals(BaseModel):
    valorParcelaTotal: float
    saldoTotal: float
    liberadoTotal: float
    seguroObrigatorio: float  # NOVO: Seguro Obrigatório Banco
    totalFinanciado: float
    valorLiquido: float
    custoConsultoria: float
    custoConsultoriaLiquido: float
    liberadoCliente: float


def round_half_up(value: float) -> float:
    """
    Função de arredondamento half-up para 2 casas decimais
    Espelha o comportamento do frontend
    """
    decimal_value = Decimal(str(value))
    return float(decimal_value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def compute_simulation_totals(input_data: SimulationInput) -> SimulationTotals:
    """
    Calcula os totais da simulação conforme especificações da planilha.
    Esta função espelha exatamente o cálculo do frontend.
    """
    # Somas dos bancos
    valor_parcela_total = 0.0
    saldo_total = 0.0
    liberado_total = 0.0

    for bank in input_data.banks:
        valor_parcela_total += bank.parcela or 0.0
        saldo_total += bank.saldoDevedor or 0.0
        liberado_total += bank.valorLiberado or 0.0

    # Cálculos principais seguindo as fórmulas especificadas
    total_financiado = saldo_total + liberado_total
    valor_liquido = liberado_total - (input_data.seguro or 0.0)
    custo_consultoria = total_financiado * ((input_data.percentualConsultoria or 0.0) / 100.0)
    custo_consultoria_liquido = custo_consultoria * 0.86
    liberado_cliente = valor_liquido - custo_consultoria

    # Arredondar todos os valores para 2 casas decimais
    return SimulationTotals(
        valorParcelaTotal=round_half_up(valor_parcela_total),
        saldoTotal=round_half_up(saldo_total),
        liberadoTotal=round_half_up(liberado_total),
        seguroObrigatorio=round_half_up(input_data.seguro or 0.0),  # NOVO
        totalFinanciado=round_half_up(total_financiado),
        valorLiquido=round_half_up(valor_liquido),
        custoConsultoria=round_half_up(custo_consultoria),
        custoConsultoriaLiquido=round_half_up(custo_consultoria_liquido),
        liberadoCliente=round_half_up(liberado_cliente)
    )


def validate_simulation_input(input_data: SimulationInput) -> List[str]:
    """
    Valida os dados de entrada da simulação.
    Retorna uma lista de erros encontrados.
    """
    errors = []

    # Validar número de bancos
    if not input_data.banks:
        errors.append("Pelo menos um banco deve ser informado")
    elif len(input_data.banks) > 6:
        errors.append("Máximo de 6 bancos permitidos")

    # Validar dados de cada banco
    for i, bank in enumerate(input_data.banks):
        if not bank.bank:
            errors.append(f"Nome do banco {i+1} é obrigatório")
        
        # Para banco Margem*, permitir parcela negativa
        if bank.bank == "Margem*":
            if bank.parcela is None or bank.parcela == 0:
                errors.append(f"Parcela do banco {i+1} deve ser informada")
        else:
            if bank.parcela <= 0:
                errors.append(f"Parcela do banco {i+1} deve ser maior que zero")
        
        # Para banco Margem*, saldo devedor pode ser zero ou negativo
        if bank.bank != "Margem*":
            if bank.saldoDevedor <= 0:
                errors.append(f"Saldo devedor do banco {i+1} deve ser maior que zero")
        
        # Para banco Margem*, permitir valor liberado negativo
        if bank.bank == "Margem*":
            if bank.valorLiberado is None or bank.valorLiberado == 0:
                errors.append(f"Valor liberado do banco {i+1} deve ser informado")
        else:
            if bank.valorLiberado <= 0:
                errors.append(f"Valor liberado do banco {i+1} deve ser maior que zero")

    # Validar prazo
    if input_data.prazo <= 0:
        errors.append("Prazo deve ser maior que zero")

    # Validar coeficiente
    if not input_data.coeficiente:
        errors.append("Coeficiente é obrigatório")

    # Validar seguro (pode ser zero)
    if input_data.seguro < 0:
        errors.append("Seguro não pode ser negativo")

    # Validar percentual consultoria
    if input_data.percentualConsultoria < 0 or input_data.percentualConsultoria > 100:
        errors.append("Percentual de consultoria deve estar entre 0 e 100")

    return errors