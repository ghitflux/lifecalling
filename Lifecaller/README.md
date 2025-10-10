# Lifecaller

Sistema completo para gestão de atendimentos e simulação de empréstimos, desenvolvido com Django (backend) e React (frontend).

## 🚀 Tecnologias

### Backend
- **Django 4.2** - Framework web Python
- **Django REST Framework** - API REST
- **PostgreSQL** - Banco de dados
- **Docker** - Containerização

### Frontend
- **React 18** - Biblioteca JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **Storybook** - Documentação de componentes

## 📁 Estrutura do Projeto

```
lifecaller/
├── backend/                    # API Django
│   ├── atendimentos/          # App de atendimentos e simulações
│   ├── attachments/           # App de anexos
│   ├── core/                  # App principal
│   └── lifecaller_backend/    # Configurações Django
├── lifecaller/                # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── design-system/     # Sistema de design
│   │   ├── features/          # Funcionalidades específicas
│   │   ├── pages/             # Páginas da aplicação
│   │   └── services/          # Serviços e APIs
│   └── .storybook/           # Configuração do Storybook
├── docs/                      # Documentação
├── scripts/                   # Scripts utilitários
└── tokens/                    # Design tokens
```

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Docker e Docker Compose
- Git

### 1. Clone o repositório
```bash
git clone https://github.com/ghitflux/lifecaller.git
cd lifecaller
```

### 2. Configure o banco de dados
```bash
# Inicie o PostgreSQL via Docker
docker-compose up -d
```

### 3. Configure o backend
```bash
cd backend

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Execute as migrações
python manage.py migrate

# Crie dados de teste (opcional)
python create_test_data.py

# Inicie o servidor
python manage.py runserver 0.0.0.0:5344
```

### 4. Configure o frontend
```bash
cd lifecaller

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### 5. Configure o Storybook (opcional)
```bash
cd lifecaller

# Inicie o Storybook
npm run storybook
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:5344/
- **Storybook**: http://localhost:6008/
- **PostgreSQL**: localhost:5433

## 📊 Funcionalidades

### Sistema de Atendimentos
- ✅ Gestão de clientes e atendimentos
- ✅ Histórico de interações
- ✅ Status de atendimento

### Sistema de Simulação de Empréstimos
- ✅ Cadastro de coeficientes por banco e prazo
- ✅ Simulação de empréstimos com diferentes cenários
- ✅ Cálculo automático de parcelas e juros
- ✅ API para integração com frontend

### Sistema de Anexos
- ✅ Upload e gestão de documentos
- ✅ Associação com atendimentos
- ✅ Controle de acesso

## 🔧 Scripts Disponíveis

### Backend
```bash
# Executar servidor de desenvolvimento
python manage.py runserver

# Executar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Criar dados de teste
python create_test_data.py
```

### Frontend
```bash
# Servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Storybook
npm run storybook

# Build do Storybook
npm run build-storybook

# Linting
npm run lint
```

## 🧪 Testes

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd lifecaller
npm run test
```

## 📚 API Endpoints

### Atendimentos
- `GET /api/atendimentos/` - Lista atendimentos
- `POST /api/atendimentos/` - Cria atendimento
- `GET /api/atendimentos/{id}/` - Detalhes do atendimento
- `PUT /api/atendimentos/{id}/` - Atualiza atendimento

### Coeficientes
- `GET /api/coeficientes/` - Lista coeficientes
- `POST /api/coeficientes/` - Cria coeficiente
- `GET /api/coeficientes/bancos/` - Lista bancos disponíveis

### Simulação
- `POST /api/simulacao/` - Simula empréstimo

## 🎨 Design System

O projeto utiliza um design system próprio com:
- Tokens de design (cores, tipografia, espaçamentos)
- Componentes reutilizáveis
- Documentação no Storybook
- Integração com Tailwind CSS

## 🚀 Deploy

### Backend (Django)
1. Configure as variáveis de ambiente para produção
2. Execute `python manage.py collectstatic`
3. Configure um servidor web (Nginx + Gunicorn)
4. Configure o banco de dados PostgreSQL

### Frontend (React)
1. Execute `npm run build`
2. Sirva os arquivos estáticos gerados em `dist/`
3. Configure um CDN (opcional)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: [ghitflux](https://github.com/ghitflux)

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do email.

---

**Lifecaller** - Sistema completo para gestão de atendimentos e simulação de empréstimos.