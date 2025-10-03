from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..db import get_db     # ou SessionLocal, conforme seu projeto
from ..rbac import require_roles
from ..models import User, Case, Contract   # ajuste imports
from datetime import datetime, timedelta, date
import io
import csv

# ========== IMPORTS DE MOCKS (REMOVER JUNTO COM OS ARQUIVOS) ==========
try:
    from .rankings_mock_config import USE_MOCK_DATA, MOCK_WARNING
    from .rankings_mock_data import (
        get_mock_agents_ranking,
        get_mock_targets,
        get_mock_teams_ranking,
        get_mock_export_csv_agents,
        get_mock_export_csv_teams
    )
    MOCKS_AVAILABLE = True
    if USE_MOCK_DATA:
        print(MOCK_WARNING)
except ImportError:
    MOCKS_AVAILABLE = False
    USE_MOCK_DATA = False
# ========== FIM DOS IMPORTS DE MOCKS ==========

r = APIRouter(prefix="/rankings", tags=["rankings"])

# Util: parse datas
def _parse_range(from_: str | None, to: str | None):
    if not from_ or not to:
        # mês atual por padrão
        today = date.today()
        start = today.replace(day=1)
        end = today
    else:
        start = datetime.fromisoformat(from_.replace("Z","+00:00")).date()
        end = datetime.fromisoformat(to.replace("Z","+00:00")).date()
    prev_span = (end - start).days or 1
    prev_start = start - timedelta(days=prev_span)
    prev_end = start - timedelta(days=1)
    return start, end, prev_start, prev_end

@r.get("/agents")
def ranking_agents(
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=500),
    agent_id: int | None = Query(None, description="Filtrar por ID do atendente"),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    """
    Ranking por atendente:
    - contratos fechados (count)
    - soma consultoria líquida
    - ticket médio
    - trend (comparado ao período anterior de mesma duração)
    """
    # ========== USAR MOCK SE CONFIGURADO ==========
    if USE_MOCK_DATA and MOCKS_AVAILABLE:
        return get_mock_agents_ranking(from_, to, page, per_page, agent_id)
    # ========== FIM DO MOCK ==========

    start, end, prev_start, prev_end = _parse_range(from_, to)

    # Estratégia para encontrar o atendente dono do contrato:
    # 1) se Contract tiver created_by/effectivated_by, use;
    # 2) senão, pegue Case.assigned_user_id (fallback).
    owner_user_id = case(
        [(Contract.created_by.isnot(None), Contract.created_by)],
        else_=Case.assigned_user_id
    )

    base_q = (db.query(
                owner_user_id.label("user_id"),
                func.count(Contract.id).label("qtd"),
                func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
            )
            .join(Case, Case.id == Contract.case_id, isouter=True)
            # Remover filtro de status para incluir todos os contratos
            # .filter(Contract.status == "ativo")
    )

    # Aplicar filtro de data apenas se especificado, usando created_at como fallback
    if from_ and to:
        base_q = base_q.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )

    if agent_id:
        base_q = base_q.filter(owner_user_id == agent_id)

    base = (
            base_q
            .group_by(owner_user_id)
            .order_by(func.sum(Contract.consultoria_valor_liquido).desc())
            .offset((page-1)*per_page)
            .limit(per_page)
          )

    rows = base.all()

    # total de atendentes distintos no período para paginação
    total_distinct_q = (
        db.query(func.count(func.distinct(owner_user_id)))
          .join(Case, Case.id == Contract.case_id, isouter=True)
          # Remover filtro de status
    )
    if from_ and to:
        total_distinct_q = total_distinct_q.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )
    if agent_id:
        total_distinct_q = total_distinct_q.filter(owner_user_id == agent_id)
    total_items = int(total_distinct_q.scalar() or 0)

    # período anterior para trend
    prev_q = (db.query(
                owner_user_id.label("user_id"),
                func.count(Contract.id).label("qtd"),
                func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
            )
            .join(Case, Case.id == Contract.case_id, isouter=True)
            # Remover filtro de status
            .group_by(owner_user_id)
    )
    if from_ and to:
        prev_q = prev_q.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(prev_start, prev_end)
        )
    prev = prev_q.all()
    prev_map = {r.user_id: {"qtd": r.qtd, "consult_sum": float(r.consult_sum or 0)} for r in prev}

    # montar resposta enriquecida
    result = []
    for r0 in rows:
        uid = r0.user_id
        consult = float(r0.consult_sum or 0)
        qtd = int(r0.qtd or 0)
        ticket = (consult / qtd) if qtd else 0.0
        prevd = prev_map.get(uid, {"qtd":0, "consult_sum":0.0})
        result.append({
            "user_id": uid,
            "name": db.get(User, uid).name if uid else "—",
            "contracts": qtd,
            "consultoria_liq": consult,
            "ticket_medio": ticket,
            "trend_contracts": qtd - prevd["qtd"],
            "trend_consult": consult - prevd["consult_sum"],
        })
    return {
        "items": result,
        "period": {"from": str(start), "to": str(end)},
        "pagination": {"page": page, "per_page": per_page, "total_items": total_items}
    }

@r.get("/agents/targets")
def get_targets(
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    """
    Lê metas salvas para cada atendente.
    Preferência: usar campo JSON existente em User (ex.: User.settings['targets']).
    Se não existir, retornar vazio (frontend trata como 0).
    """
    # ========== USAR MOCK SE CONFIGURADO ==========
    if USE_MOCK_DATA and MOCKS_AVAILABLE:
        return get_mock_targets()
    # ========== FIM DO MOCK ==========

    # Exemplo lendo de User.settings (JSONB). Adapte o nome do campo:
    rows = db.query(User).all()
    items = []
    for u in rows:
        meta = {}
        if hasattr(u, "settings") and isinstance(u.settings, dict):
            meta = (u.settings or {}).get("targets", {})

        # Meta padrão: R$ 10.000/mês de consultoria líquida
        meta_consultoria = float(meta.get("consultoria", 0) or 0.0)
        if meta_consultoria == 0:
            meta_consultoria = 10000.00  # Meta padrão

        items.append({
            "user_id": u.id,
            "name": u.name,
            "meta_contratos": int(meta.get("contracts", 0) or 0),
            "meta_consultoria": meta_consultoria,
        })
    return {"items": items}

@r.post("/agents/targets")
def set_targets(
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor")),
):
    """
    Atualiza metas por atendente:
    payload = { items: [{user_id, meta_contratos, meta_consultoria}, ...] }
    Persistir em User.settings['targets'] sem criar migração.
    """
    items = payload.get("items", [])
    updated = []
    for it in items:
        u = db.get(User, it["user_id"])
        if not u:
            continue
        if not hasattr(u, "settings") or not isinstance(u.settings, dict):
            u.settings = {}
        u.settings.setdefault("targets", {})
        u.settings["targets"]["contracts"] = int(it.get("meta_contratos", 0) or 0)
        u.settings["targets"]["consultoria"] = float(it.get("meta_consultoria", 0) or 0.0)
        updated.append(u.id)
    db.commit()
    return {"updated": updated}

@r.get("/teams")
def ranking_teams(
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    # ========== USAR MOCK SE CONFIGURADO ==========
    if USE_MOCK_DATA and MOCKS_AVAILABLE:
        return get_mock_teams_ranking(from_, to)
    # ========== FIM DO MOCK ==========

    # Como não há User.department explícito, agregamos por User.role
    start, end, *_ = _parse_range(from_, to)
    owner_user_id = case(
        [(Contract.created_by.isnot(None), Contract.created_by)],
        else_=Case.assigned_user_id
    )
    q = (db.query(
            func.coalesce(User.role, "Sem Time").label("team"),
            func.count(Contract.id).label("contracts"),
            func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
        )
        .join(Case, Case.id == Contract.case_id, isouter=True)
        .join(User, User.id == owner_user_id)
        .group_by(func.coalesce(User.role, "Sem Time"))
        .order_by(func.sum(Contract.consultoria_valor_liquido).desc())
    )

    # Aplicar filtro de data apenas se especificado
    if from_ and to:
        q = q.filter(func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end))

    rows = q.all()
    return {"items":[{"team":r.team,"contracts":int(r.contracts or 0),"consultoria_liq":float(r.consult_sum or 0)} for r in rows]}

@r.get("/export.csv")
def export_csv(
    kind: str,
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    # ========== USAR MOCK SE CONFIGURADO ==========
    if USE_MOCK_DATA and MOCKS_AVAILABLE:
        output = io.StringIO()
        writer = csv.writer(output)

        if kind == "agents":
            # Cabeçalho
            writer.writerow([
                "user_id","name","contracts","consultoria_liq","ticket_medio","trend_contracts","trend_consult",
                "meta_contratos","meta_consultoria","atingimento_contratos","atingimento_consultoria"
            ])
            # Dados mockados
            writer.writerows(get_mock_export_csv_agents())
        elif kind == "teams":
            writer.writerow(["team","contracts","consultoria_liq"])
            writer.writerows(get_mock_export_csv_teams())
        else:
            raise HTTPException(status_code=400, detail="kind deve ser 'agents' ou 'teams'")

        csv_data = output.getvalue()
        return Response(content=csv_data, media_type="text/csv")
    # ========== FIM DO MOCK ==========

    # gere CSV em memória conforme 'agents' ou 'teams'
    start, end, prev_start, prev_end = _parse_range(from_, to)

    output = io.StringIO()
    writer = csv.writer(output)

    if kind == "agents":
        owner_user_id = case(
            [(Contract.created_by.isnot(None), Contract.created_by)],
            else_=Case.assigned_user_id
        )
        rows = (db.query(
                    owner_user_id.label("user_id"),
                    func.count(Contract.id).label("qtd"),
                    func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
                )
                .join(Case, Case.id == Contract.case_id)
                .filter(
                    Contract.status == "ativo",
                    func.date(Contract.signed_at).between(start, end)
                )
                .group_by(owner_user_id)
                .order_by(func.sum(Contract.consultoria_valor_liquido).desc())
               ).all()

        prev = (db.query(
                    owner_user_id.label("user_id"),
                    func.count(Contract.id).label("qtd"),
                    func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
                )
                .join(Case, Case.id == Contract.case_id)
                .filter(
                    Contract.status == "ativo",
                    func.date(Contract.signed_at).between(prev_start, prev_end)
                )
                .group_by(owner_user_id)
               ).all()
        prev_map = {r.user_id: {"qtd": int(r.qtd or 0), "consult_sum": float(r.consult_sum or 0)} for r in prev}

        # cabeçalho
        writer.writerow([
            "user_id","name","contracts","consultoria_liq","ticket_medio","trend_contracts","trend_consult",
            "meta_contratos","meta_consultoria","atingimento_contratos","atingimento_consultoria"
        ])

        # metas por usuário (opcional via User.settings)
        user_targets: dict[int, dict] = {}
        for u in db.query(User).all():
            meta = {}
            if hasattr(u, "settings") and isinstance(getattr(u, "settings"), dict):
                meta = (u.settings or {}).get("targets", {})
            user_targets[u.id] = {
                "contracts": int(meta.get("contracts", 0) or 0),
                "consultoria": float(meta.get("consultoria", 0.0) or 0.0),
            }

        for r0 in rows:
            uid = r0.user_id
            consult = float(r0.consult_sum or 0)
            qtd = int(r0.qtd or 0)
            ticket = (consult / qtd) if qtd else 0.0
            prevd = prev_map.get(uid, {"qtd":0, "consult_sum":0.0})
            targets = user_targets.get(uid, {"contracts":0, "consultoria":0.0})
            ating_cont = (qtd / targets["contracts"]) if targets["contracts"] else 0.0
            ating_cons = (consult / targets["consultoria"]) if targets["consultoria"] else 0.0

            writer.writerow([
                uid,
                (db.get(User, uid).name if uid else "—"),
                qtd,
                round(consult, 2),
                round(ticket, 2),
                qtd - prevd["qtd"],
                round(consult - prevd["consult_sum"], 2),
                targets["contracts"],
                round(targets["consultoria"], 2),
                round(ating_cont, 4),
                round(ating_cons, 4),
            ])

    elif kind == "teams":
        owner_user_id = case(
            [(Contract.created_by.isnot(None), Contract.created_by)],
            else_=Case.assigned_user_id
        )
        rows = (db.query(
                    func.coalesce(User.role, "Sem Time").label("team"),
                    func.count(Contract.id).label("contracts"),
                    func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
                )
                .join(Case, Case.id == Contract.case_id)
                .join(User, User.id == owner_user_id)
                .filter(Contract.status=="ativo", func.date(Contract.signed_at).between(start, end))
                .group_by(func.coalesce(User.role, "Sem Time"))
                .order_by(func.sum(Contract.consultoria_valor_liquido).desc())
               ).all()
        writer.writerow(["team","contracts","consultoria_liq"])
        for r0 in rows:
            writer.writerow([r0.team, int(r0.contracts or 0), round(float(r0.consult_sum or 0), 2)])
    else:
        raise HTTPException(status_code=400, detail="kind deve ser 'agents' ou 'teams'")

    csv_data = output.getvalue()
    return Response(content=csv_data, media_type="text/csv")
