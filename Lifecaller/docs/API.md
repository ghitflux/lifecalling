# Lifecaller API (MVP)

Base: `/api/`

## Autenticação
- `POST /api/auth/token/` → `{ access, refresh }`
- `POST /api/auth/refresh/`
- `GET /api/v1/me/` → `{ id, username, email, groups[] }`

## Atendimentos
- `GET /api/atendimentos/` (lista/paginação, filtros: `stage, simulacao_status, banco, cpf, matricula`)
- `GET /api/atendimentos/{id}/`
- `POST /api/atendimentos/{id}/claim`
- `POST /api/atendimentos/{id}/release`
- `POST /api/atendimentos/{id}/forward`
  - `atendente` → `calculista`
  - `calculista` → `atendente_pos_sim`
  - `atendente_pos_sim` requer `{"approved": true|false}`
  - `gerente_fechamento` aceita `{"contrato_formalizado": true}`
- `GET /api/atendimentos/{id}/actions`
- `GET /api/atendimentos/queue/{global|atendente|calculista|pos-sim|gerente|docs|financeiro|supervisao}`
- `POST /api/atendimentos/import_csv`
  - **Permissão**: grupos `calculista`, `supervisor`, `gerente`, `admin` ou `superuser`.
  - **Entrada**:
    - multipart `file` **.csv** (cabeçalho `cpf,matricula` + opcional `banco,competencia`)
    - **ou** multipart `file` **.txt** iNETConsig (auto-detectado)
  - **Saída**: `{ created, updated, format: "csv"|"inetconsig" }`
- `POST /api/atendimentos/{id}/note` → registra tratativa textual
- `GET /api/atendimentos/{id}/events` → histórico de ações/notas
- `POST /api/atendimentos/{id}/simulate` → simulador (body: `{ parcela, coeficiente, saldo_devedor, seguro_banco, percentual_co, prazo_meses }`)

### Ramificações (banco+competência)
- Importações iNETConsig/CSV criam `lancamentos` para o atendimento (mesmo CPF+Matrícula).
- Cada lançamento guarda `banco`, `competencia (MM/AAAA)`, `imported_at`.

## Attachments
- `GET /api/attachments/?atendimento={id}`
- `POST /api/attachments/` (multipart: `file`, `atendimento`)
