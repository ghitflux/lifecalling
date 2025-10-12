# Guia de Formatação Python - Padrões para Evitar Erros de Linter

## 1. Comprimento de Linha (Máximo 79 caracteres)

### Quebrar linhas longas usando parênteses:
```python
# ❌ Ruim - linha muito longa
long_function_name(param1, param2, param3, param4, param5)

# ✅ Bom - quebrado adequadamente
long_function_name(
    param1, param2, param3, param4, param5
)
```

### Quebrar expressões condicionais:
```python
# ❌ Ruim
value = some_long_expression if condition else other_long_expression

# ✅ Bom
value = (
    some_long_expression
    if condition
    else other_long_expression
)
```

## 2. Espaçamento em Parâmetros de Função

### Sempre adicionar espaços após vírgulas:
```python
# ❌ Ruim
require_roles("admin","supervisor","financeiro")

# ✅ Bom
require_roles("admin", "supervisor", "financeiro")
```

## 3. Linhas em Branco Entre Funções

### Sempre usar 2 linhas em branco:
```python
def function_one():
    pass


def function_two():  # 2 linhas em branco antes
    pass
```

### 1 linha em branco entre métodos dentro de uma classe:
```python
class MyClass:
    def method_one(self):
        pass

    def method_two(self):  # 1 linha em branco antes
        pass
```

## 4. Indentação de Continuação

### Alinhar com abertura de parênteses/chaves:
```python
# ❌ Ruim - indentação incorreta
"key": (
    value if condition else other
)

# ✅ Bom - indentação correta
"key": (
    value if condition else other
)
```

## 5. Campos de Modelo Inexistentes

### Sempre verificar se campos existem no modelo:
```python
# ❌ Ruim - campo inexistente
inc.description  # campo não existe no modelo

# ✅ Bom - usar campo correto
inc.income_name  # campo correto do modelo
```

## 6. Espaçamento em Dicionários

### Adicionar espaços após dois pontos:
```python
# ❌ Ruim
{"status":"ativo", "type":"finance"}

# ✅ Bom
{"status": "ativo", "type": "finance"}
```

## 7. Quebra de Linhas Longas

### Usar parênteses para quebras naturais:
```python
# ❌ Ruim
total_amount = float(contract.total_amount) if contract.total_amount else 0

# ✅ Bom
total_amount = (
    float(contract.total_amount)
    if contract.total_amount
    else 0
)
```

## 8. Problemas Comuns Encontrados

### Campos de data com isoformat:
```python
# ❌ Ruim
"created_at": obj.created_at.isoformat() if obj.created_at else None

# ✅ Bom
"created_at": (
    obj.created_at.isoformat()
    if obj.created_at
    else None
)
```

### Strings longas em f-strings:
```python
# ❌ Ruim
print(f"Erro: {error_message} com parâmetros: {param1}, {param2}, {param3}")

# ✅ Bom
print(
    f"Erro: {error_message} com parâmetros: "
    f"{param1}, {param2}, {param3}"
)
```

## 9. Comandos Úteis para Verificação

### Verificar erros de linter:
```bash
# Verificar arquivo específico
python -m flake8 path/to/file.py

# Verificar com configuração específica
python -m flake8 --max-line-length=79 path/to/file.py
```

### Auto-formatação com black:
```bash
# Formatar arquivo
black path/to/file.py

# Verificar sem modificar
black --check path/to/file.py
```

## 10. Resumo dos Padrões Críticos

1. **Máximo 79 caracteres por linha**
2. **2 linhas em branco entre funções**
3. **Espaços após vírgulas em parâmetros**
4. **Verificar campos de modelo antes de usar**
5. **Indentação consistente em continuações**
6. **Espaços após dois pontos em dicionários**
7. **Quebrar linhas longas com parênteses**
