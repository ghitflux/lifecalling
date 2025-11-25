# Sincronização Life Mobile ↔ Sistema Web

Guia rápido para implementar no app **life-mobile** a comunicação completa com os endpoints recém-criados no backend/web.

## 1) Endpoints do backend (API)
- **Mobile Admin** (já existentes):
  - `GET /mobile/admin/clients` → lista clientes mobile (roles `mobile_client`), inclui `cpf`, `phone`.
  - `GET /mobile/admin/simulations` → lista simulações mobile.
  - `GET /mobile/admin/simulations/{id}` → detalhe.
  - `POST /mobile/admin/simulations` → cria simulação multi-banco (admin).
  - `POST /mobile/admin/simulations/{id}/approve` / `.../reject` → aprova/reprova simulação.
  - `GET /mobile/admin/documents/{id}` → download de anexo.
- **Finance Mobile** (novos):
  - `GET /finance/mobile/queue` → fila de simulações com status “aprovada pelo cliente”.
  - `POST /finance/mobile/{simulationId}/approve` → envia para financeiro (status `financeiro_pendente`, cria receita `origin=mobile`).
  - `POST /finance/mobile/{simulationId}/cancel` → cancela na fila (`financeiro_cancelado`).
  - `POST /finance/mobile/{simulationId}/disburse` → efetiva contrato (`contrato_efetivado`, cria receita). **Usar após revisão final e repasse ao cliente.**
- **Novos campos em finanças**:
  - `finance_incomes.origin` e `finance_expenses.origin` (`web`|`mobile`) para separar contratos web vs mobile.

## 2) Fluxo de simulação no app mobile
1. **Envio pelo cliente**: upload via `POST /mobile/simulations/upload` ou criação direta; status inicial `pending` ou `simulation_requested`.
2. **Admin/Web**: simulação é criada/ajustada e aprovada → status `approved`.
3. **Aprovação do cliente (app)**: quando o cliente der ok, enviar PATCH/POST (definir rota no app) para atualizar status para `approved_by_client` (ou `aprovada_pelo_cliente`). Esse status coloca a simulação na fila `GET /finance/mobile/queue`.
4. **Financeiro**:
   - “Revisar e Enviar ao Financeiro”: `POST /finance/mobile/{id}/approve` (status `financeiro_pendente`, cria receita `origin=mobile`).
   - “Efetivar contrato”: `POST /finance/mobile/{id}/disburse` (status `contrato_efetivado`, cria receita final). Após esse passo, retornar push/flag ao app: “Simulação efetivada/contrato gerado”.
   - “Cancelar”: `POST /finance/mobile/{id}/cancel` se o financeiro rejeitar.

## 3) Mapeamento de status sugerido no app
- `pending` / `simulation_requested` → “Em análise”.
- `approved` → “Aprovada (aguardando cliente)”.
- `approved_by_client` / `aprovada_pelo_cliente` → “Aprovada pelo Cliente (fila financeira)”.
- `financeiro_pendente` → “No Financeiro”.
- `contrato_efetivado` → “Contrato Efetivado”.
- `financeiro_cancelado` / `rejected` → “Cancelada/Reprovada”.

## 4) Dados obrigatórios que o app deve enviar/exibir
- **Cliente**: `name`, `email`, `cpf`, `phone` (WhatsApp). Backend gera fallback se ausente, mas app deve enviar real.
- **Simulação**:
  - `simulation_type` (ex.: `multi_bank`).
  - `banks_json`: lista de bancos com `bank`, `product`, `parcela`, `saldoDevedor`, `valorLiberado`.
  - `prazo`, `coeficiente`, `seguro`, `percentual_consultoria`.
  - Documentos: upload para `/mobile/admin/documents/{id}` (download) e `/mobile/simulations/upload` (cliente).

## 5) Ajustes necessários no app mobile
1. **Configurar base URL**: usar `NEXT_PUBLIC_API_BASE_URL` do web (ou variável equivalente no app) para apontar para o backend.
2. **Sincronizar status**: ao aprovar no app, enviar status `approved_by_client` (ou equivalente) para que caia na fila mobile de finance.
3. **Download de anexos**: consumir `GET /mobile/admin/documents/{id}` para exibir/documentos do cliente.
4. **Novos fluxos no Finance (visão mobile)**:
   - Tela/lista de “Contratos Mobile” consumindo `GET /finance/mobile/queue`.
   - Ações: `approve` (enviar ao financeiro), `disburse` (efetivar), `cancel`.
5. **Telemetria**: registrar eventos “simulação aprovada pelo cliente”, “enviada ao financeiro”, “contrato efetivado”, para alinhamento com web.

## 6) Notificação/retorno para o app
- Após `disburse`, o backend já marca `contrato_efetivado`; o app deve consultar esse status ou receber push (implementar no mobile) para avisar o cliente.
- Planejar endpoint de callback/polling no app para checar status (`GET /mobile/admin/simulations/{id}`) ou via WebSocket/notificação push se existir infra no app.

## 7) Front (web) já adaptado
- Seção “Contratos Mobile” no Financeiro usa os endpoints acima.
- Snippets de CPF/WhatsApp padronizados no estilo atendimento.

## 8) Checklist de implementação no app mobile
- [ ] Apontar ambiente para o backend do life-system.
- [ ] Criar serviço API com rotas listadas (admin/mobile + finance/mobile).
- [ ] Atualizar model de simulação com campos: `banks_json`, `percentual_consultoria`, `seguro`, `document_*`, `status`.
- [ ] Implementar fluxo de aprovação pelo cliente → envia status `approved_by_client`.
- [ ] Tela de contratos mobile (finance) consumindo fila e ações `approve`, `disburse`, `cancel`.
- [ ] Exibir/baixar anexos do cliente.
- [ ] Sincronizar mensagens/status com web (labels sugeridas na seção 3).

## 9) Execução de migrações
- Já executado no web: `alembic upgrade head`.
- Se rodar em outro ambiente, executar as migrations incluídas:
  - `add_mobile_performance_indexes` (índices mobile)
  - `20251107_add_origin_finance` (campo origin em receitas/despesas)

## 10) Próximos passos sugeridos
- Implementar notificação push ou polling no app para avisar “contrato efetivado”.
- Se necessário, criar endpoint `PATCH /mobile/simulations/{id}` para o cliente marcar `approved_by_client` diretamente do app (ou reaproveitar upload/rotas já existentes).

## 11) Pontos de atenção (prod readiness)
- **Ambientes separados**: app mobile e web terão backends distintos. Definir base URLs em cada cliente e habilitar CORS entre domínios (incluir origens do app RN/OTA).
- **Autenticação**: alinhar estratégia (cookies HttpOnly vs. Bearer tokens). Em RN, tokens/bearer costumam ser mais simples; se usar cookies, garantir SameSite=None, Secure e HTTPS.
- **Storage de anexos**: ideal usar storage dedicado (S3/GCS) com bucket/caminho `mobile/` e URLs assinadas. Se manter local, centralizar uploads no backend web e compartilhar via CDN reversa. Padronizar tamanho/tipo de arquivo aceito.
- **Campos críticos**: sempre enviar/armazenar `cpf`, `phone` reais; backend gera fallback, mas produção deve persistir valores corretos para cruzamento financeiro.
- **Status únicos**: padronizar strings entre app/web/backend (`approved_by_client`, `financeiro_pendente`, `contrato_efetivado`, `financeiro_cancelado`) para evitar filas vazias.
- **Origin em finanças**: garantir gravação de `origin="mobile"` em receitas/despesas/contratos mobile; filtros/tabs dependem disso.
- **Sincronismo bidirecional**: endpoints de leitura (fila, detalhe, anexos) precisam estar expostos para ambos; validar CORS + autenticação para que o app consiga consultar o backend web quando necessário.
- **Publicação RN (Android/iOS)**: configurar `.env` no app para `API_URL_WEB` (backend web) e `API_URL_MOBILE` (backend mobile) caso mantenha dois serviços; documentar toggles de ambiente (prod/homolog).
- **Logs/observabilidade**: adicionar correlação (request-id) e logs para uploads/aprovações/disburses; útil para conciliação financeira.
- **Push/retorno ao app**: após `disburse`, app deve ser notificado (push ou polling) para exibir “Contrato efetivado”.
