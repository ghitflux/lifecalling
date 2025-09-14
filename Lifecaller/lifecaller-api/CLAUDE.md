# CLAUDE.md - Lifecaller API Documentation

## 📋 Índice
- [1. Estrutura do Projeto](#estrutura-do-projeto)
- [2. API Versioning](#api-versioning)
- [3. Configurações](#configurações)
- [4. Comandos Úteis](#comandos-úteis)
- [5. Boas Práticas](#boas-práticas)
- [6. Design System & UI](#design-system--ui)
- [7. Troubleshooting](#troubleshooting)

---

## 1. Estrutura do Projeto

### Apps Django
```
lifecaller-api/
├── lifecaller_api/          # Configurações principais
│   ├── settings/
│   │   ├── base.py         # Configurações base
│   │   ├── dev.py          # Desenvolvimento
│   │   └── prod.py         # Produção
│   ├── urls.py             # URLs principais (API versioning)
│   └── wsgi.py/asgi.py     # Deploy configs
├── accounts/               # Autenticação e usuários
├── core/                   # Utilitários e helpers
├── crm/                    # Customer Relationship Management
├── ops/                    # Operações e processos
├── api_routes.py           # ⚠️ TEMPORÁRIO - Rotas placeholder
└── requirements.txt        # Dependências
```

### Tecnologias Utilizadas
- **Backend**: Django 5.x + Django REST Framework
- **Auth**: SimpleJWT (JWT tokens)
- **Database**: PostgreSQL (SQLite para dev)
- **Cache/Queue**: Redis + Celery
- **Documentation**: drf-spectacular (OpenAPI/Swagger)
- **CORS**: django-cors-headers
- **Extensions**: django-extensions (show_urls)

---

## 2. API Versioning

### Implementação Concluída ✅

#### Rotas API v1 (Recomendadas)
```
/api/v1/ping/                 # Health check
/api/v1/docs/                 # Swagger UI
/api/v1/redoc/                # ReDoc
/api/v1/schema/               # OpenAPI Schema
/api/v1/auth/token/           # JWT Login
/api/v1/auth/token/refresh/   # JWT Refresh
/api/v1/simulations/          # Simulações
/api/v1/coefficients/         # Coeficientes
/api/v1/contratos-finais/     # Contratos Finais
```

#### Rotas de Compatibilidade (Legado)
```
/api/ping/                    # Health check
/api/docs/                    # Swagger UI
/api/redoc/                   # ReDoc
/api/schema/                  # OpenAPI Schema
/api/auth/token/              # JWT Login
/api/auth/token/refresh/      # JWT Refresh
/api/simulations/             # Simulações
/api/coefficients/            # Coeficientes
/api/contratos-finais/        # Contratos Finais
```

### Como Foi Implementado

1. **URLs Principal** (`lifecaller_api/urls.py`):
   - Duplicação de rotas com prefixos `/api/` e `/api/v1/`
   - Função `ping()` para health checks
   - Configuração do drf-spectacular
   - Inclusão do `api_routes.py` temporário

2. **Arquivo Temporário** (`api_routes.py`):
   - Views placeholder para simulações, coeficientes e contratos
   - ⚠️ **DEVE SER SUBSTITUÍDO** por ViewSets reais

---

## 3. Configurações

### Variáveis de Ambiente (.env)
```bash
SECRET_KEY=django-insecure-change-me-in-production
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_ACCESS_MIN=60
REDIS_URL=redis://localhost:6379/0
```

### DRF Spectacular Settings (base.py)
```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'Lifecaller API',
    'DESCRIPTION': 'API for Lifecaller application',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'SWAGGER_UI_DIST': 'SIDECAR',
    'SWAGGER_UI_FAVICON_HREF': 'SIDECAR',
    'REDOC_DIST': 'SIDECAR',
}
```

### REST Framework Settings
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

---

## 4. Comandos Úteis

### Desenvolvimento
```bash
# Ativar ambiente virtual
.venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Migrações
python manage.py makemigrations
python manage.py migrate

# Executar servidor
python manage.py runserver 0.0.0.0:8000

# Listar todas as URLs
python manage.py show_urls

# Shell Django
python manage.py shell
```

### Testing & Validation
```bash
# Health check
curl http://localhost:8000/api/ping/
curl http://localhost:8000/api/v1/ping/

# Swagger docs
open http://localhost:8000/api/v1/docs/

# Schema validation
curl http://localhost:8000/api/v1/schema/
```

### CORS Testing
```bash
# PowerShell
$BASE="http://localhost:8000/api/v1"
curl -i -X OPTIONS "$BASE/ping/" `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: GET"
```

### Comandos de CI/CD (A definir)
```bash
# Lint (definir quando implementar)
# npm run lint  # ou flake8, black, isort

# Type checking (definir quando implementar)
# npm run typecheck  # ou mypy

# Tests
python manage.py test
```

---

## 5. Boas Práticas

### Estrutura de Apps
1. **Separação por Domínio**: accounts, core, crm, ops
2. **URLs Organizadas**: Cada app tem seu próprio urls.py
3. **Settings Segmentados**: base.py, dev.py, prod.py

### API Design
1. **Versionamento**: Sempre usar `/api/v1/` para novas funcionalidades
2. **Compatibilidade**: Manter `/api/` durante transição
3. **Documentação**: OpenAPI/Swagger sempre atualizada
4. **Health Checks**: Endpoint `/ping/` para monitoramento

### Segurança
1. **JWT Authentication**: Tokens com tempo de vida configurável
2. **CORS**: Origins específicos configurados
3. **Environment Variables**: Nunca commitar .env
4. **DEBUG**: Sempre False em produção

### Dados e Performance
1. **Pagination**: PageNumberPagination configurada (20 items)
2. **Filtering**: DjangoFilterBackend habilitado
3. **Database**: PostgreSQL para produção
4. **Cache**: Redis configurado para Celery

---

## 6. Design System & UI

### Orientações Gerais

#### Para Implementação de UI Components
1. **Consistência Visual**
   - Definir uma paleta de cores padrão
   - Estabelecer tipografia consistente
   - Padronizar espaçamentos e layouts

2. **Responsividade**
   - Mobile-first approach
   - Breakpoints consistentes
   - Touch-friendly interfaces

3. **Acessibilidade**
   - WCAG 2.1 AA compliance
   - Contraste adequado
   - Navegação por teclado
   - ARIA labels

#### Estrutura de Design System
```
design-system/
├── tokens/
│   ├── colors.json
│   ├── typography.json
│   └── spacing.json
├── components/
│   ├── buttons/
│   ├── forms/
│   ├── cards/
│   └── navigation/
└── documentation/
    ├── guidelines.md
    └── examples/
```

#### Integração com Backend
1. **API Response Formatting**
   - Sempre retornar status codes apropriados
   - Mensagens de erro padronizadas
   - Metadata para paginação e filtros

2. **Validation Messages**
   - Mensagens em português brasileiro
   - Contexto específico para cada campo
   - Códigos de erro consistentes

### Atualização de Design System

#### Quando Atualizar
1. **Nova funcionalidade** que requer novos componentes
2. **Feedback de UX** identificando inconsistências
3. **Mudanças de marca** ou identidade visual
4. **Atualizações de acessibilidade**

#### Processo de Atualização
1. **Auditoria**: Identificar componentes obsoletos/inconsistentes
2. **Design**: Criar novos padrões no Figma/Sketch
3. **Tokens**: Atualizar design tokens (cores, tipografia, etc.)
4. **Implementação**: Atualizar componentes no frontend
5. **Documentação**: Atualizar guias e exemplos
6. **Testing**: Testes de regressão visual
7. **Deploy**: Rollout gradual das mudanças

#### Ferramentas Recomendadas
- **Design**: Figma para prototipação
- **Tokens**: Style Dictionary para design tokens
- **Documentation**: Storybook para componentes
- **Testing**: Percy/Chromatic para visual regression

---

## 7. Troubleshooting

### Problemas Comuns

#### 1. CORS Issues
```
Erro: Access to XMLHttpRequest at 'http://localhost:8000/api/' from origin 'http://localhost:5173' has been blocked
```
**Solução**: Verificar `CORS_ALLOWED_ORIGINS` no .env

#### 2. Authentication Failed
```
Erro: {"detail":"As credenciais de autenticação não foram fornecidas."}
```
**Solução**: Incluir header `Authorization: Bearer <token>`

#### 3. Module Import Error
```
Erro: ModuleNotFoundError: No module named 'api_routes'
```
**Solução**: Verificar se api_routes.py existe ou substituir por rotas reais

#### 4. Database Connection Error
```
Erro: django.db.utils.OperationalError: could not connect to server
```
**Solução**: Verificar DATABASE_URL no .env e status do PostgreSQL

### Logs Úteis
```bash
# Ver logs do servidor Django
python manage.py runserver --verbosity=2

# Logs do PostgreSQL (se usar)
tail -f /var/log/postgresql/postgresql-*.log

# Logs do Redis (se usar)
redis-cli monitor
```

---

## ⚠️ Próximos Passos Obrigatórios

### 1. Substituir api_routes.py
O arquivo `api_routes.py` é temporário. Substitua por:
```python
# Em cada app (core, crm, ops), criar:
# urls.py, views.py, serializers.py

# Em lifecaller_api/urls.py, trocar:
path("api/v1/", include("api_routes")),  # REMOVER
# Por:
path("api/v1/", include("core.urls")),   # OU router específico
```

### 2. Configurar Frontend
```bash
# No projeto frontend, arquivo .env:
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Implementar Linting
```bash
# Adicionar ao requirements.txt:
black>=23.0.0
flake8>=6.0.0
isort>=5.0.0

# Criar .pre-commit-config.yaml
# Configurar GitHub Actions/GitLab CI
```

### 4. Testes Automatizados
```python
# Criar tests/ em cada app
# Configurar coverage
# Implementar integration tests
```

---

**📅 Última atualização**: 2025-09-13
**👤 Desenvolvido com**: Claude Code
**🔗 Status**: ✅ API Versioning implementado, aguardando substituição de api_routes.py
- salvar tudo que foi feito ate agora