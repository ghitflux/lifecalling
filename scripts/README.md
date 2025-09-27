# Scripts

Esta pasta contém todos os scripts de automação e utilitários do projeto LifeCalling.

## Scripts de Migração

- **migrate.ps1** - Script PowerShell para migração de banco (Windows)
- **migrate.sh** - Script Bash para migração de banco (Linux/Mac)

## Scripts de Desenvolvimento

- **dev.ps1** - Script PowerShell de desenvolvimento e automação
- **dev.py** - Script Python para tarefas de desenvolvimento
- **start.sh** - Script de inicialização do projeto

## Scripts de Teste

- **smoke-tests.ps1** - Testes de smoke para Windows
- **smoke-tests.sh** - Testes de smoke para Linux/Mac

## Scripts de Dados

- **create_test_cases.py** - Criação de casos de teste
- **fix_case_errors.py** - Correção de erros em casos
- **investigate_db.py** - Investigação de problemas no banco
- **simple_seed.py** - Script simples de seed de dados

## Como usar

Certifique-se de que os scripts tenham permissão de execução:

```bash
chmod +x scripts/*.sh scripts/*.py
```

Para Windows, execute no PowerShell com política de execução adequada:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```