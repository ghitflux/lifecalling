"""
Parser para arquivos de importação no layout iNETConsig
Usado por bancos como Santander e outros que seguem este padrão.
"""
import re
import logging
from datetime import datetime
from typing import Dict, List, Optional

# Configure logging for import diagnostics
logger = logging.getLogger(__name__)


# Regex para capturar header do arquivo iNETConsig
# Exemplo: "Entidade: 12345-BANCO SANTANDER S.A. Referência: 01/2024 Data da Geração: 15/01/2024"
HEADER_RE = re.compile(
    r"Entidade:\s*\d*-?\s*([^\s].*?)\s+Referência:\s*(\d{2}/\d{4})\s+Data da Geração:\s*(\d{2}/\d{2}/\d{4})",
    re.IGNORECASE
)

# Regex para capturar linhas de dados
# Formato esperado: matrícula + nome + ... + CPF (11 dígitos no final)
# Exemplo: "000822-2  JOANA SILVA DOS SANTOS        123456789  12345678901"
LINE_RE = re.compile(
    r"^\s*\d*\s*([0-9A-Z\-]+)\s+(.+?)\s{2,}.*?(\d{11})\s*$"
)


def normalize_cpf(cpf: str) -> str:
    """Remove formatação do CPF, mantendo apenas dígitos"""
    return "".join(ch for ch in cpf if ch.isdigit())


def parse_txt(content: str) -> Dict:
    """
    Parse arquivo .txt no formato iNETConsig

    Args:
        content: Conteúdo do arquivo como string

    Returns:
        Dict contendo:
        - meta: {entidade, referencia, gerado_em}
        - rows: [{cpf, matricula, nome}]
        - stats: estatísticas de processamento
    """
    # Inicializar valores padrão
    entidade = None
    referencia = None
    gerado_em = None

    # Contadores para diagnóstico
    stats = {
        "total_lines": 0,
        "processed_lines": 0,
        "skipped_lines": 0,
        "invalid_cpf": 0,
        "empty_fields": 0,
        "duplicates": 0
    }

    # Extrair metadados do header
    header_match = HEADER_RE.search(content)
    if header_match:
        entidade = header_match.group(1).strip()
        referencia = header_match.group(2).strip()  # MM/AAAA
        data_str = header_match.group(3).strip()   # DD/MM/AAAA

        try:
            gerado_em = datetime.strptime(data_str, "%d/%m/%Y").date()
        except ValueError:
            # Se não conseguir fazer parse da data, deixa None
            pass

    # Set para deduplicação
    seen_combinations = set()
    rows = []

    content_lines = content.splitlines()
    stats["total_lines"] = len(content_lines)

    logger.info(f"Iniciando parse do arquivo com {stats['total_lines']} linhas")

    # Processar linhas do arquivo
    for line_num, raw_line in enumerate(content_lines, 1):
        raw_line = raw_line.rstrip()

        # Tentar fazer match da linha
        line_match = LINE_RE.match(raw_line)
        if not line_match:
            stats["skipped_lines"] += 1
            if raw_line.strip() and not raw_line.startswith("Entidade:") and not raw_line.startswith("===="):
                logger.debug(f"Linha {line_num} não reconhecida: {raw_line[:50]}...")
            continue

        matricula_raw = line_match.group(1).strip()
        nome_raw = line_match.group(2).strip()
        cpf_raw = line_match.group(3).strip()

        # Normalizar dados
        matricula = matricula_raw.upper()
        nome = nome_raw.strip()
        cpf = normalize_cpf(cpf_raw)

        # Validações básicas
        if not cpf or len(cpf) != 11:
            stats["invalid_cpf"] += 1
            logger.warning(f"Linha {line_num}: CPF inválido '{cpf_raw}' (após normalização: '{cpf}')")
            continue

        if not matricula or not nome:
            stats["empty_fields"] += 1
            logger.warning(f"Linha {line_num}: Campos obrigatórios vazios - matricula: '{matricula}', nome: '{nome}'")
            continue

        # Chave para deduplicação
        dedup_key = (cpf, matricula)
        if dedup_key in seen_combinations:
            stats["duplicates"] += 1
            logger.info(f"Linha {line_num}: Duplicata encontrada - CPF: {cpf}, matrícula: {matricula}")
            continue

        seen_combinations.add(dedup_key)
        stats["processed_lines"] += 1

        # Adicionar à lista de resultados
        rows.append({
            "cpf": cpf,
            "matricula": matricula,
            "nome": nome,
            "linha": line_num
        })

    # Log final das estatísticas
    logger.info(f"Parse concluído: {stats['processed_lines']} registros processados, "
                f"{stats['skipped_lines']} linhas ignoradas, {stats['invalid_cpf']} CPFs inválidos, "
                f"{stats['empty_fields']} campos vazios, {stats['duplicates']} duplicatas")

    return {
        "meta": {
            "entidade": entidade,
            "referencia": referencia,
            "gerado_em": gerado_em
        },
        "rows": rows,
        "stats": stats
    }


def validate_file_content(content: str) -> List[str]:
    """
    Valida o conteúdo do arquivo e retorna lista de erros encontrados

    Args:
        content: Conteúdo do arquivo

    Returns:
        Lista de strings com erros encontrados (vazia se válido)
    """
    errors = []

    # Verificar se existe header
    if not HEADER_RE.search(content):
        errors.append("Header não encontrado. Formato esperado: 'Entidade: ... Referência: MM/AAAA Data da Geração: DD/MM/AAAA'")

    # Verificar se existem linhas válidas
    valid_lines = 0
    for line in content.splitlines():
        if LINE_RE.match(line.rstrip()):
            valid_lines += 1

    if valid_lines == 0:
        errors.append("Nenhuma linha de dados válida encontrada no arquivo")

    return errors


def get_file_stats(content: str) -> Dict:
    """
    Retorna estatísticas do arquivo antes do processamento

    Args:
        content: Conteúdo do arquivo

    Returns:
        Dict com estatísticas do arquivo
    """
    lines = content.splitlines()
    total_lines = len(lines)

    # Contar linhas que fazem match do pattern
    valid_data_lines = 0
    for line in lines:
        if LINE_RE.match(line.rstrip()):
            valid_data_lines += 1

    # Verificar se tem header
    has_header = bool(HEADER_RE.search(content))

    return {
        "total_lines": total_lines,
        "valid_data_lines": valid_data_lines,
        "has_header": has_header,
        "estimated_records": valid_data_lines
    }