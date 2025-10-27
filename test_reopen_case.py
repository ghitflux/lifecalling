"""
Teste de reabertura de caso efetivado
- Caso #35197 (CLEMILTON RODRIGUES DE SOUSA)
- Contrato #25
- 1 receita: ID 32 "Consultoria 100% - CLEMILTON RODRIGUES DE SOUSA (Contrato #25)"
"""

import requests
import json

API_BASE = "http://localhost:8000/api"
CASE_ID = 35197

print("\n=== TESTE: Reabertura de Caso Efetivado ===\n")

# 1. Verificar receitas ANTES da reabertura
print("1. Verificando receitas ANTES da reabertura...")
# Usarei o banco direto via docker exec
import subprocess

result = subprocess.run([
    'docker', 'compose', 'exec', '-T', 'db', 
    'psql', '-U', 'lifecalling', '-d', 'lifecalling',
    '-c', f"SELECT id, income_type, income_name FROM finance_incomes WHERE income_name LIKE '%(Contrato #25)%';"
], capture_output=True, text=True, cwd='d:/apps/trae/lifecallingv1/lifecalling')

print(result.stdout)

# 2. Tentar reabrir o caso via API
print("\n2. Tentando reabrir caso #35197 via API...")
print("   (Nota: Precisa de autenticação - admin ou financeiro)")

# Simular request (sem autenticação real por ora)
print("   SIMULAÇÃO: POST /api/finance/cases/35197/reopen")
print("   Esperado: 200 OK com mensagem de sucesso e deleted_incomes: 1")

# 3. Verificar receitas DEPOIS da reabertura
print("\n3. Verificando receitas DEPOIS da reabertura...")
print("   (Execute manualmente via curl com token de autenticação)")

print("\n=== COMANDO MANUAL PARA TESTE ===")
print("""
# 1. Obter token de autenticação:
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# 2. Reabrir caso (substitua TOKEN pelo token obtido):
curl -X POST http://localhost:8000/api/finance/cases/35197/reopen \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# 3. Verificar receitas deletadas:
docker compose exec -T db psql -U lifecalling -d lifecalling -c \
  "SELECT id, income_name FROM finance_incomes WHERE income_name LIKE '%(Contrato #25)%';"
""")

print("\n=== VALIDAÇÃO ESPERADA ===")
print("✅ Resposta API: deleted_incomes = 1")
print("✅ Banco de dados: 0 receitas encontradas após reabertura")
print("✅ Status do caso: financeiro_pendente")

