# Testes

Esta pasta está preparada para conter arquivos de teste do projeto LifeCalling.

## Estrutura Planejada

```
tests/
├── unit/              # Testes unitários
├── integration/       # Testes de integração
├── e2e/              # Testes end-to-end
├── fixtures/         # Dados de teste
├── mocks/            # Mocks para testes
└── README.md         # Esta documentação
```

## Tipos de Teste

### Testes Unitários
- Testes de funções isoladas
- Componentes React
- Utilitários e helpers
- Validações de dados

### Testes de Integração
- APIs e endpoints
- Fluxos de dados
- Interações entre serviços
- Banco de dados

### Testes End-to-End
- Fluxos completos de usuário
- Interfaces de usuário
- Cenários reais de uso
- Smoke tests

## Ferramentas

O projeto utiliza:
- **Vitest** - Framework de testes
- **Playwright** - Testes E2E
- **React Testing Library** - Testes de componentes

## Como executar

```bash
# Testes unitários
pnpm test

# Testes E2E
pnpm test:e2e

# Testes com coverage
pnpm test:coverage
```