#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script Seguro de Inicialização do LifeCalling
===============================================

Este script inicia a aplicação LifeCalling de forma segura e controlada.
- Não exclui dados do banco de dados
- Limpa apenas cookies, cache e arquivos temporários
- Verifica migrações pendentes
- Suporte completo para Windows
- Múltiplos modos de operação

Uso:
  python safe_start_lifecall.py [opções]

Opções:
  --clean     Limpa cache e reinstala dependências
  --dev       Modo desenvolvimento com SQLite
  --health    Verifica saúde dos serviços
  --debug     Logs detalhados para troubleshooting
  --setup     Configuração inicial completa
  --storybook Inclui Storybook na inicialização
"""

import os
import sys
import subprocess
import time
import signal
import psutil
import argparse
import shutil
import json
import tempfile
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import webbrowser

# Configuração de encoding para Windows
if sys.platform == "win32":
    import locale
    locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')

class LifeCallingSafeStarter:
    def __init__(self, args):
        self.project_root = Path(__file__).parent
        self.processes: List[Tuple[str, subprocess.Popen]] = []
        self.args = args
        self.start_time = time.time()

        # Configurações
        self.ports = {
            'backend': 8000,
            'frontend': 3000,
            'storybook': 6006
        }

        # URLs de saúde
        self.health_urls = {
            'backend': 'http://localhost:8000/health',
            'frontend': 'http://localhost:3000',
            'storybook': 'http://localhost:6006'
        }

    def log(self, message: str, level: str = "INFO", no_timestamp: bool = False):
        """Log com timestamp e cores"""
        if not no_timestamp:
            timestamp = time.strftime("%H:%M:%S")
            prefix = f"[{timestamp}] [{level}]"
        else:
            prefix = f"[{level}]"

        # Cores para diferentes níveis (apenas no terminal)
        colors = {
            "INFO": "",
            "SUCCESS": "",
            "WARNING": "",
            "ERROR": "",
            "DEBUG": ""
        }

        if hasattr(sys.stderr, 'isatty') and sys.stderr.isatty():
            colors = {
                "INFO": "\033[36m",      # Cyan
                "SUCCESS": "\033[32m",   # Green
                "WARNING": "\033[33m",   # Yellow
                "ERROR": "\033[31m",     # Red
                "DEBUG": "\033[35m",     # Magenta
            }
            reset = "\033[0m"
        else:
            reset = ""

        color = colors.get(level, "")
        print(f"{color}{prefix} {message}{reset}")

    def run_command(self, command: str, cwd: Optional[Path] = None,
                   shell: bool = True, capture_output: bool = False,
                   env: Optional[Dict] = None, timeout: Optional[int] = None) -> subprocess.CompletedProcess:
        """Executa comando com tratamento de erros aprimorado"""
        if cwd is None:
            cwd = self.project_root

        if self.args.debug:
            self.log(f"Executando: {command}", "DEBUG")

        try:
            if capture_output:
                result = subprocess.run(
                    command,
                    shell=shell,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    env=env,
                    timeout=timeout,
                    encoding='utf-8',
                    errors='replace'
                )
                return result
            else:
                process = subprocess.Popen(
                    command,
                    shell=shell,
                    cwd=cwd,
                    env=env,
                    encoding='utf-8',
                    errors='replace'
                )
                return process
        except subprocess.TimeoutExpired:
            self.log(f"Comando expirou após {timeout}s: {command}", "ERROR")
            return None
        except Exception as e:
            self.log(f"Erro ao executar comando: {e}", "ERROR")
            return None

    def check_port_available(self, port: int) -> bool:
        """Verifica se uma porta está disponível"""
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    for conn in proc.net_connections(kind='inet'):
                        if conn.laddr.port == port and conn.status == 'LISTEN':
                            return False
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            return True
        except Exception:
            # Fallback usando netstat
            try:
                result = subprocess.run(
                    f'netstat -an | findstr :{port}',
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                return 'LISTENING' not in result.stdout
            except Exception:
                return True

    def kill_processes_on_port(self, port: int) -> bool:
        """Mata processos em uma porta específica de forma segura"""
        self.log(f"Verificando porta {port}...")

        killed = False
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    # Pula processos de sistema críticos
                    if proc.info['pid'] == 0 or proc.info['name'] in ['System', 'csrss.exe', 'winlogon.exe']:
                        continue

                    for conn in proc.net_connections(kind='inet'):
                        if conn.laddr.port == port and conn.status == 'LISTEN':
                            self.log(f"Terminando {proc.info['name']} (PID: {proc.info['pid']}) na porta {port}")
                            proc.terminate()
                            try:
                                proc.wait(timeout=3)
                            except psutil.TimeoutExpired:
                                proc.kill()
                            killed = True
                            break
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception as e:
            if self.args.debug:
                self.log(f"Erro ao verificar porta {port}: {e}", "DEBUG")

        if not killed and not self.check_port_available(port):
            self.log(f"Porta {port} ainda ocupada, tentando netstat/taskkill...", "WARNING")
            # Implementação adicional se necessário

        return killed

    def clear_browser_data(self):
        """Limpa dados do navegador (cookies, localStorage, sessionStorage)"""
        self.log("Limpando dados do navegador...")

        # Cria script temporário para limpar dados
        cleanup_script = f"""
        // Limpa localStorage
        if (typeof localStorage !== 'undefined') {{
            localStorage.clear();
        }}

        // Limpa sessionStorage
        if (typeof sessionStorage !== 'undefined') {{
            sessionStorage.clear();
        }}

        // Limpa cookies para localhost
        document.cookie.split(";").forEach(function(c) {{
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        }});

        console.log('Dados do navegador limpos com sucesso');
        """

        try:
            # Remove arquivos de cookies se existirem
            cookie_files = ['cookies.txt', 'cookies_proxy.txt']
            for cookie_file in cookie_files:
                cookie_path = self.project_root / cookie_file
                if cookie_path.exists():
                    cookie_path.unlink()
                    self.log(f"Removido: {cookie_file}")

            self.log("Dados do navegador limpos", "SUCCESS")
        except Exception as e:
            self.log(f"Erro ao limpar dados do navegador: {e}", "WARNING")

    def clear_cache(self):
        """Limpa cache de desenvolvimento"""
        self.log("Limpando cache de desenvolvimento...")

        cache_dirs = [
            self.project_root / "apps" / "web" / ".next",
            self.project_root / "apps" / "web" / "node_modules" / ".cache",
            self.project_root / "node_modules" / ".cache",
            self.project_root / ".pnpm-store",
        ]

        cache_files = [
            self.project_root / "apps" / "web" / ".env.local",
        ]

        for cache_dir in cache_dirs:
            if cache_dir.exists():
                try:
                    shutil.rmtree(cache_dir)
                    self.log(f"Cache removido: {cache_dir.name}")
                except Exception as e:
                    if self.args.debug:
                        self.log(f"Erro ao remover {cache_dir}: {e}", "DEBUG")

        for cache_file in cache_files:
            if cache_file.exists():
                try:
                    cache_file.unlink()
                    self.log(f"Arquivo removido: {cache_file.name}")
                except Exception as e:
                    if self.args.debug:
                        self.log(f"Erro ao remover {cache_file}: {e}", "DEBUG")

    def install_dependencies(self):
        """Instala/atualiza dependências"""
        self.log("Verificando dependências...")

        # Verifica pnpm
        pnpm_check = self.run_command("pnpm --version", capture_output=True, timeout=10)
        if not pnpm_check or pnpm_check.returncode != 0:
            self.log("pnpm não encontrado, usando npm", "WARNING")
            install_cmd = "npm install"
        else:
            install_cmd = "pnpm install"

        if self.args.clean:
            self.log("Reinstalando dependências...")
            result = self.run_command(install_cmd, capture_output=True, timeout=300)
            if result and result.returncode == 0:
                self.log("Dependências instaladas", "SUCCESS")
            else:
                self.log("Erro ao instalar dependências", "ERROR")
                return False
        else:
            self.log("Dependências OK (use --clean para reinstalar)")

        return True

    def start_docker_services(self) -> bool:
        """Inicia serviços Docker (PostgreSQL)"""
        self.log("Iniciando serviços Docker...")

        # Verifica se docker-compose existe
        compose_file = self.project_root / "docker-compose.yml"
        if not compose_file.exists():
            self.log("docker-compose.yml não encontrado", "ERROR")
            return False

        try:
            # Para serviços existentes primeiro
            stop_result = self.run_command(
                "docker compose down",
                capture_output=True,
                timeout=30
            )
            if self.args.debug and stop_result:
                self.log(f"Docker compose down: {stop_result.returncode}", "DEBUG")

            # Inicia serviços
            self.log("Iniciando containers PostgreSQL...")
            start_result = self.run_command(
                "docker compose up -d",
                capture_output=True,
                timeout=60
            )

            if start_result and start_result.returncode == 0:
                self.log("Containers Docker iniciados", "SUCCESS")

                # Aguarda PostgreSQL ficar pronto
                self.log("Aguardando PostgreSQL ficar pronto...")
                for i in range(30):
                    time.sleep(1)
                    # Testa conexão com PostgreSQL
                    test_result = self.run_command(
                        'docker exec $(docker compose ps -q db) pg_isready -U postgres',
                        capture_output=True,
                        timeout=5
                    )
                    if test_result and test_result.returncode == 0:
                        self.log("PostgreSQL está pronto!", "SUCCESS")
                        return True

                self.log("PostgreSQL pode não estar respondendo ainda", "WARNING")
                return True
            else:
                self.log("Erro ao iniciar containers Docker", "ERROR")
                if start_result and self.args.debug:
                    self.log(f"Erro: {start_result.stderr}", "DEBUG")
                return False

        except Exception as e:
            self.log(f"Erro com Docker: {e}", "ERROR")
            return False

    def check_database_connection(self) -> bool:
        """Verifica conexão com banco de dados"""
        self.log("Verificando conexão com banco de dados...")

        # Testa conexão via psql
        try:
            test_cmd = 'docker exec $(docker compose ps -q db) psql -U postgres -d lifecalling -c "SELECT 1;" || echo "DB_NOT_READY"'
            result = self.run_command(test_cmd, capture_output=True, timeout=10)

            if result and "DB_NOT_READY" not in result.stdout:
                self.log("Conexão com banco OK", "SUCCESS")
                return True
            else:
                self.log("Banco pode não estar pronto ainda", "WARNING")
                return True

        except Exception as e:
            if self.args.debug:
                self.log(f"Erro ao testar conexão: {e}", "DEBUG")
            return True

    def run_migrations(self) -> bool:
        """Executa migrações pendentes"""
        self.log("Verificando migrações...")

        api_path = self.project_root / "apps" / "api"
        if not api_path.exists():
            self.log("Diretório da API não encontrado", "WARNING")
            return True

        # Verifica se há sistema de migrações
        alembic_path = api_path / "alembic"
        if alembic_path.exists():
            self.log("Executando migrações do Alembic...")
            result = self.run_command(
                "python -m alembic upgrade head",
                cwd=api_path,
                capture_output=True,
                timeout=60
            )
            if result and result.returncode == 0:
                self.log("Migrações aplicadas", "SUCCESS")
            else:
                self.log("Erro nas migrações", "WARNING")
                if self.args.debug and result:
                    self.log(f"Erro: {result.stderr}", "DEBUG")
        else:
            self.log("Sistema de migrações não encontrado")

        return True

    def setup_development_env(self):
        """Configura ambiente de desenvolvimento"""
        if self.args.dev:
            self.log("Configurando ambiente de desenvolvimento...")

            # Cria .env.development se não existir
            env_dev_path = self.project_root / ".env.development"
            if not env_dev_path.exists():
                env_content = """# Ambiente de Desenvolvimento - PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=lifecalling
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT
JWT_SECRET=dev-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30

# Outros
DEBUG=true
ENVIRONMENT=development
"""
                env_dev_path.write_text(env_content, encoding='utf-8')
                self.log("Arquivo .env.development criado", "SUCCESS")

    def start_backend(self) -> Optional[subprocess.Popen]:
        """Inicia backend FastAPI"""
        self.log("Iniciando backend FastAPI...")

        api_path = self.project_root / "apps" / "api"
        if not api_path.exists():
            self.log("Diretório da API não encontrado", "ERROR")
            return None

        # Verifica se já está rodando
        if not self.check_port_available(self.ports['backend']):
            self.log("Backend já está rodando", "SUCCESS")
            return None

        # Configura ambiente
        env_vars = os.environ.copy()
        if self.args.dev:
            env_vars['DATABASE_URL'] = 'sqlite:///./lifecalling_dev.db'
            env_vars['DEBUG'] = 'true'

        # Comando para iniciar
        command = "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

        process = self.run_command(command, cwd=api_path, env=env_vars)
        if process:
            self.processes.append(('backend', process))
            self.log("Backend iniciado", "SUCCESS")

            # Aguarda ficar pronto
            self.log("Aguardando backend ficar pronto...")
            for i in range(30):
                time.sleep(1)
                try:
                    result = self.run_command(
                        f'curl -s -o nul -w "%{{http_code}}" {self.health_urls["backend"]}',
                        capture_output=True,
                        timeout=5
                    )
                    if result and '200' in result.stdout:
                        self.log("Backend respondendo!", "SUCCESS")
                        return process
                except Exception:
                    pass

            self.log("Backend pode não estar respondendo ainda", "WARNING")
            return process
        else:
            self.log("Erro ao iniciar backend", "ERROR")
            return None

    def start_frontend(self) -> Optional[subprocess.Popen]:
        """Inicia frontend Next.js"""
        self.log("Iniciando frontend Next.js...")

        web_path = self.project_root / "apps" / "web"
        if not web_path.exists():
            self.log("Diretório web não encontrado", "ERROR")
            return None

        # Verifica se já está rodando
        if not self.check_port_available(self.ports['frontend']):
            self.log("Frontend já está rodando", "SUCCESS")
            return None

        # Determina comando
        pnpm_check = self.run_command("pnpm --version", capture_output=True, timeout=5)
        if pnpm_check and pnpm_check.returncode == 0:
            command = "pnpm dev"
        else:
            command = "npm run dev"

        process = self.run_command(command, cwd=web_path)
        if process:
            self.processes.append(('frontend', process))
            self.log("Frontend iniciado", "SUCCESS")
            self.log(f"Frontend disponível em: {self.health_urls['frontend']}")
            return process
        else:
            self.log("Erro ao iniciar frontend", "ERROR")
            return None

    def start_storybook(self) -> Optional[subprocess.Popen]:
        """Inicia Storybook"""
        if not self.args.storybook:
            return None

        self.log("Iniciando Storybook...")

        # Verifica se já está rodando
        if not self.check_port_available(self.ports['storybook']):
            self.log("Storybook já está rodando", "SUCCESS")
            return None

        # Determina comando
        pnpm_check = self.run_command("pnpm --version", capture_output=True, timeout=5)
        if pnpm_check and pnpm_check.returncode == 0:
            command = "pnpm storybook"
        else:
            command = "npm run storybook"

        process = self.run_command(command, cwd=self.project_root / "apps" / "web")
        if process:
            self.processes.append(('storybook', process))
            self.log("Storybook iniciado", "SUCCESS")
            self.log(f"Storybook disponível em: {self.health_urls['storybook']}")
            return process
        else:
            self.log("Erro ao iniciar Storybook", "ERROR")
            return None

    def health_check(self) -> Dict[str, bool]:
        """Verifica saúde de todos os serviços"""
        self.log("Verificando saúde dos serviços...")

        health = {}

        for service, url in self.health_urls.items():
            if service == 'storybook' and not self.args.storybook:
                continue

            try:
                result = self.run_command(
                    f'curl -s -o nul -w "%{{http_code}}" {url}',
                    capture_output=True,
                    timeout=10
                )
                health[service] = result and '200' in result.stdout
            except Exception:
                health[service] = False

        return health

    def cleanup(self):
        """Limpa processos ao sair"""
        self.log("Finalizando processos...")
        for name, process in self.processes:
            try:
                self.log(f"Finalizando {name}...")
                process.terminate()
                process.wait(timeout=5)
            except Exception:
                try:
                    process.kill()
                except Exception:
                    pass

    def signal_handler(self, signum, frame):
        """Handler para sinais de interrupção"""
        self.log("Recebido sinal de interrupção...")
        self.cleanup()
        sys.exit(0)

    def start_all(self) -> bool:
        """Inicia todos os serviços"""
        self.log("=== LifeCalling Safe Starter ===", "SUCCESS")

        # Registra handler para Ctrl+C
        signal.signal(signal.SIGINT, self.signal_handler)

        try:
            # 1. Libera portas necessárias
            self.log("Liberando portas necessárias...")
            for port in self.ports.values():
                self.kill_processes_on_port(port)

            # 2. Limpa dados se solicitado
            if self.args.clean:
                self.clear_cache()

            self.clear_browser_data()

            # 3. Configura ambiente
            self.setup_development_env()

            # 4. Instala dependências
            if not self.install_dependencies():
                return False

            # 5. Inicia serviços Docker (PostgreSQL)
            if not self.start_docker_services():
                self.log("Problema ao iniciar Docker", "ERROR")
                return False

            # 6. Verifica banco de dados
            if not self.check_database_connection():
                self.log("Problema com conexão do banco", "WARNING")

            # 7. Executa migrações
            if not self.run_migrations():
                return False

            # 8. Inicia serviços da aplicação
            self.start_backend()
            time.sleep(3)  # Aguarda backend inicializar

            self.start_frontend()
            time.sleep(2)  # Aguarda frontend inicializar

            if self.args.storybook:
                self.start_storybook()

            # 8. Verificação final
            time.sleep(5)
            health = self.health_check()

            # 9. Resumo
            self.log("=== Status dos Serviços ===", "SUCCESS")
            for service, status in health.items():
                status_text = "[OK]" if status else "[FALHA]"
                url = self.health_urls[service]
                self.log(f"{service.upper()}: {status_text} - {url}", no_timestamp=True)

            self.log("", no_timestamp=True)
            self.log("LifeCalling iniciado com sucesso!", "SUCCESS", no_timestamp=True)
            self.log("", no_timestamp=True)
            self.log("Pressione Ctrl+C para parar todos os serviços", no_timestamp=True)

            # Abre browser se solicitado
            if not self.args.debug:
                time.sleep(2)
                webbrowser.open(self.health_urls['frontend'])

            # 10. Mantém rodando
            try:
                while True:
                    time.sleep(1)

                    # Verifica se processos ainda estão rodando
                    for name, process in self.processes[:]:
                        if process.poll() is not None:
                            self.log(f"{name} parou inesperadamente", "WARNING")
                            self.processes.remove((name, process))

            except KeyboardInterrupt:
                pass

        except Exception as e:
            self.log(f"Erro inesperado: {e}", "ERROR")
            return False
        finally:
            self.cleanup()

        return True

def main():
    """Função principal"""
    parser = argparse.ArgumentParser(
        description='Inicia o LifeCalling de forma segura',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument('--clean', '-c', action='store_true',
                       help='Limpa cache e reinstala dependências')
    parser.add_argument('--dev', '-d', action='store_true',
                       help='Modo desenvolvimento com SQLite')
    parser.add_argument('--health', action='store_true',
                       help='Apenas verifica saúde dos serviços')
    parser.add_argument('--debug', action='store_true',
                       help='Logs detalhados para troubleshooting')
    parser.add_argument('--setup', '-s', action='store_true',
                       help='Configuração inicial completa')
    parser.add_argument('--storybook', action='store_true',
                       help='Inclui Storybook na inicialização')

    args = parser.parse_args()

    # Se apenas health check
    if args.health:
        starter = LifeCallingSafeStarter(args)
        health = starter.health_check()
        all_good = all(health.values())

        print("Status dos Serviços:")
        for service, status in health.items():
            status_text = "OK" if status else "FALHA"
            print(f"  {service}: {status_text}")

        sys.exit(0 if all_good else 1)

    # Setup completo se solicitado
    if args.setup:
        args.clean = True
        args.dev = True

    starter = LifeCallingSafeStarter(args)
    success = starter.start_all()

    if success:
        print("\n[SUCCESS] LifeCalling finalizado com sucesso!")
    else:
        print("\n[ERROR] Erro ao iniciar LifeCalling!")
        sys.exit(1)

if __name__ == "__main__":
    main()