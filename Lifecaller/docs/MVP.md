# MVP — Fluxo e Perfis

Fluxo: Global → Atendente → Calculista → Atendente Pós-Sim → Gerente Fechamento → Atendente Docs → Financeiro → Contratos/Supervisão.

- **Atendente**: pega item (claim), anota tratativas, envia ao Calculista; pós-sim registra **approved true/false**; após gerente, solicita docs/boletos; envia ao Financeiro. **Faz tudo em /detalhes/:id**.
- **Calculista**: simula e devolve para **Pós-Sim** (atendente decide).
- **Gerente**: formaliza contrato (`contrato_formalizado=true`) e envia para Docs.
- **Financeiro**: confere pagamentos (fora do sistema), anexa comprovantes, finaliza → Supervisão.
- **Supervisão**: vê contratos por status. Admin vê tudo.

**Import**: iNETConsig (TXT) ou CSV. Se **mesmo CPF+Matrícula** aparecer com **outra competência ou banco**, cria **novo lançamento** vinculado ao mesmo atendimento (ramificação), preservando histórico.

**Regra do Front**: botões só visíveis se `available_actions` permitir.
