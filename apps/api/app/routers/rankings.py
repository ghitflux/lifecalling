from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..db import get_db
from ..rbac import require_roles
from ..models import User, Case, Contract
from datetime import datetime, timedelta, date
import io
import csv

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
    Ranking por atendente - TODOS os usuários do sistema:
    - contratos fechados (count)
    - soma consultoria líquida
    - ticket médio
    - trend (comparado ao período anterior de mesma duração)
    """

    start, end, prev_start, prev_end = _parse_range(from_, to)

    # Buscar TODOS os usuários do sistema (não só atendentes)
    all_users_q = db.query(User)
    if agent_id:
        all_users_q = all_users_q.filter(User.id == agent_id)

    all_users = all_users_q.offset((page-1)*per_page).limit(per_page).all()
    total_users = all_users_q.count()

    # Estratégia para encontrar o atendente dono do contrato:
    # 1) se Contract tiver agent_user_id, use;
    # 2) senão, pegue Case.assigned_user_id (fallback).
    owner_user_id = case(
        (Contract.agent_user_id.isnot(None), Contract.agent_user_id),
        else_=Case.assigned_user_id
    )

    # Buscar dados de contratos para o período atual
    contracts_q = (db.query(
                owner_user_id.label("user_id"),
                func.count(Contract.id).label("qtd"),
                func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
            )
            .join(Case, Case.id == Contract.case_id, isouter=True)
            .filter(Contract.status == "ativo")
    )

    # Aplicar filtro de data usando signed_at como principal
    if from_ and to:
        contracts_q = contracts_q.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )

    contracts_data = contracts_q.group_by(owner_user_id).all()
    contracts_map = {r.user_id: {"qtd": r.qtd, "consult_sum": float(r.consult_sum or 0)} for r in contracts_data}

    # REMOVIDO: Não somar FinanceIncome, pois causava duplicação
    # Contract.consultoria_valor_liquido já contém o valor da receita
    # FinanceIncome é apenas um registro separado para o módulo financeiro

    # período anterior para trend
    prev_q = (db.query(
                owner_user_id.label("user_id"),
                func.count(Contract.id).label("qtd"),
                func.coalesce(func.sum(Contract.consultoria_valor_liquido),0).label("consult_sum")
            )
            .join(Case, Case.id == Contract.case_id, isouter=True)
            .filter(Contract.status == "ativo")
            .group_by(owner_user_id)
    )
    if from_ and to:
        prev_q = prev_q.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(prev_start, prev_end)
        )
    prev = prev_q.all()
    prev_map = {r.user_id: {"qtd": r.qtd, "consult_sum": float(r.consult_sum or 0)} for r in prev}

    # REMOVIDO: Não somar FinanceIncome do período anterior também

    # buscar metas (se existir campo User.settings)
    targets_map = {}
    for u in all_users:
        if hasattr(u, "settings") and isinstance(u.settings, dict):
            targets = u.settings.get("targets", {})
            targets_map[u.id] = {
                "contratos": int(targets.get("contracts", 0) or 0),
                "consultoria": float(targets.get("consultoria", 10000.0) or 10000.0)
            }
        else:
            targets_map[u.id] = {"contratos": 0, "consultoria": 10000.0}

    items = []
    for user in all_users:
        # Dados do período atual (pode ser 0 se não tiver contratos)
        current_data = contracts_map.get(user.id, {"qtd": 0, "consult_sum": 0})
        prev_data = prev_map.get(user.id, {"qtd": 0, "consult_sum": 0})

        # trend
        trend_contracts = 0
        trend_consult = 0
        if prev_data["qtd"] > 0:
            trend_contracts = ((current_data["qtd"] - prev_data["qtd"]) / prev_data["qtd"]) * 100
        if prev_data["consult_sum"] > 0:
            trend_consult = ((current_data["consult_sum"] - prev_data["consult_sum"]) / prev_data["consult_sum"]) * 100

        # ticket médio
        ticket_medio = current_data["consult_sum"] / current_data["qtd"] if current_data["qtd"] > 0 else 0

        # metas (buscar do settings ou usar padrão)
        meta_contratos = targets_map.get(user.id, {}).get("contratos", 0)
        meta_consultoria = targets_map.get(user.id, {}).get("consultoria", 10000.0)

        # atingimento
        atingimento_contratos = (current_data["qtd"] / meta_contratos * 100) if meta_contratos > 0 else 0
        atingimento_consultoria = (current_data["consult_sum"] / meta_consultoria * 100) if meta_consultoria > 0 else 0

        items.append({
            "user_id": user.id,
            "name": user.name,
            "contracts": current_data["qtd"],
            "consultoria_liq": current_data["consult_sum"],
            "ticket_medio": ticket_medio,
            "trend_contracts": round(trend_contracts, 2),
            "trend_consult": round(trend_consult, 2),
            "meta_contratos": meta_contratos,
            "meta_consultoria": meta_consultoria,
            "atingimento_contratos": round(atingimento_contratos, 2),
            "atingimento_consultoria": round(atingimento_consultoria, 2)
        })

    # Ordenar por consultoria líquida (maior primeiro)
    items.sort(key=lambda x: x["consultoria_liq"], reverse=True)

    return {
        "items": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total_users,
            "pages": (total_users + per_page - 1) // per_page
        }
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

    # Buscar apenas atendentes
    rows = db.query(User).filter(User.role == "atendente").all()
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
    # Como não há User.department explícito, agregamos por User.role
    start, end, *_ = _parse_range(from_, to)
    owner_user_id = case(
        (Contract.created_by.isnot(None), Contract.created_by),
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
    # gere CSV em memória conforme 'agents' ou 'teams'
    start, end, prev_start, prev_end = _parse_range(from_, to)

    output = io.StringIO()
    writer = csv.writer(output)

    if kind == "agents":
        owner_user_id = case(
            (Contract.created_by.isnot(None), Contract.created_by),
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

        # metas por usuário - apenas atendentes
        user_targets: dict[int, dict] = {}
        for u in db.query(User).filter(User.role == "atendente").all():
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
            (Contract.created_by.isnot(None), Contract.created_by),
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

@r.get("/podium")
def get_podium(
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    """
    Retorna Top 3 usuários por volume de consultoria líquida e contratos efetivados.
    Apenas contratos com status="ativo" são considerados.
    """
    start, end, prev_start, prev_end = _parse_range(from_, to)

    # Estratégia para encontrar o atendente dono do contrato
    owner_user_id = case(
        (Contract.agent_user_id.isnot(None), Contract.agent_user_id),
        else_=Case.assigned_user_id
    )

    # Query para ranking por consultoria líquida - apenas atendentes
    ranking_query = (db.query(
                owner_user_id.label("user_id"),
                func.count(Contract.id).label("contracts"),
                func.coalesce(func.sum(Contract.consultoria_valor_liquido), 0).label("consultoria_liq")
            )
            .join(Case, Case.id == Contract.case_id, isouter=True)
            .join(User, User.id == owner_user_id)
            .filter(Contract.status == "ativo")
            .filter(User.role == "atendente"))  # Filtrar apenas atendentes ANTES do limit

    if from_ and to:
        ranking_query = ranking_query.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )

    ranking_data = ranking_query.group_by(owner_user_id).all()

    # Criar mapa de pontuação dos contratos
    podium_map = {r.user_id: {"contracts": int(r.contracts or 0), "consultoria_liq": float(r.consultoria_liq or 0)} for r in ranking_data}

    # REMOVIDO: Não somar FinanceIncome, pois causava duplicação

    # Ordenar por consultoria líquida e pegar Top 3
    sorted_users = sorted(podium_map.items(), key=lambda x: x[1]["consultoria_liq"], reverse=True)[:3]

    # Formatar Top 3
    podium = []
    for idx, (user_id, data) in enumerate(sorted_users):
        user_obj = db.get(User, user_id)
        if user_obj and user_obj.role == "atendente":  # Filtrar apenas atendentes
            podium.append({
                "position": idx + 1,
                "user_id": user_id,
                "name": user_obj.name,
                "contracts": data["contracts"],
                "consultoria_liq": data["consultoria_liq"]
            })

    return {
        "period": {"from": str(start), "to": str(end)},
        "podium": podium
    }

@r.get("/kpis")
def get_rankings_kpis(
    from_: str | None = Query(None, alias="from"),
    to: str | None = None,
    user_id: int | None = Query(None, description="Filtrar por ID do usuário específico"),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    """
    KPIs agregados do módulo Rankings:
    - Se user_id fornecido: retorna KPIs individuais do usuário
    - Caso contrário: KPIs agregados de todos os usuários
    """
    start, end, prev_start, prev_end = _parse_range(from_, to)

    # Estratégia para encontrar o atendente dono do contrato
    owner_user_id = case(
        (Contract.agent_user_id.isnot(None), Contract.agent_user_id),
        else_=Case.assigned_user_id
    )

    # Se user_id fornecido, retornar KPIs individuais
    if user_id:
        # Buscar dados do usuário específico
        user_obj = db.get(User, user_id)
        if not user_obj:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        # Contratos do usuário no período
        user_contracts_query = (db.query(Contract)
                               .join(Case, Case.id == Contract.case_id, isouter=True)
                               .filter(Contract.status == "ativo"))

        # Aplicar filtro de usuário
        user_contracts_query = user_contracts_query.filter(
            func.coalesce(Contract.agent_user_id, Case.assigned_user_id) == user_id
        )

        if from_ and to:
            user_contracts_query = user_contracts_query.filter(
                func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
            )

        # Calcular métricas do usuário
        user_contracts = user_contracts_query.count()
        user_consultoria = float(user_contracts_query.with_entities(
            func.coalesce(func.sum(Contract.consultoria_valor_liquido), 0)
        ).scalar() or 0)

        # REMOVIDO: Não somar FinanceIncome, pois causava duplicação

        # Buscar meta do usuário
        meta = {}
        if hasattr(user_obj, "settings") and isinstance(user_obj.settings, dict):
            meta = (user_obj.settings or {}).get("targets", {})
        meta_contratos = int(meta.get("contracts", 0) or 0)
        meta_consultoria = float(meta.get("consultoria", 0) or 10000.0)
        if meta_consultoria == 0:
            meta_consultoria = 10000.0

        # Calcular progresso
        progresso_contratos = (user_contracts / meta_contratos * 100) if meta_contratos > 0 else 0
        progresso_consultoria = (user_consultoria / meta_consultoria * 100) if meta_consultoria > 0 else 0

        return {
            "period": {"from": str(start), "to": str(end)},
            "user_id": user_id,
            "name": user_obj.name,
            "kpis": {
                "contracts": user_contracts,
                "consultoria_liq": round(user_consultoria, 2),
                "meta_contratos": meta_contratos,
                "meta_consultoria": round(meta_consultoria, 2),
                "progresso_contratos": round(progresso_contratos, 1),
                "progresso_consultoria": round(progresso_consultoria, 1),
                "falta_contratos": max(0, meta_contratos - user_contracts),
                "falta_consultoria": max(0, round(meta_consultoria - user_consultoria, 2))
            }
        }

    # KPIs agregados (todos os usuários)
    # Estratégia para encontrar o atendente dono do contrato
    owner_user_id = case(
        (Contract.agent_user_id.isnot(None), Contract.agent_user_id),
        else_=Case.assigned_user_id
    )

    # Query base para contratos no período
    base_q = (db.query(Contract)
              .join(Case, Case.id == Contract.case_id, isouter=True))

    if from_ and to:
        base_q = base_q.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )

    # Total de contratos no período
    total_contracts = base_q.count()

    # Consultoria líquida total
    total_consultoria = float(base_q.with_entities(
        func.coalesce(func.sum(Contract.consultoria_valor_liquido), 0)
    ).scalar() or 0)

    # Ticket médio geral
    ticket_medio_geral = (total_consultoria / total_contracts) if total_contracts > 0 else 0

    # Atendentes únicos no período
    atendentes_query = (db.query(func.distinct(owner_user_id))
                       .join(Case, Case.id == Contract.case_id, isouter=True))

    if from_ and to:
        atendentes_query = atendentes_query.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )

    total_atendentes = atendentes_query.count()

    # Performance por atendente para calcular metas atingidas e top performer
    performance_query = (db.query(
        owner_user_id.label("user_id"),
        func.count(Contract.id).label("qtd"),
        func.coalesce(func.sum(Contract.consultoria_valor_liquido), 0).label("consult_sum")
    )
    .join(Case, Case.id == Contract.case_id, isouter=True)
    .group_by(owner_user_id))

    if from_ and to:
        performance_query = performance_query.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
        )

    performance_results = performance_query.all()

    # Calcular atendentes que atingiram meta (R$ 10.000 padrão)
    meta_default = 10000.0
    atendentes_meta_atingida = 0
    top_performer = None
    max_consultoria = 0

    # Buscar metas personalizadas dos usuários - apenas atendentes
    user_targets = {}
    for u in db.query(User).filter(User.role == "atendente").all():
        meta = {}
        if hasattr(u, "settings") and isinstance(u.settings, dict):
            meta = (u.settings or {}).get("targets", {})
        meta_consultoria = float(meta.get("consultoria", 0) or 0.0)
        if meta_consultoria == 0:
            meta_consultoria = meta_default
        user_targets[u.id] = meta_consultoria

    for perf in performance_results:
        if not perf.user_id:
            continue

        consultoria = float(perf.consult_sum or 0)
        meta_usuario = user_targets.get(perf.user_id, meta_default)

        # Verificar se atingiu meta
        if consultoria >= meta_usuario:
            atendentes_meta_atingida += 1

        # Verificar se é o top performer
        if consultoria > max_consultoria:
            max_consultoria = consultoria
            user = db.get(User, perf.user_id)
            top_performer = {
                "user_id": perf.user_id,
                "name": user.name if user else "—",
                "consultoria_liq": consultoria,
                "contracts": int(perf.qtd or 0)
            }

    # Período anterior para comparação
    prev_query = (db.query(Contract)
                  .join(Case, Case.id == Contract.case_id, isouter=True))

    if from_ and to:
        prev_query = prev_query.filter(
            func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(prev_start, prev_end)
        )

    prev_total_contracts = prev_query.count()
    prev_total_consultoria = float(prev_query.with_entities(
        func.coalesce(func.sum(Contract.consultoria_valor_liquido), 0)
    ).scalar() or 0)

    # Calcular trends
    trend_contracts = total_contracts - prev_total_contracts
    trend_consultoria = total_consultoria - prev_total_consultoria
    trend_contracts_percent = (trend_contracts / prev_total_contracts * 100) if prev_total_contracts > 0 else 0
    trend_consultoria_percent = (trend_consultoria / prev_total_consultoria * 100) if prev_total_consultoria > 0 else 0

    return {
        "period": {"from": str(start), "to": str(end)},
        "kpis": {
            "total_atendentes": total_atendentes,
            "total_contracts": total_contracts,
            "total_consultoria": round(total_consultoria, 2),
            "ticket_medio_geral": round(ticket_medio_geral, 2),
            "atendentes_meta_atingida": atendentes_meta_atingida,
            "percentual_meta_atingida": round((atendentes_meta_atingida / total_atendentes * 100) if total_atendentes > 0 else 0, 1),
            "top_performer": top_performer,
            "trends": {
                "contracts": trend_contracts,
                "contracts_percent": round(trend_contracts_percent, 1),
                "consultoria": round(trend_consultoria, 2),
                "consultoria_percent": round(trend_consultoria_percent, 1)
            }
        }
    }
