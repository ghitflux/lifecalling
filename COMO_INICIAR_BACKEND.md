# 🚀 Como Iniciar o Backend - Lifecalling

## ⚡ Início Rápido

### Opção 1: Script Automático (Recomendado)

```bash
# Clique duplo no arquivo ou execute:
D:\apps\trae\lifecallingv1\lifecalling\apps\api\start_backend.bat
```

### Opção 2: Comando Manual

```bash
cd D:\apps\trae\lifecallingv1\lifecalling\apps\api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## ✅ Verificar se Está Funcionando

### 1. Verificar Backend
```bash
cd apps/api
python check_backend.py
```

### 2. Testar Login
```bash
cd apps/api
python test_login_direct.py
```

---

## 🔍 Troubleshooting

### Problema: "Port already in use" ou "Address already in use"

**Solução:**

```bash
# 1. Encontrar processo na porta 8000
netstat -ano | findstr :8000

# 2. Matar o processo (substituir <PID> pelo número encontrado)
taskkill /PID <PID> /F

# 3. Reiniciar backend
start_backend.bat
```

### Problema: "Connection refused" ou "Backend não responde"

**Solução:**

```bash
# 1. Verificar se backend está rodando
python check_backend.py

# 2. Se não estiver, iniciar
start_backend.bat

# 3. Aguardar mensagem:
#    "Uvicorn running on http://0.0.0.0:8000"
```

### Problema: "Login retorna erro 500"

**Solução:**

```bash
# 1. Verificar logs do backend no terminal
#    Procurar por erros em vermelho

# 2. Verificar usuários no banco
cd apps/api
python test_login.py

# 3. Se necessário, recriar usuários
python reset_all_users.py
python create_all_users.py

# 4. Reiniciar backend
start_backend.bat
```

---

## 📊 O Que Você Deve Ver

### Backend Iniciando Corretamente:
```
INFO:     Will watch for changes in these directories: ['D:\\apps\\trae\\lifecallingv1\\lifecalling\\apps\\api']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [67890]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Login Bem-Sucedido (nos logs):
```
============================================================
[LOGIN] Tentativa de login: admin@lifecalling.com
============================================================
[LOGIN] ✓ Usuario encontrado: Admin Principal (ID: 52)
[LOGIN]   - Email: admin@lifecalling.com
[LOGIN]   - Role: admin
[LOGIN]   - Active: True
[LOGIN] Verificando senha...
[LOGIN] ✓ Senha correta
[LOGIN] ✓ Usuario ativo
[LOGIN] Setando cookies...
[LOGIN] ✅ Login bem-sucedido!
============================================================
```

---

## 🔑 Credenciais de Teste

```
Email: admin@lifecalling.com
Senha: admin123
```

---

## 📝 Checklist de Inicialização

- [ ] 1. Abrir terminal/PowerShell
- [ ] 2. Navegar para pasta da API
- [ ] 3. Executar `start_backend.bat` ou comando manual
- [ ] 4. Aguardar mensagem "Uvicorn running on..."
- [ ] 5. Verificar com `python check_backend.py`
- [ ] 6. Testar login com `python test_login_direct.py`
- [ ] 7. Acessar http://localhost:3000/login no navegador
- [ ] 8. Fazer login com admin@lifecalling.com / admin123

---

## 🆘 Ainda Não Funciona?

### Verifique:

1. **Python instalado?**
   ```bash
   python --version
   # Deve mostrar Python 3.10 ou superior
   ```

2. **Dependências instaladas?**
   ```bash
   cd apps/api
   pip list | findstr fastapi
   pip list | findstr uvicorn
   ```

3. **PostgreSQL rodando?**
   ```bash
   # Verificar se Docker está rodando
   docker ps

   # Deve mostrar container do PostgreSQL
   ```

4. **Variáveis de ambiente corretas?**
   - Arquivo `.env` existe?
   - POSTGRES_* variáveis configuradas?

---

## 📞 Comandos Úteis

```bash
# Verificar backend
python check_backend.py

# Testar login
python test_login_direct.py

# Listar usuários
python test_login.py

# Resetar usuários
python reset_all_users.py

# Criar 15 usuários padrão
python create_all_users.py

# Iniciar backend
start_backend.bat
```

---

**Última atualização:** 2025-09-30
