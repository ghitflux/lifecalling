"""
ARQUIVO DE DADOS MOCKADOS PARA RANKINGS
========================================
Este arquivo contém dados mockados para o módulo de rankings.
Para remover os mocks e usar dados reais:
1. Delete este arquivo (rankings_mock_data.py)
2. Delete o arquivo rankings_mock_config.py
3. Os endpoints voltarão a usar dados reais automaticamente
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any

# Dados mockados de atendentes
MOCK_AGENTS = [
    {
        "user_id": 1,
        "name": "Ana Silva",
        "contracts": 45,
        "consultoria_liq": 125000.50,
        "ticket_medio": 2777.78,
        "trend_contracts": 5,
        "trend_consult": 15000.00
    },
    {
        "user_id": 2,
        "name": "Carlos Santos",
        "contracts": 38,
        "consultoria_liq": 98500.75,
        "ticket_medio": 2592.13,
        "trend_contracts": -2,
        "trend_consult": -5000.00
    },
    {
        "user_id": 3,
        "name": "Maria Oliveira",
        "contracts": 52,
        "consultoria_liq": 145600.25,
        "ticket_medio": 2800.00,
        "trend_contracts": 8,
        "trend_consult": 22000.00
    },
    {
        "user_id": 4,
        "name": "João Pereira",
        "contracts": 41,
        "consultoria_liq": 112300.00,
        "ticket_medio": 2739.02,
        "trend_contracts": 3,
        "trend_consult": 8500.00
    },
    {
        "user_id": 5,
        "name": "Fernanda Costa",
        "contracts": 35,
        "consultoria_liq": 95800.00,
        "ticket_medio": 2737.14,
        "trend_contracts": 1,
        "trend_consult": 3200.00
    },
    {
        "user_id": 6,
        "name": "Roberto Lima",
        "contracts": 29,
        "consultoria_liq": 78900.50,
        "ticket_medio": 2720.71,
        "trend_contracts": -4,
        "trend_consult": -12000.00
    },
    {
        "user_id": 7,
        "name": "Patricia Souza",
        "contracts": 47,
        "consultoria_liq": 132400.00,
        "ticket_medio": 2817.02,
        "trend_contracts": 6,
        "trend_consult": 18000.00
    },
    {
        "user_id": 8,
        "name": "Ricardo Alves",
        "contracts": 33,
        "consultoria_liq": 89700.00,
        "ticket_medio": 2718.18,
        "trend_contracts": 0,
        "trend_consult": 0.00
    },
    {
        "user_id": 9,
        "name": "Juliana Martins",
        "contracts": 44,
        "consultoria_liq": 119500.75,
        "ticket_medio": 2715.92,
        "trend_contracts": 4,
        "trend_consult": 11000.00
    },
    {
        "user_id": 10,
        "name": "Eduardo Ferreira",
        "contracts": 31,
        "consultoria_liq": 84200.00,
        "ticket_medio": 2716.13,
        "trend_contracts": -1,
        "trend_consult": -2800.00
    }
]

# Dados mockados de metas por atendente
MOCK_TARGETS = [
    {"user_id": 1, "name": "Ana Silva", "meta_contratos": 50, "meta_consultoria": 135000.00},
    {"user_id": 2, "name": "Carlos Santos", "meta_contratos": 40, "meta_consultoria": 108000.00},
    {"user_id": 3, "name": "Maria Oliveira", "meta_contratos": 50, "meta_consultoria": 135000.00},
    {"user_id": 4, "name": "João Pereira", "meta_contratos": 45, "meta_consultoria": 121500.00},
    {"user_id": 5, "name": "Fernanda Costa", "meta_contratos": 40, "meta_consultoria": 108000.00},
    {"user_id": 6, "name": "Roberto Lima", "meta_contratos": 35, "meta_consultoria": 94500.00},
    {"user_id": 7, "name": "Patricia Souza", "meta_contratos": 50, "meta_consultoria": 135000.00},
    {"user_id": 8, "name": "Ricardo Alves", "meta_contratos": 40, "meta_consultoria": 108000.00},
    {"user_id": 9, "name": "Juliana Martins", "meta_contratos": 45, "meta_consultoria": 121500.00},
    {"user_id": 10, "name": "Eduardo Ferreira", "meta_contratos": 35, "meta_consultoria": 94500.00}
]

# Dados mockados de times
MOCK_TEAMS = [
    {
        "team": "Atendimento Comercial",
        "contracts": 125,
        "consultoria_liq": 342500.00
    },
    {
        "team": "Atendimento Técnico",
        "contracts": 98,
        "consultoria_liq": 267800.00
    },
    {
        "team": "Atendimento Premium",
        "contracts": 87,
        "consultoria_liq": 245600.00
    },
    {
        "team": "Atendimento Digital",
        "contracts": 115,
        "consultoria_liq": 315400.00
    }
]


def get_mock_agents_ranking(
    from_: str | None = None,
    to: str | None = None,
    page: int = 1,
    per_page: int = 50,
    agent_id: int | None = None
) -> Dict[str, Any]:
    """
    Retorna dados mockados de ranking de atendentes

    Args:
        from_: Data inicial (ignorada no mock)
        to: Data final (ignorada no mock)
        page: Página atual
        per_page: Itens por página
        agent_id: Filtrar por ID específico

    Returns:
        Dicionário com items, period e pagination
    """
    # Filtrar por agent_id se fornecido
    agents = MOCK_AGENTS if not agent_id else [a for a in MOCK_AGENTS if a["user_id"] == agent_id]

    # Paginação
    total_items = len(agents)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_agents = agents[start_idx:end_idx]

    # Definir período mockado
    if from_ and to:
        period = {"from": from_, "to": to}
    else:
        today = datetime.utcnow().date()
        start = today.replace(day=1)
        period = {"from": str(start), "to": str(today)}

    return {
        "items": paginated_agents,
        "period": period,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": total_items
        }
    }


def get_mock_targets() -> Dict[str, List[Dict]]:
    """
    Retorna dados mockados de metas de atendentes

    Returns:
        Dicionário com lista de metas
    """
    return {"items": MOCK_TARGETS}


def get_mock_teams_ranking(
    from_: str | None = None,
    to: str | None = None
) -> Dict[str, List[Dict]]:
    """
    Retorna dados mockados de ranking de times

    Args:
        from_: Data inicial (ignorada no mock)
        to: Data final (ignorada no mock)

    Returns:
        Dicionário com lista de times
    """
    return {"items": MOCK_TEAMS}


def get_mock_export_csv_agents() -> List[List[Any]]:
    """
    Retorna dados mockados para exportação CSV de atendentes

    Returns:
        Lista de linhas para CSV
    """
    rows = []

    # Criar mapa de metas
    targets_map = {t["user_id"]: t for t in MOCK_TARGETS}

    for agent in MOCK_AGENTS:
        target = targets_map.get(agent["user_id"], {"meta_contratos": 0, "meta_consultoria": 0})

        # Calcular atingimentos
        ating_cont = (agent["contracts"] / target["meta_contratos"]) if target["meta_contratos"] else 0
        ating_cons = (agent["consultoria_liq"] / target["meta_consultoria"]) if target["meta_consultoria"] else 0

        rows.append([
            agent["user_id"],
            agent["name"],
            agent["contracts"],
            round(agent["consultoria_liq"], 2),
            round(agent["ticket_medio"], 2),
            agent["trend_contracts"],
            round(agent["trend_consult"], 2),
            target["meta_contratos"],
            round(target["meta_consultoria"], 2),
            round(ating_cont, 4),
            round(ating_cons, 4)
        ])

    return rows


def get_mock_export_csv_teams() -> List[List[Any]]:
    """
    Retorna dados mockados para exportação CSV de times

    Returns:
        Lista de linhas para CSV
    """
    rows = []

    for team in MOCK_TEAMS:
        rows.append([
            team["team"],
            team["contracts"],
            round(team["consultoria_liq"], 2)
        ])

    return rows
