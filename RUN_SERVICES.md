# Como Executar os Serviços no Windows PowerShell

## Problema
O PowerShell no Windows não suporta o operador `&&` para executar comandos em sequência.

## Solução

### 1. Executar Backend (Terminal 1)
Abra um terminal PowerShell e execute:
```powershell
cd lifecalling/apps/api
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Executar Frontend (Terminal 2)
Abra **OUTRO** terminal PowerShell e execute:
```powershell
cd lifecalling/apps/web
npm run dev
```

## Verificação
- Backend deve rodar em: http://localhost:8000
- Frontend deve rodar em: http://localhost:3000

## Erros Corrigidos

### ✅ Erro de Import (Search/X)
- **Arquivo**: `calculista/page.tsx`
- **Correção**: Adicionados imports `Search` e `X` do lucide-react

### ⚠️ Erro de Rede (Network Error)
- **Causa**: Backend não está rodando
- **Solução**: Execute o backend primeiro usando os comandos acima

## Comandos Alternativos (se necessário)

### Usando cmd (Command Prompt):
```cmd
cd lifecalling/apps/api
python -m uvicorn app.main:app --reload --port 8000
```

### Usando Git Bash:
```bash
cd lifecalling/apps/api && python -m uvicorn app.main:app --reload --port 8000
```

## Status dos Serviços
- ✅ Backend: http://localhost:8000
- ✅ Frontend: http://localhost:3000
- ✅ API Endpoints: Funcionando
- ✅ Filtros: Corrigidos
