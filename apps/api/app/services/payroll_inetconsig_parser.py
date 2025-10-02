"""
Parser para arquivos iNETConsig (Txt Retorno.txt).

Este parser é específico para o formato oficial de retorno da folha de pagamento
iNETConsig, incluindo suporte à legenda de status e extração de todos os campos.
"""

import re
import logging
from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Tuple

# Configure logging for import diagnostics
logger = logging.getLogger(__name__)

# Mapeamento da legenda de status iNETConsig
STATUS_LEGEND = {
    "1": "Lançado e Efetivado",
    "2": "Não Lançado por Falta de Margem Temporariamente",
    "3": "Não Lançado por Outros Motivos (Ex. Matrícula não encontrada; Mudança de órgão)",
    "4": "Lançado com Valor Diferente",
    "5": "Não Lançado por Problemas Técnicos",
    "6": "Lançamento com Erros",
    "S": "Não Lançado: Compra de Dívida ou Suspensão SEAD"
}

# Regex para capturar header do arquivo iNETConsig
# Exemplo: "Entidade: 1042-BANCO SANTANDER S.A                                            Referência: 07/2025   Data da Geração: 31/07/2025"
HEADER_RE = re.compile(
    r"Entidade:\s*(\d+)-(.+?)\s+Refer[eêè]?ncia:\s*(\d{2})/(\d{4})\s+Data da Gera[cçç]?[aã]?o:\s*(\d{2})/(\d{2})/(\d{4})",
    re.IGNORECASE
)

# Regex para capturar linhas de dados iNETConsig
# Formato: STATUS MATRICULA NOME(30) CARGO(30) FIN ORGAO LANC TOTAL PAGO VALOR ORGAO_PAGTO CPF
# Exemplo: "  1    000550-9  JOANA MARIA DOS SANTOS IBIAPIN 3-AGENTE SUPERIOR DE SERVICO   6490      001     088   024         458,04      001    47082976372"
LINE_RE = re.compile(
    r"^\s*([1-6S])\s+"                      # STATUS (1 char)
    r"([0-9X-]+)\s+"                        # MATRICULA
    r"(.{1,35}?)\s{2,}"                     # NOME (até 35 chars, seguido de 2+ espaços)
    r"(.{1,35}?)\s{2,}"                     # CARGO (até 35 chars, seguido de 2+ espaços)
    r"(\d{4})\s+"                           # FIN (4 dígitos fixos)
    r"(\d{3})\s+"                           # ORGAO (3 dígitos)
    r"(\d{3})\s+"                           # LANC (3 dígitos)
    r"(\d{2,3})\s+"                         # TOTAL parcelas (2-3 dígitos)
    r"(\d{2,3})\s+"                         # PAGO parcelas (2-3 dígitos)
    r"([\d.,]+)\s+"                         # VALOR (formato brasileiro)
    r"(\d{3})\s+"                           # ORGAO PAGTO (3 dígitos)
    r"(\d{11})\s*$",                        # CPF (11 dígitos)
    re.MULTILINE
)


def normalize_cpf(cpf: str) -> str:
    """Remove formatação do CPF, mantendo apenas dígitos"""
    return "".join(ch for ch in cpf if ch.isdigit())


def normalize_currency(value: str) -> Decimal:
    """Converte valores como "1.234,56", "30.00" ou "17,94" em Decimal."""
    if not value:
        return Decimal("0")
    # Remove espaços
    val = value.strip()
    # Se contém vírgula e ponto, assume formato brasileiro: remove pontos de milhar e troca vírgula por ponto
    if "," in val and "." in val:
        normalized = val.replace(".", "").replace(",", ".")
    # Se contém apenas vírgula, vírgula é o separador decimal
    elif "," in val:
        normalized = val.replace(",", ".")
    # Se contém apenas ponto, ponto é o separador decimal
    else:
        normalized = val
    try:
        return Decimal(normalized)
    except Exception:
        # Logar erro se necessário
        return Decimal("0")


def truncate_name(full_name: str, max_words: int = 4) -> str:
    """
    Limita o nome a um número máximo de palavras (sem cargo).
    Remove cargo que geralmente vem após números ou hífen.

    Exemplo:
        "JOANA MARIA DOS SANTOS IBIAPIN 3-AGENTE SUPERIOR DE SERVICO"
        → "JOANA MARIA DOS SANTOS"
    """
    # Remover espaços extras
    name = full_name.strip()

    # Se tiver número seguido de hífen, pegar só a parte antes
    if re.search(r'\d-', name):
        name = re.split(r'\d-', name)[0].strip()

    # Pegar só os primeiros N nomes
    parts = name.split()
    return " ".join(parts[:max_words])


def parse_header(content: str) -> Dict:
    """
    Extrai metadados do cabeçalho do arquivo iNETConsig.

    Args:
        content: Conteúdo completo do arquivo

    Returns:
        Dict com metadados: entity_code, entity_name, ref_month, ref_year, generated_at

    Raises:
        ValueError: Se o cabeçalho não for encontrado
    """
    header_match = HEADER_RE.search(content)
    if not header_match:
        raise ValueError("Cabeçalho iNETConsig não encontrado. Formato esperado: 'Entidade: XXXX-NOME ... Referência: MM/AAAA Data da Geração: DD/MM/AAAA'")

    try:
        entity_code = header_match.group(1).strip()
        entity_name = header_match.group(2).strip()
        ref_month = int(header_match.group(3))
        ref_year = int(header_match.group(4))

        # Parse da data de geração
        day = int(header_match.group(5))
        month = int(header_match.group(6))
        year = int(header_match.group(7))
        generated_at = datetime(year, month, day)

        return {
            "entity_code": entity_code,
            "entity_name": entity_name,
            "ref_month": ref_month,
            "ref_year": ref_year,
            "generated_at": generated_at
        }
    except (ValueError, IndexError) as e:
        raise ValueError(f"Erro ao fazer parse do cabeçalho: {e}")


def parse_payroll_lines(content: str, meta: Dict) -> List[Dict]:
    """
    Parser híbrido (split + posicional) para extrair campos:
    MATRICULA, NOME, FIN, ORGAO, LANC, TOTAL, PAGO, VALOR, ORGAO PGTO, CPF

    Layout: STATUS MATRICULA NOME CARGO FIN ORGAO LANC TOTAL PAGO VALOR ORGAO_PGTO CPF
    """
    lines = []
    line_number = 0

    # Contadores para diagnóstico
    stats = {
        "total_lines_processed": 0,
        "valid_lines": 0,
        "invalid_lines": 0,
        "status_counts": {},
        "duplicates": 0
    }

    # Set para detectar duplicatas
    seen_combinations = set()

    # Cache para nomes de órgãos pagadores
    orgao_names = {}

    logger.info("Iniciando parse híbrido (split + posicional)")

    for raw_line in content.splitlines():
        # Extrair nomes de órgãos pagadores das linhas de rodapé
        if "Órgão Pagamento:" in raw_line or "rg o Pagamento:" in raw_line:
            # Formato: "Órgão Pagamento: 001-SEC DA ASSIST.SOC.E CIDADANIA - 68 Lançamento(s)"
            match = re.search(r'(\d{3})-([^-]+?)\s+-', raw_line)
            if match:
                orgao_code = match.group(1).strip()
                orgao_name = match.group(2).strip()
                orgao_names[orgao_code] = orgao_name
                logger.debug(f"Órgão mapeado: {orgao_code} -> {orgao_name}")
            continue

        # Ignorar cabeçalhos repetidos e linhas de separação
        if any(x in raw_line for x in [
            "STATUS MATRICULA NOME",
            "======",
            "Governo do Estado",
            "Empresa de Tecnologia",
            "Relatório dos Lançamentos",
            "Pág:",  # Permite processar todas as páginas
            "Entidade:"
        ]):
            continue

        # Verificar se é uma linha de dados (começa com espaços + dígito)
        if not raw_line.strip() or not re.match(r'^\s*[1-6S]\s+', raw_line):
            continue

        line_number += 1
        stats["total_lines_processed"] += 1

        try:
            # Extrair CPF (últimos 11 caracteres antes do \n)
            cpf = normalize_cpf(raw_line[-11:].strip())

            if not cpf or len(cpf) != 11:
                logger.warning(f"Linha {line_number}: CPF inválido")
                stats["invalid_lines"] += 1
                continue

            # Remover CPF e trabalhar com o restante
            remaining = raw_line[:-11].rstrip()

            # Split tokens
            tokens = remaining.split()

            if len(tokens) < 9:  # Mínimo razoável
                logger.warning(f"Linha {line_number}: Poucos tokens ({len(tokens)})")
                stats["invalid_lines"] += 1
                continue

            # Primeiro extrair STATUS e MATRICULA (sempre os 2 primeiros)
            status_code = tokens[0]
            matricula = tokens[1]

            # Agora pegar os últimos campos numéricos (da direita para esquerda)
            # ignorando STATUS e MATRICULA
            remaining_tokens = tokens[2:]  # Pula STATUS e MATRICULA
            numeric_tokens = []

            for token in reversed(remaining_tokens):
                # É numérico ou valor monetário (com vírgula)
                if token.replace(',', '').replace('.', '').replace('-', '').isdigit():
                    numeric_tokens.append(token)
                    if len(numeric_tokens) >= 7:
                        break

            # Aceitar 6 ou 7 campos numéricos (LANC é opcional)
            if len(numeric_tokens) < 6:
                logger.warning(f"Linha {line_number}: Poucos campos numéricos ({len(numeric_tokens)}) - esperado 6-7")
                stats["invalid_lines"] += 1
                continue

            # Inverter para ficar na ordem correta (da esquerda para direita)
            numeric_tokens.reverse()

            # Layout pode ser: FIN ORGAO LANC TOTAL PAGO VALOR ORGAO_PGTO (7 campos)
            # ou: FIN ORGAO TOTAL PAGO VALOR ORGAO_PGTO (6 campos, sem LANC)
            if len(numeric_tokens) == 7:
                fin_code = numeric_tokens[0]              # FIN (4 dígitos)
                orgao = numeric_tokens[1]                 # ORGAO (3 dígitos)
                lanc = numeric_tokens[2]                  # LANC (3 dígitos)
                total_parcelas_str = numeric_tokens[3]    # TOTAL parcelas
                parcelas_pagas_str = numeric_tokens[4]    # PAGO parcelas
                valor_str = numeric_tokens[5]             # VALOR (com vírgula)
                orgao_pagamento = numeric_tokens[6]       # ORGAO PGTO (3 dígitos)
            else:  # 6 campos
                fin_code = numeric_tokens[0]              # FIN (4 dígitos)
                orgao = numeric_tokens[1]                 # ORGAO (3 dígitos)
                lanc = "000"                              # LANC não presente
                total_parcelas_str = numeric_tokens[2]    # TOTAL parcelas
                parcelas_pagas_str = numeric_tokens[3]    # PAGO parcelas
                valor_str = numeric_tokens[4]             # VALOR (com vírgula)
                orgao_pagamento = numeric_tokens[5]       # ORGAO PGTO (3 dígitos)

            # O restante (entre MATRICULA e FIN) é NOME + CARGO
            try:
                fin_idx = remaining_tokens.index(fin_code)
                nome_cargo_tokens = remaining_tokens[:fin_idx]
                nome_completo = " ".join(nome_cargo_tokens) if nome_cargo_tokens else ""
            except ValueError:
                logger.warning(f"Linha {line_number}: FIN code não encontrado nos tokens")
                stats["invalid_lines"] += 1
                continue

            # Limitar nome a 4 primeiras palavras (sem cargo)
            nome = truncate_name(nome_completo, max_words=4) if nome_completo else ""

            # Validações
            if not matricula:
                logger.warning(f"Linha {line_number}: Matrícula vazia")
                stats["invalid_lines"] += 1
                continue

            if not fin_code or not fin_code.isdigit():
                logger.warning(f"Linha {line_number}: FIN inválido '{fin_code}'")
                stats["invalid_lines"] += 1
                continue

            # Converter valores numéricos
            total_parcelas = int(total_parcelas_str) if total_parcelas_str.isdigit() else 0
            parcelas_pagas = int(parcelas_pagas_str) if parcelas_pagas_str.isdigit() else 0
            valor_parcela = normalize_currency(valor_str)

            # Buscar nome do órgão pagador
            orgao_pagamento_nome = orgao_names.get(orgao_pagamento, "")

            # Verificar duplicatas
            dedup_key = (cpf, matricula, fin_code, meta["ref_month"], meta["ref_year"])
            if dedup_key in seen_combinations:
                stats["duplicates"] += 1
                logger.warning(f"Linha {line_number}: Duplicata - CPF: {cpf}, Matrícula: {matricula}, FIN: {fin_code}")
                continue
            seen_combinations.add(dedup_key)

            # Contabilizar status
            stats["status_counts"][status_code] = stats["status_counts"].get(status_code, 0) + 1

            # Criar registro da linha
            line_data = {
                # Metadados
                "line_number": line_number,
                "entity_code": meta["entity_code"],
                "entity_name": meta["entity_name"],
                "ref_month": meta["ref_month"],
                "ref_year": meta["ref_year"],

                # Dados do cliente
                "cpf": cpf,
                "matricula": matricula,
                "nome": nome,
                "cargo": "",  # Não usado

                # Status do desconto (usar o real, não fixar)
                "status_code": status_code,
                "status_description": STATUS_LEGEND.get(status_code, "Status Desconhecido"),

                # Dados do financiamento
                "financiamento_code": fin_code,
                "orgao": orgao,
                "lanc": lanc,
                "total_parcelas": total_parcelas,
                "parcelas_pagas": parcelas_pagas,
                "valor_parcela_ref": valor_parcela,
                "orgao_pagamento": orgao_pagamento,
                "orgao_pagamento_nome": orgao_pagamento_nome,
            }

            lines.append(line_data)
            stats["valid_lines"] += 1

        except Exception as e:
            stats["invalid_lines"] += 1
            error_msg = f"Linha {line_number}: {str(e)}"
            logger.error(f"Erro ao processar {error_msg}")
            # Guardar amostra de erros (até 10)
            if "errors_sample" not in stats:
                stats["errors_sample"] = []
            if len(stats["errors_sample"]) < 10:
                stats["errors_sample"].append(error_msg)

    # Log das estatísticas finais
    logger.info(f"Parse concluído: {stats['valid_lines']} linhas válidas, "
                f"{stats['invalid_lines']} inválidas, {stats['duplicates']} duplicatas")
    logger.info(f"Distribuição de status: {stats['status_counts']}")

    if stats.get("errors_sample"):
        logger.warning(f"Amostra de erros: {stats['errors_sample'][:5]}")

    return lines


def parse_inetconsig_file(content: str) -> Tuple[Dict, List[Dict], Dict]:
    """
    Função principal para fazer parse completo de um arquivo iNETConsig.

    Args:
        content: Conteúdo completo do arquivo

    Returns:
        Tuple contendo:
        - meta: Metadados do cabeçalho
        - lines: Lista de linhas processadas
        - stats: Estatísticas do processamento

    Raises:
        ValueError: Se o formato do arquivo for inválido
    """
    logger.info("Iniciando parse do arquivo iNETConsig")

    # Parse do cabeçalho
    meta = parse_header(content)
    logger.info(f"Cabeçalho extraído: Entidade {meta['entity_code']}-{meta['entity_name']}, "
                f"Ref: {meta['ref_month']:02d}/{meta['ref_year']}")

    # Parse das linhas
    lines = parse_payroll_lines(content, meta)

    # Calcular clientes únicos
    unique_clients_set = set((line["cpf"], line["matricula"]) for line in lines)

    # Estatísticas finais
    stats = {
        "total_lines": len(lines),
        "unique_clients": len(unique_clients_set),
        "status_distribution": {},
        "entity": f"{meta['entity_code']}-{meta['entity_name']}",
        "reference": f"{meta['ref_month']:02d}/{meta['ref_year']}",
        "unique_cpfs": len(set(line["cpf"] for line in lines)),
        "unique_matriculas": len(set(line["matricula"] for line in lines))
    }

    # Calcular distribuição de status
    for line in lines:
        status = line["status_code"]
        if status not in stats["status_distribution"]:
            stats["status_distribution"][status] = {
                "count": 0,
                "description": line["status_description"]
            }
        stats["status_distribution"][status]["count"] += 1

    logger.info(f"Parse concluído: {stats['total_lines']} linhas, {stats['unique_clients']} clientes únicos")

    return meta, lines, stats


def validate_inetconsig_content(content: str) -> List[str]:
    """
    Validação simplificada do conteúdo do arquivo.

    Args:
        content: Conteúdo do arquivo

    Returns:
        Lista de strings com erros encontrados (vazia se válido)
    """
    errors = []

    # Verificar tamanho do arquivo
    if len(content.strip()) == 0:
        errors.append("Arquivo vazio")
        return errors

    # Verificar se existe cabeçalho
    if not HEADER_RE.search(content):
        errors.append("Cabeçalho não encontrado. Formato esperado: 'Entidade: XXXX-NOME ... Referência: MM/AAAA Data da Geração: DD/MM/AAAA'")

    # Verificar se existem linhas que começam com status (validação simplificada)
    data_lines = 0
    for line in content.splitlines():
        if re.match(r'^\s*[1-6S]\s+', line):
            data_lines += 1

    if data_lines == 0:
        errors.append("Nenhuma linha de dados encontrada no arquivo")

    return errors


def get_file_preview(content: str, max_lines: int = 5) -> Dict:
    """
    Retorna uma prévia do arquivo para diagnóstico.

    Args:
        content: Conteúdo do arquivo
        max_lines: Número máximo de linhas a mostrar

    Returns:
        Dict com prévia do arquivo
    """
    lines = content.splitlines()
    total_lines = len(lines)

    # Tentar extrair cabeçalho
    header_info = "Não encontrado"
    try:
        meta = parse_header(content)
        header_info = f"Entidade: {meta['entity_code']}-{meta['entity_name']}, Ref: {meta['ref_month']:02d}/{meta['ref_year']}"
    except ValueError:
        pass

    # Encontrar algumas linhas de dados válidas (simplificado)
    sample_lines = []
    data_lines_count = 0
    for line in lines:
        if re.match(r'^\s*[1-6S]\s+', line):
            data_lines_count += 1
            if len(sample_lines) < max_lines:
                # Extrair campos básicos por posição
                matricula = line[5:15].strip() if len(line) > 15 else ""
                cpf = line[-11:] if len(line) >= 11 else ""
                sample_lines.append({
                    "status": "1",  # Simplificado
                    "matricula": matricula,
                    "nome": "...",  # Simplificado
                    "cpf": cpf
                })

    return {
        "total_lines": total_lines,
        "header": header_info,
        "sample_data_lines": sample_lines,
        "estimated_records": data_lines_count
    }
