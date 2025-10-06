# 🔐 Credenciais de Acesso - Lifecalling

## Acesso ao Sistema
**URL:** http://localhost:3000/login

---

## 👥 Usuários do Sistema

### ADMINISTRADORES (2)
| Nome | Email | Senha |
|------|-------|-------|
| Carlos Admin | admin1@lifecalling.com.br | Admin@123 |
| Maria Admin | admin2@lifecalling.com.br | Admin@123 |

**Permissões:** Acesso total ao sistema

---

### SUPERVISOR (1)
| Nome | Email | Senha |
|------|-------|-------|
| João Supervisor | supervisor@lifecalling.com.br | Super@123 |

**Permissões:** Gerenciamento de equipes, visualização de dashboards, acesso a módulos principais

---

### FINANCEIRO (1)
| Nome | Email | Senha |
|------|-------|-------|
| Ana Financeira | financeiro@lifecalling.com.br | Fin@123 |

**Permissões:** Gestão financeira, contratos, receitas e despesas

---

### GERENTE DE FECHAMENTO (1)
| Nome | Email | Senha |
|------|-------|-------|
| Pedro Fechamento | fechamento@lifecalling.com.br | Fech@123 |

**Permissões:** Aprovação de fechamentos, revisão de contratos

---

### CALCULISTA (1)
| Nome | Email | Senha |
|------|-------|-------|
| Julia Calculista | calculista@lifecalling.com.br | Calc@123 |

**Permissões:** Cálculos e simulações de contratos

---

### ATENDENTES (7)
| Nome | Email | Senha |
|------|-------|-------|
| Lucas Atendente | atendente1@lifecalling.com.br | Atend@123 |
| Mariana Atendente | atendente2@lifecalling.com.br | Atend@123 |
| Felipe Atendente | atendente3@lifecalling.com.br | Atend@123 |
| Camila Atendente | atendente4@lifecalling.com.br | Atend@123 |
| Rafael Atendente | atendente5@lifecalling.com.br | Atend@123 |
| Beatriz Atendente | atendente6@lifecalling.com.br | Atend@123 |
| Thiago Atendente | atendente7@lifecalling.com.br | Atend@123 |

**Permissões:** Atendimento de clientes, esteira de atendimentos

---

## 📊 Resumo

- **Total de Usuários:** 14
- **Administradores:** 2
- **Supervisor:** 1
- **Financeiro:** 1
- **Gerente de Fechamento:** 1
- **Calculista:** 1
- **Atendentes:** 7

---

## 🔄 Redefinir Banco de Dados

Para limpar o banco e recriar apenas estes usuários:

```bash
cd lifecalling/apps/api
python app/clean_and_seed.py
```

---

## ⚠️ Notas Importantes

1. **Senhas padrão:** Todas as senhas seguem o padrão `[Role]@123`
2. **Segurança:** Altere as senhas em produção
3. **Emails:** Domínio `@lifecalling.com.br` é padrão
4. **Banco limpo:** Não há dados de teste (clientes, casos, contratos)

---

**Última atualização:** Janeiro 2025

