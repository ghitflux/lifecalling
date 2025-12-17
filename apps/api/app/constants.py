# Mapeamento de códigos de banco para nomes legíveis
BANK_NAMES = {
    "001": "Banco do Brasil",
    "033": "Santander",
    "104": "Caixa Econômica Federal",
    "237": "Bradesco",
    "341": "Itaú",
    "745": "Citibank",
    "399": "HSBC",
    "422": "Safra",
    "041": "Banrisul",
    "389": "Mercantil do Brasil",
    "151": "Nossa Caixa",
    "756": "Bancoob",
    "748": "Sicredi",
    "003": "Banco da Amazônia",
    "004": "Banco do Nordeste",
    "070": "BRB - Banco de Brasília",
    "077": "Banco Inter",
    "260": "Nu Pagamentos (Nubank)",
    "290": "PagSeguro",
    "323": "Mercado Pago",
    "336": "Banco C6",
    "074": "Banco J. Safra",
    "212": "Banco Original",
    "655": "Neon",
    "197": "Stone",
    "380": "PicPay",
    "Margem*": "Margem Disponível",
    "margem": "Margem Disponível",
    "MARGEM": "Margem Disponível",
}

def get_bank_name(bank_code: str) -> str:
    """
    Retorna o nome legível de um banco dado seu código.
    Se o código não for encontrado, retorna o próprio código.

    Args:
        bank_code: Código do banco (ex: "001", "Margem*")

    Returns:
        Nome do banco ou o código caso não encontrado
    """
    if not bank_code:
        return "Não informado"

    # Remover espaços e normalizar
    bank_code_normalized = bank_code.strip()

    # Buscar no dicionário
    return BANK_NAMES.get(bank_code_normalized, bank_code_normalized)


def enrich_banks_with_names(banks_list: list[dict]) -> list[dict]:
    """
    Adiciona o campo 'bank_name' a cada item da lista de bancos.

    Args:
        banks_list: Lista de dicionários com dados de bancos

    Returns:
        Lista enriquecida com o campo 'bank_name'
    """
    if not banks_list:
        return []

    enriched = []
    for bank in banks_list:
        enriched_bank = bank.copy()
        bank_code = bank.get("bank", "")
        enriched_bank["bank_name"] = get_bank_name(bank_code)
        enriched.append(enriched_bank)

    return enriched
