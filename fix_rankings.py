#!/usr/bin/env python3
"""
Script para corrigir os problemas no ranking e campanhas ativas
"""

import re

def fix_ranking_agents():
    """Corrige a função ranking_agents para incluir todos os usuários"""

    # Ler o arquivo atual
    with open('apps/api/app/routers/rankings.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Definir a nova função
    new_function = '''@r.get("/agents")
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

    # Primeiro, buscar TODOS os usuários do sistema
    all_users_q = db.query(User)
    if agent_id:
        all_users_q = all_users_q.filter(User.id == agent_id)

    all_users = all_users_q.offset((page-1)*per_page).limit(per_page).all()
    total_users = all_users_q.count()

    # Estratégia para encontrar o atendente dono do contrato:
    # 1) se Contract tiver agent_user_id, use;
    # 2) senão, pegue Case.assigned_user_id (fallback).
    owner_user_id = case(
        [(Contract.agent_user_id.isnot(None), Contract.agent_user_id)],
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

    # buscar metas (se existir campo User.settings)
    targets_map = {}
    # TODO: implementar busca de metas se necessário

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

        # metas (placeholder)
        meta_contratos = targets_map.get(user.id, {}).get("contratos", 0)
        meta_consultoria = targets_map.get(user.id, {}).get("consultoria", 0)

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
    }'''

    # Substituir a função existente
    pattern = r'@r\.get\("/agents"\)\ndef ranking_agents\(.*?\n    \}'
    new_content = re.sub(pattern, new_function, content, flags=re.DOTALL)

    # Escrever o arquivo corrigido
    with open('apps/api/app/routers/rankings.py', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("✅ Função ranking_agents corrigida!")

def fix_campanhas_ativas():
    """Corrige o endpoint de campanhas ativas para usar os campos corretos"""

    # Ler o arquivo atual
    with open('apps/api/app/routers/campanhas.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Corrigir Contract.user_id para usar a estratégia correta
    content = content.replace(
        'Contract.user_id == usuario.id,',
        '''case(
                    [(Contract.agent_user_id.isnot(None), Contract.agent_user_id)],
                    else_=Case.assigned_user_id
                ) == usuario.id,'''
    )

    # Corrigir Case.user_id para Case.assigned_user_id
    content = content.replace(
        'Case.user_id == usuario.id,',
        'Case.assigned_user_id == usuario.id,'
    )

    # Corrigir campos de valor nos contratos
    content = content.replace(
        'sum(float(c.valor or 0) for c in contratos)',
        'sum(float(c.total_amount or 0) for c in contratos)'
    )

    # Corrigir campos de valor nos casos para consultoria
    content = content.replace(
        'sum(float(c.valor or 0) for c in casos)',
        'sum(float(c.consultoria_valor_liquido or 0) for c in contratos)'
    )

    # Corrigir data de filtro para usar signed_at
    content = content.replace(
        'Contract.created_at >= campanha.data_inicio,\n                Contract.created_at <= campanha.data_fim',
        'Contract.signed_at >= campanha.data_inicio,\n                Contract.signed_at <= campanha.data_fim'
    )

    # Escrever o arquivo corrigido
    with open('apps/api/app/routers/campanhas.py', 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ Endpoint de campanhas ativas corrigido!")

if __name__ == "__main__":
    print("🔧 Iniciando correções...")
    fix_ranking_agents()
    fix_campanhas_ativas()
    print("✅ Todas as correções aplicadas!")
