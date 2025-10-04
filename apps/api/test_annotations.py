#!/usr/bin/env python3
"""
Script para criar eventos de teste com anotações
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from app.db import SessionLocal
from app.models import Case, CaseEvent, User

def create_test_annotations():
    """Cria eventos de teste com anotações para verificar o frontend"""
    
    with SessionLocal() as db:
        # Buscar um caso existente
        case = db.query(Case).first()
        if not case:
            print("❌ Nenhum caso encontrado. Execute os seeds primeiro.")
            return
            
        # Buscar um usuário atendente
        user = db.query(User).filter(User.role.in_(["atendente", "supervisor"])).first()
        if not user:
            print("❌ Nenhum usuário atendente encontrado.")
            return
            
        print(f"📝 Criando anotações para o caso {case.id}")
        
        # Criar eventos com diferentes tipos de anotações
        test_events = [
            {
                "type": "closing.approved",
                "payload": {
                    "notes": "Cliente aprovado após análise detalhada. Documentação completa e renda comprovada.",
                    "decision": "approved",
                    "amount": 50000.00
                }
            },
            {
                "type": "closing.rejected", 
                "payload": {
                    "notes": "Documentação incompleta. Cliente precisa apresentar comprovante de renda atualizado.",
                    "decision": "rejected",
                    "reason": "incomplete_documentation"
                }
            },
            {
                "type": "case.observation",
                "payload": {
                    "notes": "Cliente ligou solicitando informações sobre o andamento do processo. Informado sobre próximos passos.",
                    "contact_type": "phone_call"
                }
            },
            {
                "type": "simulation.comment",
                "payload": {
                    "notes": "Simulação revisada com novos parâmetros. Taxa ajustada conforme perfil do cliente.",
                    "simulation_id": case.last_simulation_id
                }
            }
        ]
        
        for i, event_data in enumerate(test_events):
            event = CaseEvent(
                case_id=case.id,
                type=event_data["type"],
                payload=event_data["payload"],
                created_by=user.id,
                created_at=datetime.utcnow()
            )
            db.add(event)
            print(f"✅ Evento {i+1} criado: {event_data['type']}")
            
        db.commit()
        print(f"🎉 {len(test_events)} eventos com anotações criados para o caso {case.id}")
        print(f"🔗 Acesse: http://localhost:3002/fechamento/{case.id}")

if __name__ == "__main__":
    create_test_annotations()