# 🔐 Credenciais de Usuários - Lifecalling

## 👥 Usuários Disponíveis (15 total - 3 por role)

### 🔴 Administradores (3)
| Nome | Email | Senha |
|------|-------|-------|
| Admin Principal | admin@lifecalling.com | admin123 |
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

## 🚀 Para Testar Login

1. **Reinicie o backend** (importante!)
   ```bash
   cd apps/api
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Acesse a página de login**
   - http://localhost:3000/login

3. **Clique em "Ver Credenciais Demo"**
   - Modal mostrará todos os usuários disponíveis
   - Clique em qualquer usuário para login automático

4. **Ou digite manualmente:**
   - Email: admin@lifecalling.com
   - Senha: admin123

---

## ✅ Correções Aplicadas

- ✅ Removidos usuários antigos mockados
- ✅ Criados 15 usuários reais no banco (3 de cada role)
- ✅ Todos usuários estão ativos
- ✅ Senhas corretas configuradas
- ✅ Nomes padronizados
- ✅ Login verificando campo `active`
- ✅ Router de users registrado no backend
- ✅ Página de login atualizada

---

## 🔧 Scripts Disponíveis

- `ensure_users.py` - Garante que existam 3 usuários de cada role
- `test_login.py` - Testa login e lista usuários
- `cleanup_old_users.py` - Remove usuários antigos
- `fix_user_names.py` - Corrige nomes dos usuários

---

**Data:** 2025-09-30
