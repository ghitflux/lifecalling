# 🎭 Dados Mockados - Módulo Rankings

## 📋 Visão Geral

Este módulo de Rankings está configurado com **dados mockados** para demonstração e testes.

### Arquivos de Mock

1. **`rankings_mock_config.py`** - Configuração para ativar/desativar mocks
2. **`rankings_mock_data.py`** - Dados mockados de rankings, metas e times
3. **`rankings.py`** - Modificado para usar mocks quando configurado

---

## ✅ Como Funciona

### Configuração Atual

Por padrão, os mocks estão **ATIVADOS**:

```python
# rankings_mock_config.py
USE_MOCK_DATA = True  # ← Mocks ATIVADOS
```

### Dados Mockados Incluídos

#### 👥 **10 Atendentes** com:
- Nome
- Contratos fechados (variando de 29 a 52)
- Consultoria líquida (R$ 78.900 a R$ 145.600)
- Ticket médio (~R$ 2.700)
- Tendência (trend positiva e negativa)

#### 🎯 **Metas por Atendente**:
- Meta de contratos (35 a 50)
- Meta de consultoria (R$ 94.500 a R$ 135.000)

#### 👥 **4 Times**:
- Atendimento Comercial
- Atendimento Técnico
- Atendimento Premium
- Atendimento Digital

---

## 🔧 Como Usar

### Opção 1: Manter Mocks Ativos (Padrão)

Nenhuma ação necessária. Os endpoints já retornam dados mockados:

```bash
GET /rankings/agents          # Retorna 10 atendentes mockados
GET /rankings/agents/targets  # Retorna metas mockadas
GET /rankings/teams           # Retorna 4 times mockados
GET /rankings/export.csv      # Exporta CSV com dados mockados
```

### Opção 2: Desativar Mocks Temporariamente

Edite o arquivo `rankings_mock_config.py`:

```python
# Mude de True para False
USE_MOCK_DATA = False  # ← Mocks DESATIVADOS
```

Reinicie o servidor da API e os endpoints usarão **dados reais do banco**.

---

## 🗑️ Como Remover Completamente os Mocks

### Passo 1: Deletar Arquivos de Mock

Delete os seguintes arquivos:

```bash
rm apps/api/app/routers/rankings_mock_config.py
rm apps/api/app/routers/rankings_mock_data.py
rm apps/api/app/routers/RANKINGS_MOCKS_README.md  # Este arquivo
```

### Passo 2: Limpar Imports em `rankings.py`

Abra `apps/api/app/routers/rankings.py` e **DELETE** as seguintes linhas:

#### 🔴 **DELETAR ESTE BLOCO (linhas ~12-28)**:
```python
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
```

### Passo 3: Remover Verificações de Mock nos Endpoints

Procure e **DELETE** os seguintes blocos em cada endpoint:

#### No endpoint `/agents` (linha ~64-67):
```python
# ========== USAR MOCK SE CONFIGURADO ==========
if USE_MOCK_DATA and MOCKS_AVAILABLE:
    return get_mock_agents_ranking(from_, to, page, per_page, agent_id)
# ========== FIM DO MOCK ==========
```

#### No endpoint `/agents/targets` (linha ~173-176):
```python
# ========== USAR MOCK SE CONFIGURADO ==========
if USE_MOCK_DATA and MOCKS_AVAILABLE:
    return get_mock_targets()
# ========== FIM DO MOCK ==========
```

#### No endpoint `/teams` (linha ~226-229):
```python
# ========== USAR MOCK SE CONFIGURADO ==========
if USE_MOCK_DATA and MOCKS_AVAILABLE:
    return get_mock_teams_ranking(from_, to)
# ========== FIM DO MOCK ==========
```

#### No endpoint `/export.csv` (linha ~259-280):
```python
# ========== USAR MOCK SE CONFIGURADO ==========
if USE_MOCK_DATA and MOCKS_AVAILABLE:
    output = io.StringIO()
    writer = csv.writer(output)

    if kind == "agents":
        # Cabeçalho
        writer.writerow([...])
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
```

### Passo 4: Reiniciar Servidor

```bash
# Reinicie a API
# Os endpoints agora usarão 100% dados reais do banco
```

---

## 📊 Estrutura dos Dados Mockados

### Exemplo de Atendente:
```python
{
    "user_id": 1,
    "name": "Ana Silva",
    "contracts": 45,
    "consultoria_liq": 125000.50,
    "ticket_medio": 2777.78,
    "trend_contracts": 5,
    "trend_consult": 15000.00
}
```

### Exemplo de Meta:
```python
{
    "user_id": 1,
    "name": "Ana Silva",
    "meta_contratos": 50,
    "meta_consultoria": 135000.00
}
```

### Exemplo de Time:
```python
{
    "team": "Atendimento Comercial",
    "contracts": 125,
    "consultoria_liq": 342500.00
}
```

---

## 🎯 Cenários de Uso

### Para Desenvolvimento/Demonstração
- ✅ Mantenha `USE_MOCK_DATA = True`
- ✅ Dados sempre disponíveis, mesmo sem banco populado
- ✅ Perfeito para testes de frontend

### Para Staging/Testes com Dados Reais
- ✅ Mude para `USE_MOCK_DATA = False`
- ✅ Não delete os arquivos (pode voltar aos mocks facilmente)

### Para Produção
- ✅ Delete todos os arquivos de mock
- ✅ Limpe o código em `rankings.py`
- ✅ Use apenas dados reais do banco

---

## ⚠️ Avisos Importantes

### 🔔 Alerta ao Iniciar o Servidor

Quando mocks estão ativos, você verá este aviso no console:

```
⚠️  ATENÇÃO: Rankings está usando DADOS MOCKADOS!
Para usar dados reais:
1. Abra: apps/api/app/routers/rankings_mock_config.py
2. Mude: USE_MOCK_DATA = False
   OU delete os arquivos *_mock_*.py
```

### 🛡️ Proteção contra Erros

Se você deletar os arquivos de mock mas esquecer de limpar o código:
- ✅ O sistema **não quebra**
- ✅ Automaticamente usa dados reais (fallback)
- ✅ Nenhum erro será lançado

---

## 🔍 Verificação Rápida

### Como saber se mocks estão ativos?

```bash
# Teste o endpoint
curl http://localhost:8000/rankings/agents

# Se retornar "Ana Silva", "Carlos Santos", etc → Mocks ATIVOS ✅
# Se retornar dados do seu banco → Dados REAIS ✅
```

---

## 📞 Suporte

Se tiver dúvidas sobre os mocks:
1. Verifique `USE_MOCK_DATA` em `rankings_mock_config.py`
2. Confira os logs do servidor ao iniciar
3. Teste os endpoints diretamente

---

**Última atualização:** 2025-10-03
**Autor:** Claude Code
