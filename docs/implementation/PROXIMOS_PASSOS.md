# Próximos Passos de Desenvolvimento - LifeCalling

## Status Atual
✅ **Concluído**: Correção da fórmula "Valor Liberado" e validações para banco Margem*
- Fórmula corrigida: `(parcela / coeficiente) - saldoDevedor`
- Validações ajustadas para permitir valores negativos apenas para banco Margem*
- Todos os testes passando (11/11)
- Commit realizado: `41b3744`

## Próximos Passos Prioritários

### 1. Ajustar Regras e Estado de Transições de Status na Esteira de Atendimento
**Prioridade**: Alta
**Descrição**: Implementar e ajustar as regras de transição de status dos casos na esteira de atendimento
**Tarefas**:
- [ ] Mapear estados atuais e transições permitidas
- [ ] Definir regras de negócio para cada transição
- [ ] Implementar validações de transição no backend
- [ ] Atualizar interface para refletir estados corretos
- [ ] Criar testes para validar transições

### 2. Regras de Movimentação de Caso Após Fechamento
**Prioridade**: Alta
**Descrição**: Definir e implementar o que acontece com casos após o fechamento
**Tarefas**:
- [ ] Definir estados pós-fechamento
- [ ] Implementar regras de reabertura (se aplicável)
- [ ] Configurar notificações automáticas
- [ ] Definir permissões de acesso a casos fechados
- [ ] Implementar auditoria de movimentações

### 3. Regras e Layout Financeiro
**Prioridade**: Média
**Descrição**: Ajustar regras financeiras e melhorar layout das informações financeiras
**Tarefas**:
- [ ] Revisar cálculos financeiros existentes
- [ ] Melhorar apresentação visual dos dados financeiros
- [ ] Implementar validações financeiras adicionais
- [ ] Criar relatórios financeiros
- [ ] Otimizar performance dos cálculos

### 4. Ajuste na Lógica da Importação
**Prioridade**: Média
**Descrição**: Melhorar e corrigir a lógica de importação de dados
**Tarefas**:
- [ ] Revisar parser de arquivos TXT
- [ ] Melhorar tratamento de erros na importação
- [ ] Implementar validações mais robustas
- [ ] Otimizar performance da importação
- [ ] Criar logs detalhados de importação
- [ ] Implementar rollback em caso de erro

## Observações Técnicas

### Arquivos Principais Modificados Recentemente
- `apps/web/src/components/calculista/SimulationFormMultiBank.tsx`
- `apps/web/src/lib/utils/simulation-calculations.ts`
- `apps/api/app/services/simulation_service.py`

### Testes
- Todos os testes automatizados estão passando
- Localização: `apps/web/src/lib/utils/__tests__/simulation-calculations.test.ts`

### Ambiente de Desenvolvimento
- Frontend: Next.js rodando em `http://localhost:3001`
- Backend: Python/FastAPI
- Testes: Vitest

## Contatos e Responsabilidades
- **Desenvolvimento**: Equipe de desenvolvimento
- **Testes**: QA Team
- **Deploy**: DevOps Team

---
*Documento atualizado em: ${new Date().toLocaleDateString('pt-BR')}*
*Última modificação: Correção banco Margem* - Commit 41b3744*