import re
import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable, Dict, Any

# Configure logging for payroll parsing
logger = logging.getLogger(__name__)

@dataclass
class PayrollHeader:
    entidade_code: str
    entidade_name: str
    ref_month: int
    ref_year: int

@dataclass
class PayrollRow:
    status: str
    matricula: str
    nome: str
    cargo: str
    fin: str
    orgao: str
    lanc: str
    total: int
    pago: int
    valor_parcela: Decimal
    orgao_pagto: str
    cpf: str

HEADER_ENT = re.compile(r"Entidade:\s*(\d+)-(.+?)\s{2,}", re.UNICODE)
HEADER_REF = re.compile(r"Refer.ncia:\s*(\d{2})/(\d{4})", re.UNICODE)

# Colunas fixas conforme layout do relatório (monoespaçado)
# Baseado na análise exata do arquivo Retorno_Financiamentos.txt
# Linha exemplo: "  1    000550-9  JOANA MARIA DOS SANTOS IBIAPIN 3-AGENTE SUPERIOR DE SERVICO   6490      001     088   024         458,04      001    47082976372"
COLS = {
    'status':      (2, 3),       # STATUS: "1"
    'matricula':   (7, 15),      # MATRICULA: "000550-9"
    'nome':        (17, 48),     # NOME: "JOANA MARIA DOS SANTOS IBIAPIN"
    'cargo':       (49, 79),     # CARGO: "3-AGENTE SUPERIOR DE SERVICO"
    'fin':         (79, 84),     # FIN: "6490"
    'orgao':       (84, 90),     # ORGAO: "001"
    'lanc':        (90, 97),     # LANC: "088"
    'total':       (97, 103),    # TOTAL: "024"
    'pago':        (103, 109),   # PAGO: valor antes do VALOR
    'valor':       (109, 125),   # VALOR: "458,04" (com espaços)
    'orgao_pagto': (125, 134),   # ORGAO PAGTO: "001"
    'cpf':         (134, 145),   # CPF: "47082976372"
}


def _slice(line: str, a: int, b: int) -> str:
    """Extrai substring da linha tratando índices de forma segura"""
    return line[a:b].strip() if len(line) > a else ""


def get_parsing_stats(text: str) -> Dict[str, Any]:
    """Retorna estatísticas de parsing sem processar os dados"""
    all_lines = text.splitlines()
    data_lines = [ln for ln in all_lines if re.match(r"\s*\d+\s+\S+", ln)]

    return {
        "total_lines": len(all_lines),
        "data_lines": len(data_lines),
        "header_detected": bool(re.search(r"Entidade:\s*\d+", text)),
        "reference_detected": bool(re.search(r"Referência:\s*\d{2}/\d{4}", text))
    }


def parse_header(text: str) -> PayrollHeader:
    """Extrai metadados do cabeçalho do arquivo"""
    ent = HEADER_ENT.search(text)
    ref = HEADER_REF.search(text)
    if not ent or not ref:
        raise ValueError("Cabeçalho inválido: não foi possível ler Entidade/Referência")

    code, name = ent.group(1), ent.group(2).strip()
    mm, yy = int(ref.group(1)), int(ref.group(2))
    return PayrollHeader(entidade_code=code, entidade_name=name, ref_month=mm, ref_year=yy)


def parse_rows(text: str) -> Iterable[PayrollRow]:
    """Extrai linhas de dados do arquivo"""
    all_lines = text.splitlines()
    lines = [ln for ln in all_lines if re.match(r"\s*\d+\s+\S+", ln)]

    logger.info(f"Arquivo com {len(all_lines)} linhas, {len(lines)} linhas de dados identificadas")

    processed = 0
    skipped_cpf = 0
    skipped_fields = 0
    value_errors = 0

    for ln in lines:
        # Extrair cada campo pela posição fixa
        parts = {k: _slice(ln, *rng) for k, rng in COLS.items()}

        # Normalizar CPF (apenas dígitos)
        cpf = re.sub(r"\D", "", parts['cpf'])
        if len(cpf) != 11:
            skipped_cpf += 1
            logger.warning(f"Linha ignorada - CPF inválido: '{parts['cpf']}' (normalizado: '{cpf}')")
            continue

        # Normalizar matrícula
        matricula = parts['matricula']
        if not matricula:
            skipped_fields += 1
            logger.warning("Linha ignorada - Matrícula vazia")
            continue

        # Normalizar nome
        nome = parts['nome']
        if not nome:
            skipped_fields += 1
            logger.warning("Linha ignorada - Nome vazio")
            continue

        # Processar valor (formato brasileiro: 1.234,56)
        valor_str = parts['valor'].replace('.', '').replace(',', '.')
        try:
            valor_parcela = Decimal(valor_str) if valor_str else Decimal('0')
        except Exception as e:
            value_errors += 1
            valor_parcela = Decimal('0')
            logger.warning(f"Erro ao processar valor '{parts['valor']}': {e}")

        # Processar contadores
        try:
            total = int(parts['total']) if parts['total'] else 0
            pago = int(parts['pago']) if parts['pago'] else 0
        except Exception as e:
            value_errors += 1
            total = pago = 0
            logger.warning(f"Erro ao processar contadores - total: '{parts['total']}', pago: '{parts['pago']}': {e}")

        processed += 1

        yield PayrollRow(
            status=parts['status'],
            matricula=matricula,
            nome=nome,
            cargo=parts['cargo'],
            fin=parts['fin'],
            orgao=parts['orgao'],
            lanc=parts['lanc'],
            total=total,
            pago=pago,
            valor_parcela=valor_parcela,
            orgao_pagto=parts['orgao_pagto'],
            cpf=cpf,
        )

    # Log final das estatísticas de parsing
    logger.info(f"Payroll parsing concluído: {processed} registros processados, "
                f"{skipped_cpf} CPFs inválidos, {skipped_fields} campos vazios, "
                f"{value_errors} erros de valor")
