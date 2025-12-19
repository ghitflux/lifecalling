# Limpeza de Mensalidades - Sistema Life

## Resumo das Alterações

O sistema foi ajustado para manter **apenas a mensalidade mais recente** de cada contrato do cliente, ao invés de manter as duas mensalidades mais recentes.

## Arquivos Modificados

### 1. [cleanup_payroll_references.py](cleanup_payroll_references.py)
**Alteração:** Mudança de `rn > 2` para `rn > 1`

Script standalone que pode ser executado manualmente para limpar referências antigas de mensalidades.

**Uso:**
```bash
# Simular (ver o que seria deletado)
python cleanup_payroll_references.py --dry-run

# Executar limpeza real
python cleanup_payroll_references.py
```

### 2. [app/routers/imports.py](app/routers/imports.py)
**Alteração:** Mudança de `rn > 2` para `rn > 1` na função `cleanup_old_references()`

Esta função é executada **automaticamente** após cada importação de arquivo de folha de pagamento, garantindo que apenas a mensalidade mais recente seja mantida.

**Linhas modificadas:**
- Linha 206-237: Função `cleanup_old_references()`
- Linha 659-664: Chamada da função após importação

### 3. [cleanup_old_payroll_data.py](cleanup_old_payroll_data.py) ⭐ **NOVO**
Script de limpeza única para remover todas as mensalidades antigas do banco de dados.

**Características:**
- Mostra estatísticas detalhadas antes e depois
- Requer confirmação antes de executar (tipo "CONFIRMO")
- Suporta modo `--dry-run` para simulação
- Calcula tempo de execução
- Mostra exemplos de dados que serão deletados

## Como Executar a Limpeza Inicial

### Passo 1: Simulação (Recomendado)
Execute primeiro em modo simulação para ver o que será deletado:

```bash
cd d:\apps\lifeservicos\life-system\apps\api
python cleanup_old_payroll_data.py --dry-run
```

**Exemplo de saída:**
```
================================================================================
ESTATÍSTICAS ANTES DA LIMPEZA
================================================================================
Total de linhas no banco: 15,234
Total de contratos únicos: 3,456
Linhas a deletar (antigas): 11,778
Linhas a manter (mês mais recente): 3,456

Distribuição por mês/ano:
  11/2024: 3,456 linhas
  10/2024: 3,422 linhas
  09/2024: 3,398 linhas
  08/2024: 2,958 linhas
================================================================================
```

### Passo 2: Execução Real
Após verificar os dados, execute a limpeza real:

```bash
python cleanup_old_payroll_data.py
```

O script pedirá confirmação:
```
⚠️  ATENÇÃO: Você está prestes a executar uma limpeza REAL!
⚠️  Esta operação é IRREVERSÍVEL!
⚠️  Recomenda-se executar primeiro com --dry-run para verificar o que será deletado.

Digite 'CONFIRMO' para continuar:
```

Digite `CONFIRMO` e pressione Enter para executar.

## Lógica de Limpeza

A limpeza mantém apenas o **mês de referência mais recente** para cada combinação única de:
- CPF
- Matrícula
- Código do Financiamento (FIN)

**Exemplo:**

**ANTES da limpeza:**
| CPF | Matrícula | FIN | Ref Mês | Valor |
|-----|-----------|-----|---------|-------|
| 123.456.789-00 | 123456 | 6490 | 11/2024 | 458.04 |
| 123.456.789-00 | 123456 | 6490 | 10/2024 | 458.04 |
| 123.456.789-00 | 123456 | 6490 | 09/2024 | 458.04 |

**DEPOIS da limpeza:**
| CPF | Matrícula | FIN | Ref Mês | Valor |
|-----|-----------|-----|---------|-------|
| 123.456.789-00 | 123456 | 6490 | 11/2024 | 458.04 |

## Automação

Após a execução inicial do script `cleanup_old_payroll_data.py`, o sistema manterá automaticamente apenas a mensalidade mais recente através da função `cleanup_old_references()` que é executada após cada importação de arquivo de folha de pagamento.

**Não é necessário executar o script novamente**, pois a limpeza será automática a cada nova importação.

## Backup

⚠️ **IMPORTANTE:** Antes de executar a limpeza real, recomenda-se fazer um backup do banco de dados:

```bash
# Exemplo de backup PostgreSQL
pg_dump -h localhost -U lifecalling -d lifecalling > backup_antes_limpeza_$(date +%Y%m%d).sql
```

## Reversão

Se precisar reverter as alterações, você pode:

1. Restaurar o backup do banco de dados
2. Reverter as alterações nos arquivos de código usando git:

```bash
cd d:\apps\lifeservicos\life-system
git checkout HEAD -- apps/api/cleanup_payroll_references.py
git checkout HEAD -- apps/api/app/routers/imports.py
git rm apps/api/cleanup_old_payroll_data.py
git rm apps/api/README-LIMPEZA-MENSALIDADES.md
```

## Monitoramento

Para verificar o estado atual do banco após a limpeza:

```sql
-- Total de linhas
SELECT COUNT(*) FROM payroll_lines;

-- Distribuição por mês/ano
SELECT
    ref_year,
    ref_month,
    COUNT(*) as count
FROM payroll_lines
GROUP BY ref_year, ref_month
ORDER BY ref_year DESC, ref_month DESC;

-- Verificar se há contratos com mais de 1 referência
SELECT
    cpf,
    matricula,
    financiamento_code,
    COUNT(*) as refs
FROM payroll_lines
GROUP BY cpf, matricula, financiamento_code
HAVING COUNT(*) > 1;
```

A última query deve retornar **0 resultados** se a limpeza foi bem-sucedida.

## Contato

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.

---
**Data de criação:** 03/12/2025
**Última atualização:** 03/12/2025
