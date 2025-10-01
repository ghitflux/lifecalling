# 🚨 SOLUÇÃO URGENTE - Login Não Funciona

## ⚠️ PROBLEMA IDENTIFICADO

**Causa Raiz:** Backend travado - 2 processos ocupando porta 8000 sem responder

```
PID 1860  - Processo travado na porta 8000
PID 17772 - Processo travado na porta 8000
```

---

## ✅ SOLUÇÃO (Execute AGORA)

### Passo 1: Abra o Gerenciador de Tarefas

```
Pressione: Ctrl + Shift + Esc
```

### Passo 2: Encontre e Mate os Processos Python

1. Vá na aba **Detalhes**
2. Procure por **python.exe** ou **pythonw.exe**
3. Clique com botão direito > **Finalizar tarefa**
4. Repita para TODOS os processos python

**OU use PowerShell como Admin:**

```powershell
# Abra PowerShell como Administrador
# Copie e cole:

taskkill /IM python.exe /F
taskkill /IM pythonw.exe /F
```

### Passo 3: Inicie o Backend Limpo

```bash
# Opção 1: Clique duplo no arquivo
D:\apps\trae\lifecallingv1\lifecalling\apps\api\start_backend.bat

# Opção 2: Via terminal
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Passo 4: Aguarde Ver Esta Mensagem

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Passo 5: Teste o Login

```bash
# Execute para verificar:
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python test_login_direct.py
```

**OU acesse:**
- http://localhost:3000/login
- Email: `admin@lifecalling.com`
- Senha: `admin123`

---

##  Checklist Rápido

- [ ] 1. Abrir Gerenciador de Tarefas (Ctrl+Shift+Esc)
- [ ] 2. Matar TODOS os processos python.exe
- [ ] 3. Executar `start_backend.bat`
- [ ] 4. Ver mensagem "Uvicorn running"
- [ ] 5. Testar com `python test_login_direct.py`
- [ ] 6. Fazer login no navegador

---

## 📊 O Que Esperar

### Backend Funcionando:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Login Bem-Sucedido:
```
============================================================
[LOGIN] Tentativa de login: admin@lifecalling.com
============================================================
[LOGIN] ✓ Usuario encontrado: Admin Principal (ID: 52)
[LOGIN] ✓ Senha correta
[LOGIN] ✓ Usuario ativo
[LOGIN] ✅ Login bem-sucedido!
============================================================
```

---

## 🔑 Credenciais

```
Email: admin@lifecalling.com
Senha: admin123
```

---

## 🆘 Ainda Não Funciona?

### Solução Alternativa - Usar Outra Porta

**1. Parar tudo:**
```bash
taskkill /IM python.exe /F
```

**2. Iniciar na porta 8001:**
```bash
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

**3. Atualizar next.config.ts:**
```typescript
destination: 'http://localhost:8001/:path*',  // Era 8000
```

**4. Reiniciar frontend:**
```bash
# No terminal do frontend:
# Ctrl+C para parar
# Depois:
npm run dev
```

---

## 📝 Arquivos Úteis Criados

| Arquivo | Função |
|---------|--------|
| `start_backend.bat` | Inicia backend |
| `check_backend.py` | Verifica status |
| `test_login_direct.py` | Testa login |
| `kill_backend_processes.bat` | Mata processos |

---

## 🎯 Resumão

**Problema:** Backend travado na porta 8000
**Solução:**
1. Matar processos python
2. Iniciar backend limpo
3. Testar login

**Tempo:** 2 minutos

---

**EXECUTAR AGORA!**
