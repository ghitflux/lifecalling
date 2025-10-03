# 📂 Índice de Arquivos - Sistema de Mocks Rankings

## Estrutura de Arquivos

```
apps/api/app/routers/
│
├── rankings.py                      ← Modificado (endpoints integrados com mocks)
│
├── 🎭 SISTEMA DE MOCKS:
│   ├── rankings_mock_config.py      ← Configuração (USE_MOCK_DATA = True/False)
│   ├── rankings_mock_data.py        ← Dados mockados (10 atendentes, 4 times)
│   │
│   └── 📚 DOCUMENTAÇÃO:
│       ├── RANKINGS_MOCKS_README.md ← Guia completo
│       ├── REMOVER_MOCKS.txt        ← Guia rápido de remoção
│       └── MOCKS_INDEX.md           ← Este arquivo
│
└── (outros arquivos do projeto...)
```

---

## 🎯 Mapa de Navegação

### Para USAR os mocks:
1. Não faça nada! Já está ativo por padrão
2. Ou edite `rankings_mock_config.py` → `USE_MOCK_DATA = True`

### Para DESATIVAR temporariamente:
1. Edite `rankings_mock_config.py` → `USE_MOCK_DATA = False`
2. Reinicie servidor

### Para REMOVER permanentemente:
1. Leia `REMOVER_MOCKS.txt` (instruções passo a passo)
2. Ou leia `RANKINGS_MOCKS_README.md` (guia completo)

### Para ENTENDER o sistema:
1. Comece com `../../../MOCKS_RANKINGS_RESUMO.md` (resumo executivo)
2. Depois leia `RANKINGS_MOCKS_README.md` (detalhes técnicos)

---

## 🗂️ Conteúdo de Cada Arquivo

### 1. `rankings_mock_config.py` (10 linhas)
```python
USE_MOCK_DATA = True  # ← Única linha importante
```
**Propósito:** Liga/desliga os mocks

---

### 2. `rankings_mock_data.py` (250 linhas)
```python
MOCK_AGENTS = [...]        # 10 atendentes
MOCK_TARGETS = [...]       # Metas
MOCK_TEAMS = [...]         # 4 times
get_mock_agents_ranking()  # Funções de retorno
```
**Propósito:** Contém todos os dados mockados

---

### 3. `rankings.py` (modificado)
```python
# Linha ~12-28: Imports de mocks
# Linha ~64-67: Mock no endpoint /agents
# Linha ~173-176: Mock no endpoint /agents/targets
# Linha ~226-229: Mock no endpoint /teams
# Linha ~259-280: Mock no endpoint /export.csv
```
**Propósito:** Integração com sistema de mocks

---

### 4. `RANKINGS_MOCKS_README.md` (350 linhas)
- Documentação completa
- Exemplos de uso
- Instruções de remoção
- Estrutura de dados

---

### 5. `REMOVER_MOCKS.txt` (150 linhas)
- Guia rápido linha por linha
- Checklist de remoção
- Números exatos de linhas

---

### 6. `MOCKS_INDEX.md` (este arquivo)
- Índice visual
- Mapa de navegação
- Estrutura de arquivos

---

## 🔍 Busca Rápida

### Procurando por...

**Como ativar mocks?**
→ `rankings_mock_config.py` → Linha 7 → `USE_MOCK_DATA = True`

**Quais dados estão mockados?**
→ `rankings_mock_data.py` → Linhas 10-100

**Como remover tudo?**
→ `REMOVER_MOCKS.txt`

**Documentação completa?**
→ `RANKINGS_MOCKS_README.md`

**Resumo executivo?**
→ `../../../MOCKS_RANKINGS_RESUMO.md` (raiz do projeto)

**O que foi alterado?**
→ `../../../ALTERACOES.md` → Seção 10

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| Arquivos novos criados | 6 |
| Arquivos modificados | 1 (`rankings.py`) |
| Atendentes mockados | 10 |
| Times mockados | 4 |
| Linhas de código de mock | ~250 |
| Linhas de documentação | ~800 |
| Endpoints afetados | 4 |

---

## 🎨 Marcadores Visuais

No código `rankings.py`, procure por:

```python
# ========== IMPORTS DE MOCKS (REMOVER JUNTO COM OS ARQUIVOS) ==========
# ========== FIM DOS IMPORTS DE MOCKS ==========

# ========== USAR MOCK SE CONFIGURADO ==========
# ========== FIM DO MOCK ==========
```

Estes comentários marcam **exatamente** o que deletar!

---

## ⚙️ Fluxo de Decisão

```
Servidor inicia
    ↓
Arquivos de mock existem?
    ├─ NÃO → Usa dados reais do banco
    └─ SIM → USE_MOCK_DATA = True?
              ├─ SIM → Usa dados mockados
              └─ NÃO → Usa dados reais do banco
```

---

## 📞 Links Úteis

- Raiz do projeto: `../../../`
- Documentação geral: `../../../ALTERACOES.md`
- Resumo de mocks: `../../../MOCKS_RANKINGS_RESUMO.md`
- API routers: `./`

---

**Última atualização:** 2025-10-03
**Mantido por:** Sistema de mocks automático
