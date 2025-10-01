# 🔧 Guia de Troubleshooting - Importação de Arquivos

## ✅ **SISTEMA FUNCIONANDO CORRETAMENTE**

Os testes confirmaram que o sistema de importação está **funcionando perfeitamente** e gerando atendimentos automaticamente. Se você não está vendo atendimentos após a importação, siga este guia para identificar o problema.

## 🔍 **Verificações Essenciais**

### **1. Formato do Arquivo**
Certifique-se de que seu arquivo `.txt` está no formato **iNETConsig** correto:

```
Entidade: 12345-BANCO SANTANDER S.A. Referência: 01/2025 Data da Geração: 29/01/2025

  1    000550-9  JOANA SILVA DOS SANTOS        458,04    001    47082976372
  2    001234-5  CARLOS EDUARDO LIMA           1200,50    001    12345678901
```

**Requisitos obrigatórios:**
- ✅ Header com "Entidade:", "Referência:" e "Data da Geração:"
- ✅ Linhas de dados com matrícula, nome e CPF (11 dígitos)
- ✅ Codificação do arquivo: **latin-1** ou **utf-8**

### **2. Rota de Importação**
Use a rota correta conforme o tipo do arquivo:

- **Arquivo Santander/iNETConsig**: `POST /imports`
- **Arquivo Folha de Pagamento**: `POST /imports/payroll-txt`

### **3. Autenticação**
Certifique-se de estar logado com um usuário que tenha permissões:
- ✅ Roles aceitos: `admin`, `supervisor`, `financeiro`, `calculista`

### **4. Verificar se Atendimentos Foram Criados**

#### **Via Interface:**
1. Acesse a página **"Esteira de Atendimentos"**
2. Verifique a aba **"Global"** para ver atendimentos disponíveis
3. Se não aparecer, atualize a página (F5)

#### **Via Banco de Dados:**
```sql
-- Verificar cases criados
SELECT id, status, entidade, referencia_competencia, created_at
FROM cases
ORDER BY id DESC
LIMIT 10;

-- Verificar clientes criados
SELECT id, name, cpf, matricula
FROM clients
ORDER BY id DESC
LIMIT 10;
```

## 🚨 **Problemas Comuns e Soluções**

### **Problema 1: "Arquivo importado mas não vejo atendimentos"**

**Possíveis causas:**
- Casos já existem para esses clientes
- Arquivo não está no formato correto
- Dados duplicados

**Solução:**
```bash
# Execute este comando para verificar:
cd /caminho/para/api
python test_api_import.py
```

### **Problema 2: "Erro de validação do arquivo"**

**Possíveis causas:**
- Header ausente ou incorreto
- CPFs inválidos (não têm 11 dígitos)
- Campos obrigatórios vazios

**Solução:**
- Verifique se o header está exatamente no formato: `Entidade: X Referência: MM/AAAA Data da Geração: DD/MM/AAAA`
- Confirme que todos os CPFs têm exatamente 11 dígitos
- Certifique-se de que matrícula e nome não estão vazios

### **Problema 3: "Importação falha completamente"**

**Possíveis causas:**
- Problemas de autenticação
- Arquivo corrompido
- Servidor não está rodando

**Solução:**
1. Verifique se você está logado
2. Tente fazer logout/login
3. Verifique se o servidor está rodando (`docker-compose up`)

## 🧪 **Ferramentas de Diagnóstico**

### **Script de Teste Completo:**
```bash
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python test_api_import.py
```

Este script irá:
- ✅ Criar um arquivo de teste válido
- ✅ Executar a importação completa
- ✅ Verificar se atendimentos foram criados
- ✅ Mostrar logs detalhados

### **Verificação Manual do Banco:**
```bash
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python -c "
from app.db import SessionLocal
from app.models import Case, Client
with SessionLocal() as db:
    cases = db.query(Case).all()
    clients = db.query(Client).all()
    print(f'Cases: {len(cases)}')
    print(f'Clients: {len(clients)}')
    for case in cases[-5:]:
        print(f'Case {case.id}: {case.status} - {case.client.name if case.client else \"N/A\"}')
"
```

### **Limpeza do Banco (se necessário):**
```bash
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python cleanup_seeds.py
```

## 📊 **Exemplo de Importação Bem-Sucedida**

Quando a importação funciona corretamente, você deve ver:

```
✅ Importação executada sem erros!
📊 Resultado da importação: {
  'batch_id': 1,
  'counters': {'created': 8, 'updated': 0, 'errors': 0, 'skipped': 0},
  'validation': {'is_valid': True, 'cases_created': 4}
}

📈 Itens criados:
  Cases: 4
  Clients: 4
  ImportBatches: 1
```

## 🎯 **Próximos Passos**

1. **Execute o script de teste** para confirmar que o sistema está funcionando
2. **Verifique seu arquivo** usando os critérios acima
3. **Confirme a rota** que está usando para importação
4. **Verifique na esteira** se os atendimentos aparecem na aba "Global"

## 📞 **Se o Problema Persistir**

Se seguiu todos os passos e ainda não funciona:

1. **Execute os scripts de diagnóstico** e compartilhe os logs
2. **Verifique os logs do servidor** para erros específicos
3. **Confirme a versão** do sistema está atualizada
4. **Teste com arquivo de exemplo** fornecido nos scripts

---

**Status do Sistema**: ✅ **FUNCIONANDO CORRETAMENTE**
**Última Verificação**: 29/09/2025
**Atendimentos Gerados nos Testes**: ✅ SIM