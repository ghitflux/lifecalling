from typing import Any, Dict, Optional

from .models import Atendimento


def _user_in(user, group: str) -> bool:
    return user.is_superuser or user.groups.filter(name=group).exists()


def group_for_stage(stage: str) -> Optional[str]:
    return {
        "atendente": "atendente",
        "calculista": "calculista",
        "atendente_pos_sim": "atendente",
        "gerente_fechamento": "gerente",
        "atendente_docs": "atendente",
        "financeiro": "financeiro",
        "contratos_supervisao": "supervisor",
    }.get(stage)


def compute_actions(user, obj: Atendimento) -> Dict[str, Any]:
    acts: Dict[str, Any] = {
        "can_claim": False,
        "can_release": False,
        "can_forward": False,
        "next_stage": None,
        "requires": None,
    }
    if not user or not user.is_authenticated:
        return acts

    stage_group = group_for_stage(obj.stage)

    if obj.assigned_to_id is None and stage_group and _user_in(user, stage_group):
        acts["can_claim"] = True

    if obj.assigned_to_id == getattr(user, "id", None) or _user_in(user, "admin") or _user_in(user, "supervisor"):
        acts["can_release"] = True

    if obj.stage == "atendente" and _user_in(user, "atendente"):
        acts.update({"can_forward": True, "next_stage": "calculista"})
    elif obj.stage == "calculista" and _user_in(user, "calculista"):
        acts.update({"can_forward": True, "next_stage": "atendente_pos_sim"})
    elif obj.stage == "atendente_pos_sim" and _user_in(user, "atendente"):
        acts.update({"can_forward": True, "next_stage": "gerente_fechamento", "requires": "approved"})
    elif obj.stage == "gerente_fechamento" and _user_in(user, "gerente"):
        acts.update({"can_forward": True, "next_stage": "atendente_docs"})
    elif obj.stage == "atendente_docs" and _user_in(user, "atendente"):
        acts.update({"can_forward": True, "next_stage": "financeiro"})
    elif obj.stage == "financeiro" and _user_in(user, "financeiro"):
        acts.update({"can_forward": True, "next_stage": "contratos_supervisao"})

    return acts
