# ✅ LOGIN CORRIGIDO - Lifecalling

## 🎉 Status: PRONTO PARA USO

Todos os usuários foram **resetados e recriados** com senhas corretas.

---

## 👥 Usuários Disponíveis (15 total - 3 por role)

### 🔴 Administradores (3)
| Nome | Email | Senha |
|------|-------|-------|
| Admin Principal | **admin@lifecalling.com** | **admin123** |
| Admin Secundário | admin2@lifecalling.com | admin123 |
| Admin Backup | admin3@lifecalling.com | admin123 |

### 🔵 Supervisores (3)
| Nome | Email | Senha |
|------|-------|-------|
| Supervisor João | supervisor@lifecalling.com | super123 |
| Supervisor Maria | supervisor2@lifecalling.com | super123 |
| Supervisor Pedro | supervisor3@lifecalling.com | super123 |

### 💰 Financeiro (3)
| Nome | Email | Senha |
|------|-------|-------|
| Financeiro Carlos | financeiro@lifecalling.com | fin123 |
| Financeiro Ana | financeiro2@lifecalling.com | fin123 |
| Financeiro Rita | financeiro3@lifecalling.com | fin123 |

### 🧮 Calculistas (3)
| Nome | Email | Senha |
|------|-------|-------|
| Calculista Lucas | calculista@lifecalling.com | calc123 |
| Calculista Julia | calculista2@lifecalling.com | calc123 |
| Calculista Bruno | calculista3@lifecalling.com | calc123 |

### 👤 Atendentes (3)
| Nome | Email | Senha |
|------|-------|-------|
| Atendente Paula | atendente@lifecalling.com | atend123 |
| Atendente Marcos | atendente2@lifecalling.com | atend123 |
| Atendente Sandra | atendente3@lifecalling.com | atend123 |

---

## 🚀 **IMPORTANTE: REINICIE O BACKEND**

```bash
# Pare o backend atual (Ctrl+C)

# Reinicie com:
cd apps/api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 Testando o Login

### 1️⃣ Teste via Browser

1. Abra: http://localhost:3000/login
2. Digite:
   - Email: `admin@lifecalling.com`
   - Senha: `admin123`
3. Clique em **Entrar**

### 2️⃣ Teste via Modal de Credenciais

1. Na página de login, clique em **"Ver Credenciais Demo"**
2. Clique em qualquer usuário para login automático

### 3️⃣ Teste via curl (Backend direto)

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifecalling.com","password":"admin123"}' \
  -v
```

---

## 🔧 O Que Foi Corrigido

### ✅ Backend
1. **Limpeza completa de usuários**
   - Removidas todas as referências em outras tabelas
   - Deletados todos os usuários antigos

2. **Criação de usuários novos**
   - 15 usuários criados (3 de cada role)
   - Senhas consistentes e testadas
   - Todos usuários ativos

3. **Debug logging adicionado**
   - Endpoint `/auth/login` agora mostra logs detalhados
   - Facilita identificação de problemas

4. **Router de users registrado**
   - Endpoint `/users` funcionando
   - Possível criar/editar usuários pela interface

### ✅ Frontend
1. **Página de login atualizada**
   - Credenciais corretas no modal
   - Campos vazios por padrão

2. **API configurada corretamente**
   - Proxy para backend via Next.js rewrites
   - Cookies HttpOnly funcionando

---

## 📝 Scripts Disponíveis

| Script | Função |
|--------|--------|
| `reset_all_users.py` | Limpa TUDO e cria admin único |
| `create_all_users.py` | Cria os 15 usuários padrão |
| `test_login.py` | Testa login e lista usuários |
| `ensure_users.py` | Garante 3 usuários de cada role |

---

## 🎯 Resumo Rápido

```bash
# 1. Reinicie o backend
cd apps/api
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Acesse http://localhost:3000/login

# 3. Login:
#    Email: admin@lifecalling.com
#    Senha: admin123
```

---

## 📊 Verificação de Usuários

Para verificar se os usuários estão corretos:

```bash
cd apps/api
python test_login.py
```

Isso listará todos os usuários e testará o login do admin.

---

**Data de Correção:** 2025-09-30
**Status:** ✅ Funcionando
**Usuários:** 15 (3 de cada role)
**Senhas:** Simples e consistentes
