from typing import Optional, Tuple

QUEUE_MAP = {
    "global": None,
    "atendente": "atendente",
    "calculista": "calculista",
    "pos-sim": "atendente_pos_sim",
    "atendente-pos-sim": "atendente_pos_sim",
    "gerente": "gerente_fechamento",
    "fechamento": "gerente_fechamento",
    "docs": "atendente_docs",
    "financeiro": "financeiro",
    "supervisao": "contratos_supervisao",
    "contratos": "contratos_supervisao",
}


def map_queue_to_stage(name: str) -> Optional[str]:
    return QUEUE_MAP.get((name or "").lower())


def parse_agent_decision(payload: dict) -> Tuple[Optional[str], Optional[bool]]:
    """Parses approved/reproved decision informed by the attendant."""
    if payload is None:
        return None, None
    if "approved" in payload:
        val = bool(payload["approved"])
        return ("aprovada" if val else "reprovada", val)
    if "status" in payload:
        s = str(payload["status"]).lower().strip()
        if s in ("aprovada", "reprovada"):
            return (s, s == "aprovada")
    if "simulacao_status" in payload:
        s = str(payload["simulacao_status"]).lower().strip()
        if s in ("aprovada", "reprovada"):
            return (s, s == "aprovada")
    return None, None
