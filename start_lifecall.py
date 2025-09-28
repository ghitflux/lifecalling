#!/usr/bin/env python3
"""
Script de inicialização automática do projeto Lifecalling
Executa migrações, inicia containers, backend e frontend
"""

import os
import sys
import subprocess
import time
import signal
import psutil
import argparse
from pathlib import Path

class LifecallingStarter:
    def __init__(self, force_start=False):
        self.project_root = Path(__file__).parent
        self.processes = []
        self.force_start = force_start

    def log(self, message, level="INFO"):
        """Log com timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")

    def run_command(self, command, cwd=None, shell=True, capture_output=False, env=None):
        """Executa comando e retorna resultado"""
        try:
            if cwd is None:
                cwd = self.project_root

            self.log(f"Executando: {command}")

            if capture_output:
                result = subprocess.run(
                    command,
                    shell=shell,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    env=env
                )
                return result
            else:
                process = subprocess.Popen(
                    command,
                    shell=shell,
                    cwd=cwd,
                    env=env
                )
                return process

        except Exception as e:
            self.log(f"Erro ao executar comando: {e}", "ERROR")
            return None

    def kill_processes_on_port(self, port):
        """Mata processos rodando na porta especificada"""
        self.log(f"Verificando processos na porta {port}...")

        try:
            # Tenta usar psutil primeiro
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    # Verifica conexões do processo
                    for conn in proc.connections(kind='inet'):
                        if conn.laddr.port == port:
                            self.log(f"Terminando processo {proc.info['name']} (PID: {proc.info['pid']}) na porta {port}")
                            proc.terminate()
                            # Aguarda um pouco para o processo terminar graciosamente
                            try:
                                proc.wait(timeout=3)
                            except psutil.TimeoutExpired:
                                # Se não terminar graciosamente, força a terminação
                                proc.kill()
                            self.log(f"Processo PID {proc.info['pid']} terminado")
                            return True
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    # Processo pode ter terminado ou não temos acesso
                    continue
                except Exception:
                    # Se houver erro específico com connections, continua
                    continue

        except Exception as e:
            self.log(f"Erro ao verificar porta {port}: {e}", "ERROR")

        # Fallback para Windows usando netstat e taskkill
        try:
            # Usa netstat para encontrar processos na porta
            result = subprocess.run(
                f'netstat -ano | findstr :{port}',
                shell=True,
                capture_output=True,
                text=True
            )

            if result.stdout:
                lines = result.stdout.strip().split('\n')
                pids = set()

                for line in lines:
                    parts = line.split()
                    if len(parts) >= 5:
                        # Verifica se é a porta correta (pode ser :port ou IP:port)
                        local_addr = parts[1]
                        if f':{port}' in local_addr:
                            pid = parts[4]
                            if pid.isdigit():
                                pids.add(pid)

                # Mata os processos encontrados
                for pid in pids:
                    try:
                        subprocess.run(f'taskkill /PID {pid} /F', shell=True, check=True)
                        self.log(f"Processo PID {pid} na porta {port} terminado via taskkill")
                    except subprocess.CalledProcessError:
                        # Processo pode já ter terminado
                        pass

                return len(pids) > 0
            else:
                self.log(f"Nenhum processo encontrado na porta {port}")
                return False

        except Exception as e:
            self.log(f"Erro no fallback para porta {port}: {e}", "ERROR")
            return False

    def check_docker_running(self):
        """Verifica se Docker está rodando"""
        self.log("Verificando se Docker está rodando...")
        result = self.run_command("docker --version", capture_output=True)
        if result and result.returncode == 0:
            self.log("Docker está disponível")
            return True
        else:
            self.log("Docker não está disponível", "ERROR")
            return False

    def run_migrations(self):
        """Executa migrações pendentes"""
        self.log("Executando migrações pendentes...")

        # Verifica se existe diretório de migrações
        api_path = self.project_root / "apps" / "api"
        if not api_path.exists():
            self.log("Diretório da API não encontrado", "WARNING")
            return True

        # Executa migrações usando alembic se disponível
        migrations_path = api_path / "alembic"
        if migrations_path.exists():
            result = self.run_command(
                "python -m alembic upgrade head",
                cwd=api_path,
                capture_output=True
            )
            if result and result.returncode == 0:
                self.log("Migrações executadas com sucesso")
                return True
            else:
                self.log("Erro ao executar migrações", "WARNING")

        self.log("Migrações não encontradas ou já aplicadas")
        return True

    def start_docker_containers(self):
        """Inicia containers Docker (sem recriar)"""
        self.log("Verificando e iniciando containers Docker...")

        # Verifica se docker-compose.yml existe
        compose_file = self.project_root / "docker-compose.yml"
        if not compose_file.exists():
            self.log("docker-compose.yml não encontrado", "ERROR")
            return False

        # Verifica status atual dos containers
        status_result = self.run_command(
            "docker compose ps",
            capture_output=True
        )

        if status_result and status_result.returncode == 0:
            self.log("Status atual dos containers:")
            print(status_result.stdout)

            # Verifica se containers estão rodando
            if "Up" in status_result.stdout:
                self.log("Containers já estão rodando")
                return True

        # Inicia containers existentes (sem recriar)
        self.log("Iniciando containers existentes...")
        result = self.run_command(
            "docker compose start",
            capture_output=True
        )

        # Se não funcionou, tenta up -d (para criar se não existirem)
        if not result or result.returncode != 0:
            self.log("Tentando iniciar com docker compose up -d...")
            result = self.run_command(
                "docker compose up -d",
                capture_output=True
            )

        if result and result.returncode == 0:
            self.log("Containers Docker iniciados com sucesso")

            # Aguarda containers ficarem prontos
            self.log("Aguardando containers ficarem prontos...")
            time.sleep(5)

            # Verifica status final dos containers
            final_status = self.run_command(
                "docker compose ps",
                capture_output=True
            )
            if final_status:
                self.log("Status final dos containers:")
                print(final_status.stdout)

            return True
        else:
            self.log("Erro ao iniciar containers Docker", "ERROR")
            if result:
                self.log(f"Erro: {result.stderr}", "ERROR")
            return False

    def start_backend(self):
        """Inicia backend FastAPI"""
        self.log("Iniciando backend FastAPI...")

        api_path = self.project_root / "apps" / "api"
        if not api_path.exists():
            self.log("Diretório da API não encontrado", "ERROR")
            return None

        # Verifica se já está rodando
        health_check = self.run_command(
            'powershell -Command "try { Invoke-WebRequest -Uri \'http://localhost:8000/health\' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"',
            capture_output=True
        )

        if health_check and health_check.returncode == 0:
            self.log("Backend já está rodando")
            return None

        # Configura variáveis de ambiente para modo forçado
        env_vars = os.environ.copy()
        if self.force_start:
            # Carrega .env.force se existir, senão usa .env padrão com override
            env_force_file = self.project_root / ".env.force"
            if env_force_file.exists():
                self.log("Carregando configurações do .env.force")
                with open(env_force_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            env_vars[key] = value
            else:
                env_vars['POSTGRES_HOST'] = 'localhost'
                self.log("Configurando POSTGRES_HOST=localhost para modo forçado")

        # Inicia backend
        if os.name == 'nt':  # Windows
            command = 'powershell -Command "cd apps/api; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"'
        else:  # Linux/Mac
            command = "cd apps/api && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

        process = self.run_command(command, capture_output=False, env=env_vars)

        if process:
            self.processes.append(('backend', process))
            self.log("Backend iniciado em segundo plano")

            # Aguarda backend ficar pronto
            self.log("Aguardando backend ficar pronto...")
            for i in range(30):  # 30 segundos timeout
                time.sleep(1)
                health_check = self.run_command(
                    'powershell -Command "try { Invoke-WebRequest -Uri \'http://localhost:8000/health\' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"',
                    capture_output=True
                )
                if health_check and health_check.returncode == 0:
                    self.log("Backend está respondendo!")
                    return process

            self.log("Backend pode não estar respondendo ainda", "WARNING")
            return process
        else:
            self.log("Erro ao iniciar backend", "ERROR")
            return None

    def start_frontend(self):
        """Inicia frontend Next.js"""
        self.log("Iniciando frontend Next.js...")

        web_path = self.project_root / "apps" / "web"
        if not web_path.exists():
            self.log("Diretório web não encontrado", "ERROR")
            return None

        # Verifica se pnpm está disponível
        pnpm_check = self.run_command("pnpm --version", capture_output=True)
        if not pnpm_check or pnpm_check.returncode != 0:
            self.log("pnpm não encontrado, tentando npm...", "WARNING")
            pass  # fallback to npm via dev_command
            dev_command = "npm run dev"
        else:
            # package_manager = "pnpm"  # Used implicitly in dev_command
            dev_command = "pnpm dev"

        # Inicia frontend
        if os.name == 'nt':  # Windows
            command = f'powershell -Command "cd apps/web; {dev_command}"'
        else:  # Linux/Mac
            command = f"cd apps/web && {dev_command}"

        process = self.run_command(command, capture_output=False)

        if process:
            self.processes.append(('frontend', process))
            self.log("Frontend iniciado em segundo plano")
            self.log("Frontend estará disponível em: http://localhost:3000")
            return process
        else:
            self.log("Erro ao iniciar frontend", "ERROR")
            return None

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

    def start_all(self):
        """Inicia todos os serviços"""
        self.log("=== Iniciando Lifecalling ===")

        # Registra handler para Ctrl+C
        signal.signal(signal.SIGINT, self.signal_handler)

        try:
            # 0. Libera portas 8000 e 3000
            self.log("Liberando portas 8000 e 3000...")
            self.kill_processes_on_port(8000)
            self.kill_processes_on_port(3000)

            if not self.force_start:
                # 1. Verifica Docker
                if not self.check_docker_running():
                    self.log("Docker é necessário para rodar o projeto", "ERROR")
                    return False

                # 2. Executa migrações
                if not self.run_migrations():
                    self.log("Erro nas migrações", "ERROR")
                    return False

                # 3. Inicia containers
                if not self.start_docker_containers():
                    self.log("Erro ao iniciar containers", "ERROR")
                    return False
            else:
                self.log("Modo forçado: Pulando Docker e migrações", "WARNING")

            # 4. Inicia backend
            self.start_backend()

            # 5. Inicia frontend
            self.start_frontend()

            # Resumo
            self.log("=== Lifecalling Iniciado ===")
            if not self.force_start:
                self.log("🐳 Containers Docker: ✅ Rodando")
            else:
                self.log("🐳 Containers Docker: ⚠️ Pulado (modo forçado)")
            self.log("🚀 Backend API: ✅ http://localhost:8000")
            self.log("🌐 Frontend Web: ✅ http://localhost:3000")
            self.log("📚 Documentação: ✅ http://localhost:8000/docs")
            self.log("")
            self.log("Pressione Ctrl+C para parar todos os serviços")

            # Mantém script rodando
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
    parser = argparse.ArgumentParser(description='Inicia o sistema Lifecalling')
    parser.add_argument('--force', '-f', action='store_true',
                       help='Força o início sem Docker (apenas backend e frontend)')

    args = parser.parse_args()

    starter = LifecallingStarter(force_start=args.force)
    success = starter.start_all()

    if success:
        print("\n✅ Lifecalling finalizado com sucesso!")
    else:
        print("\n❌ Erro ao iniciar Lifecalling!")
        sys.exit(1)

if __name__ == "__main__":
    main()
