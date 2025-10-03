# 🎭 Sistema de Mocks - Rankings | Guia Rápido

> **Status:** ✅ ATIVADO
> **Localização:** `apps/api/app/routers/`
> **Módulo:** Rankings

---

## 🚀 Início Rápido

### ✅ Mocks já estão ATIVOS!

Sem configuração necessária. Basta iniciar o servidor:

```bash
# Os endpoints já retornam dados mockados:
GET /rankings/agents          → 10 atendentes mockados
GET /rankings/agents/targets  → Metas mockadas
GET /rankings/teams           → 4 times mockados
GET /rankings/export.csv      → CSV com dados mockados
```

---

## 📁 Arquivos Criados

### Arquivos de Sistema (Mocks):
```
✅ apps/api/app/routers/rankings_mock_config.py   (Configuração)
✅ apps/api/app/routers/rankings_mock_data.py     (Dados)
```

### Arquivos de Documentação:
```
📚 apps/api/app/routers/RANKINGS_MOCKS_README.md  (Guia completo)
📚 apps/api/app/routers/REMOVER_MOCKS.txt         (Remoção rápida)
📚 apps/api/app/routers/MOCKS_INDEX.md            (Índice visual)
📚 MOCKS_RANKINGS_RESUMO.md                       (Resumo executivo)
📚 LEIA-ME_MOCKS.md                               (Este arquivo)
```

### Arquivo Modificado:
```
🔧 apps/api/app/routers/rankings.py               (Integração com mocks)
```

---

## 🎯 3 Ações Possíveis

### 1️⃣ USAR Mocks (Atual)
**Status:** ✅ Já configurado
**Ação:** Nenhuma! Já está funcionando

### 2️⃣ DESATIVAR Mocks (Temporário)
**Status:** Para testes com dados reais
**Ação:**
```python
# Edite: apps/api/app/routers/rankings_mock_config.py
USE_MOCK_DATA = False  # ← Mude aqui
```
Reinicie servidor → Usa dados reais

### 3️⃣ REMOVER Mocks (Permanente)
**Status:** Para produção
**Ação:** Leia `REMOVER_MOCKS.txt` e siga o passo a passo

---

## 📖 Qual Documentação Ler?

### Você quer...

**Usar os mocks agora?**
→ Não precisa ler nada! Já está ativo

**Entender como funciona?**
→ Leia: `MOCKS_RANKINGS_RESUMO.md`

**Ver detalhes técnicos?**
→ Leia: `apps/api/app/routers/RANKINGS_MOCKS_README.md`

**Remover os mocks?**
→ Leia: `apps/api/app/routers/REMOVER_MOCKS.txt`

**Ver estrutura de arquivos?**
→ Leia: `apps/api/app/routers/MOCKS_INDEX.md`

**Ver todas as alterações do projeto?**
→ Leia: `ALTERACOES.md`

---

## 🎭 Dados Mockados

### Resumo:
- **10 Atendentes** (Ana Silva, Carlos Santos, Maria Oliveira...)
- **Contratos:** 29 a 52 por atendente
- **Consultoria Líquida:** R$ 78.900 a R$ 145.600
- **4 Times** (Comercial, Técnico, Premium, Digital)
- **Metas** configuradas para cada atendente

### Exemplo de Resposta:
```json
{
  "items": [
    {
      "user_id": 1,
      "name": "Ana Silva",
      "contracts": 45,
      "consultoria_liq": 125000.50,
      "ticket_medio": 2777.78,
      "trend_contracts": 5,
      "trend_consult": 15000.00
    }
    // ... mais 9 atendentes
  ]
}
```

---

## ⚡ Decisão Rápida

### Pergunta: "Devo remover os mocks agora?"

| Situação | Resposta | Ação |
|----------|----------|------|
| Desenvolvimento local | ❌ NÃO | Mantenha para demonstrações |
| Staging/Homologação | ⚠️ OPCIONAL | Desative temporariamente |
| Produção | ✅ SIM | Remova permanentemente |

---

## 🛡️ Segurança

### Sistema de Fallback Automático

```
Mocks deletados por acidente?
    ↓
Sistema detecta arquivos faltando
    ↓
Automaticamente usa dados reais
    ↓
✅ Nunca quebra!
```

---

## 🔔 Avisos

### Ao iniciar o servidor, você verá:

```
⚠️  ATENÇÃO: Rankings está usando DADOS MOCKADOS!
Para usar dados reais:
1. Abra: apps/api/app/routers/rankings_mock_config.py
2. Mude: USE_MOCK_DATA = False
   OU delete os arquivos *_mock_*.py
```

**Isso é normal!** É um lembrete de que os mocks estão ativos.

---

## 📞 Próximos Passos

1. **Teste os endpoints** para ver os dados mockados
2. **Leia** `MOCKS_RANKINGS_RESUMO.md` para entender melhor
3. **Decida** quando remover os mocks (desenvolvimento vs produção)
4. **Siga** `REMOVER_MOCKS.txt` quando decidir remover

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────┐
│         SISTEMA DE MOCKS RANKINGS               │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: ✅ ATIVADO                            │
│  Dados:  🎭 10 Atendentes + 4 Times            │
│  Docs:   📚 6 arquivos de documentação         │
│                                                 │
│  ┌───────────────────────────────────────┐    │
│  │  USE_MOCK_DATA = True                 │    │
│  │  ↓                                     │    │
│  │  GET /rankings/agents                 │    │
│  │  → Retorna 10 atendentes mockados     │    │
│  └───────────────────────────────────────┘    │
│                                                 │
│  Para desativar: rankings_mock_config.py       │
│  Para remover:   REMOVER_MOCKS.txt             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [x] Mocks criados e funcionando
- [x] Dados realistas (10 atendentes, 4 times)
- [x] Sistema de fallback implementado
- [x] 6 arquivos de documentação criados
- [x] Marcadores claros no código
- [x] Instruções de remoção detalhadas
- [x] Teste nos endpoints confirmado

---

**Criado em:** 2025-10-03
**Por:** Claude Code
**Versão:** 1.0
**Status:** ✅ Pronto para uso

---

**Última atualização:** 2025-10-03
