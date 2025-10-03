# 🎭 Resumo: Dados Mockados - Rankings

## ✅ O que foi feito

Criei um sistema completo de **dados mockados** para o módulo Rankings que:

1. ✅ **Funciona imediatamente** - Dados prontos para uso
2. ✅ **Fácil de remover** - Arquivos separados e bem marcados
3. ✅ **Nunca quebra** - Fallback automático para dados reais
4. ✅ **Totalmente documentado** - 3 arquivos de documentação

---

## 📁 Arquivos Criados

### 1️⃣ Configuração
```
apps/api/app/routers/rankings_mock_config.py
```
- Flag `USE_MOCK_DATA = True/False`
- Controla se usa mocks ou dados reais

### 2️⃣ Dados Mockados
```
apps/api/app/routers/rankings_mock_data.py
```
- 10 atendentes com dados realistas
- Metas por atendente
- 4 times mockados
- Funções de exportação CSV

### 3️⃣ Documentação
```
apps/api/app/routers/RANKINGS_MOCKS_README.md      (Guia completo)
apps/api/app/routers/REMOVER_MOCKS.txt             (Guia rápido de remoção)
MOCKS_RANKINGS_RESUMO.md                           (Este arquivo)
```

### 4️⃣ Código Modificado
```
apps/api/app/routers/rankings.py
```
- Integração com sistema de mocks
- Todos os blocos marcados com comentários especiais

---

## 🎯 Como Usar

### ✅ Mocks ATIVADOS (padrão atual)

Sem fazer nada, já está funcionando!

```bash
# Todos esses endpoints retornam dados mockados:
GET /rankings/agents
GET /rankings/agents/targets
GET /rankings/teams
GET /rankings/export.csv
```

**Você verá:**
- Ana Silva, Carlos Santos, Maria Oliveira...
- 10 atendentes com contratos entre 29-52
- 4 times (Comercial, Técnico, Premium, Digital)

---

## 🔧 Como Desativar

### Opção 1: Temporariamente (Recomendado para testes)

Edite `rankings_mock_config.py`:
```python
USE_MOCK_DATA = False  # ← Mude aqui
```

Reinicie o servidor → Agora usa dados reais!

### Opção 2: Permanentemente (Produção)

1. **Delete 4 arquivos:**
   ```bash
   rm apps/api/app/routers/rankings_mock_config.py
   rm apps/api/app/routers/rankings_mock_data.py
   rm apps/api/app/routers/RANKINGS_MOCKS_README.md
   rm apps/api/app/routers/REMOVER_MOCKS.txt
   ```

2. **Limpe `rankings.py`:**
   - Abra `REMOVER_MOCKS.txt`
   - Siga as instruções linha por linha
   - Delete blocos marcados com `========== MOCK`

3. **Reinicie servidor** → Pronto!

---

## 🔍 Onde Procurar

### Marcadores Especiais no Código

Procure por estas linhas em `rankings.py`:

```python
# ========== IMPORTS DE MOCKS (REMOVER JUNTO COM OS ARQUIVOS) ==========
# ...
# ========== FIM DOS IMPORTS DE MOCKS ==========

# ========== USAR MOCK SE CONFIGURADO ==========
# ...
# ========== FIM DO MOCK ==========
```

**Tudo entre esses marcadores pode ser deletado!**

---

## 📊 Dados Mockados

### 10 Atendentes:
| Nome | Contratos | Consultoria Líq. |
|------|-----------|-----------------|
| Ana Silva | 45 | R$ 125.000,50 |
| Carlos Santos | 38 | R$ 98.500,75 |
| Maria Oliveira | 52 | R$ 145.600,25 |
| João Pereira | 41 | R$ 112.300,00 |
| Fernanda Costa | 35 | R$ 95.800,00 |
| Roberto Lima | 29 | R$ 78.900,50 |
| Patricia Souza | 47 | R$ 132.400,00 |
| Ricardo Alves | 33 | R$ 89.700,00 |
| Juliana Martins | 44 | R$ 119.500,75 |
| Eduardo Ferreira | 31 | R$ 84.200,00 |

### 4 Times:
| Time | Contratos | Consultoria Líq. |
|------|-----------|-----------------|
| Atendimento Comercial | 125 | R$ 342.500,00 |
| Atendimento Técnico | 98 | R$ 267.800,00 |
| Atendimento Premium | 87 | R$ 245.600,00 |
| Atendimento Digital | 115 | R$ 315.400,00 |

---

## 🛡️ Segurança

### Proteção contra Erros

```python
try:
    # Tenta importar mocks
    from .rankings_mock_config import USE_MOCK_DATA
    MOCKS_AVAILABLE = True
except ImportError:
    # Se arquivos foram deletados, usa dados reais
    MOCKS_AVAILABLE = False
    USE_MOCK_DATA = False
```

**Resultado:** Nunca quebra! Se deletar arquivos e esquecer de limpar código, automaticamente usa dados reais.

---

## 📝 Checklist de Remoção

- [ ] Deletar `rankings_mock_config.py`
- [ ] Deletar `rankings_mock_data.py`
- [ ] Deletar `RANKINGS_MOCKS_README.md`
- [ ] Deletar `REMOVER_MOCKS.txt`
- [ ] Deletar `MOCKS_RANKINGS_RESUMO.md` (este arquivo)
- [ ] Abrir `rankings.py`
- [ ] Deletar bloco de imports (linhas ~12-28)
- [ ] Deletar 4 blocos de verificação nos endpoints
- [ ] Reiniciar servidor
- [ ] Testar endpoints
- [ ] ✅ Concluído!

---

## ⚠️ Lembrete Visual

Ao iniciar o servidor com mocks ativos, você verá:

```
⚠️  ATENÇÃO: Rankings está usando DADOS MOCKADOS!
Para usar dados reais:
1. Abra: apps/api/app/routers/rankings_mock_config.py
2. Mude: USE_MOCK_DATA = False
   OU delete os arquivos *_mock_*.py
```

---

## 🎯 Cenários de Uso

| Cenário | USE_MOCK_DATA | Arquivos | Resultado |
|---------|---------------|----------|-----------|
| **Desenvolvimento** | `True` | ✅ Existem | 🎭 Dados mockados |
| **Staging** | `False` | ✅ Existem | 🗄️ Dados reais |
| **Produção** | N/A | ❌ Deletados | 🗄️ Dados reais |

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **`RANKINGS_MOCKS_README.md`** - Guia completo com exemplos
- **`REMOVER_MOCKS.txt`** - Passo a passo de remoção
- **`ALTERACOES.md`** - Documentação de todas as alterações

---

**Criado em:** 2025-10-03
**Autor:** Claude Code
**Versão:** 1.0
