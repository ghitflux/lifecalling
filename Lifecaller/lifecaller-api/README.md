# Lifecaller API

Backend Django REST API para o sistema Lifecaller.

## 🚀 Tecnologias

- Django 5.x
- Django REST Framework
- SimpleJWT (autenticação)
- PostgreSQL
- Redis (Celery)
- drf-spectacular (OpenAPI/Swagger)

## 📋 Pré-requisitos

- Python 3.11+
- PostgreSQL
- Redis (para Celery)
- pip ou pipenv

## 🔧 Instalação e Configuração

### 1. Clone o repositório e acesse o diretório

```bash
git clone <repository-url>
cd lifecaller-api
```

### 2. Crie um ambiente virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

- `SECRET_KEY`: Chave secreta do Django
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `CORS_ALLOWED_ORIGINS`: Origins permitidos para CORS
- `JWT_ACCESS_MIN`: Tempo de vida do token JWT em minutos
- `REDIS_URL`: URL de conexão com Redis

### 5. Execute as migrações

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Crie um superusuário

```bash
python manage.py createsuperuser
```

### 7. Execute o servidor de desenvolvimento

```bash
python manage.py runserver 0.0.0.0:8000
```

## 🛠️ Principais Rotas da API

### Geral
- `GET /api/v1/ping/` - Status da API
- `GET /api/v1/schema/` - Schema OpenAPI
- `GET /api/v1/docs/` - Documentação Swagger
- `GET /api/v1/redoc/` - Documentação ReDoc

### Autenticação
- `POST /api/v1/auth/token/` - Obter token JWT (login)
- `POST /api/v1/auth/token/refresh/` - Renovar token JWT

### Admin
- `GET /admin/` - Interface administrativa do Django

## 🗂️ Estrutura do Projeto

```
lifecaller-api/
├── lifecaller_api/           # Configurações principais
│   ├── settings/
│   │   ├── base.py          # Configurações base
│   │   ├── dev.py           # Configurações de desenvolvimento
│   │   └── prod.py          # Configurações de produção
│   ├── urls.py              # URLs principais
│   ├── wsgi.py              # WSGI config
│   └── asgi.py              # ASGI config
├── accounts/                # App de usuários/autenticação
├── core/                    # App de utilitários
├── crm/                     # App de CRM
├── ops/                     # App de operações
├── manage.py                # Django CLI
├── requirements.txt         # Dependências
└── .env.example            # Exemplo de variáveis de ambiente
```

## ⚙️ Configuração por Ambiente

### Desenvolvimento
- Use `DJANGO_SETTINGS_MODULE=lifecaller_api.settings.dev`
- DEBUG=True por padrão
- CORS liberado para todos os origins

### Produção
- Use `DJANGO_SETTINGS_MODULE=lifecaller_api.settings.prod`
- Configure `ALLOWED_HOSTS` no .env
- Configurações de segurança habilitadas

## 🐛 Comandos Úteis

```bash
# Fazer migrações
python manage.py makemigrations

# Aplicar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Executar servidor
python manage.py runserver 0.0.0.0:8000

# Executar testes
python manage.py test

# Executar shell do Django
python manage.py shell

# Coletar arquivos estáticos (produção)
python manage.py collectstatic
```

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatório |
|----------|-----------|--------|-------------|
| `SECRET_KEY` | Chave secreta do Django | - | ✅ |
| `DEBUG` | Modo debug | False | ❌ |
| `DATABASE_URL` | URL do banco PostgreSQL | sqlite:///db.sqlite3 | ✅ |
| `CORS_ALLOWED_ORIGINS` | Origins permitidos (separados por vírgula) | - | ✅ |
| `JWT_ACCESS_MIN` | Tempo de vida do JWT em minutos | 60 | ❌ |
| `REDIS_URL` | URL do Redis para Celery | redis://localhost:6379/0 | ❌ |
| `ALLOWED_HOSTS` | Hosts permitidos em produção | - | ✅ (prod) |

## 🧪 Testando a API

### Verificar status:
```bash
curl http://localhost:8000/api/v1/ping/
```

### Acessar documentação:
- Swagger: http://localhost:8000/api/v1/docs/
- ReDoc: http://localhost:8000/api/v1/redoc/
- Schema: http://localhost:8000/api/v1/schema/

## 📝 Licença

Este projeto está sob a licença MIT.