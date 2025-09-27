#!/usr/bin/env python3
"""
Lifecalling - Script de Desenvolvimento Otimizado
Executa migrações e inicia servidores sem reinstalar dependências
"""

import argparse
import subprocess
import time
import socket
import json
import os
import sys
from pathlib import Path

class LifecallingDev:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.web_path = self.project_root / "apps" / "web"

    def print_colored(self, message, color="white"):
        colors = {
            "red": "\033[91m",
            "green": "\033[92m",
            "yellow": "\033[93m",
            "blue": "\033[94m",
            "magenta": "\033[95m",
            "cyan": "\033[96m",
            "white": "\033[97m",
            "reset": "\033[0m"
        }
        print(f"{colors.get(color, colors['white'])}{message}{colors['reset']}")

    def test_port(self, port):
        """Verifica se uma porta está em uso"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                return result == 0
        except:
            return False

    def clear_ports(self, include_storybook=False):
        """Libera portas ocupadas"""
        self.print_colored("🔍 Verificando portas...", "yellow")

        ports = [3000, 8000]
        if include_storybook:
            ports.append(6006)

        for port in ports:
            if self.test_port(port):
                self.print_colored(f"⚠️  Porta {port} em uso, liberando...", "yellow")

                try:
                    # Windows
                    if os.name == 'nt':
                        result = subprocess.run(
                            f'netstat -ano | findstr ":{port}"',
                            shell=True, capture_output=True, text=True
                        )
                        if result.stdout:
                            lines = result.stdout.strip().split('\n')
                            for line in lines:
                                parts = line.split()
                                if len(parts) >= 5:
                                    pid = parts[4]
                                    try:
                                        subprocess.run(f'taskkill /F /PID {pid}',
                                                     shell=True, capture_output=True)
                                        self.print_colored(f"✅ Processo {pid} finalizado", "green")
                                    except:
                                        pass
                    # Unix/Linux
                    else:
                        subprocess.run(f'lsof -ti:{port} | xargs kill -9',
                                     shell=True, capture_output=True)

                    time.sleep(2)
                except Exception as e:
                    self.print_colored(f"⚠️  Não foi possível liberar porta {port}: {e}", "yellow")

    def run_command(self, command, cwd=None, check=True):
        """Executa comando e retorna resultado"""
        try:
            result = subprocess.run(
                command, shell=True, cwd=cwd,
                capture_output=True, text=True, check=check
            )
            return result
        except subprocess.CalledProcessError as e:
            if check:
                raise Exception(f"Comando falhou: {command}\nErro: {e.stderr}")
            return e

    def start_database(self):
        """Inicia banco de dados"""
        self.print_colored("🐘 Iniciando banco de dados...", "yellow")

        try:
            # Verifica se banco já está rodando
            result = self.run_command(
                "docker compose -f docker.compose.yml ps db --format json",
                cwd=self.project_root, check=False
            )

            if result.returncode == 0 and result.stdout:
                try:
                    containers = [json.loads(line) for line in result.stdout.strip().split('\n') if line]
                    running = any(c.get('State') == 'running' for c in containers)

                    if running:
                        self.print_colored("✅ Banco de dados já está rodando", "green")
                        return
                except json.JSONDecodeError:
                    pass

            # Inicia banco
            self.run_command(
                "docker compose -f docker.compose.yml up -d db",
                cwd=self.project_root
            )

            self.print_colored("✅ Banco de dados iniciado", "green")
            self.print_colored("⏳ Aguardando banco ficar disponível...", "yellow")
            time.sleep(8)

        except Exception as e:
            self.print_colored(f"❌ Erro ao iniciar banco: {e}", "red")
            sys.exit(1)

    def run_migrations(self, skip=False):
        """Executa migrações"""
        if skip:
            self.print_colored("⏭️  Pulando migrações", "yellow")
            return

        self.print_colored("🔄 Executando migrações...", "yellow")

        try:
            # Windows PowerShell
            if os.name == 'nt':
                self.run_command(
                    'powershell.exe -ExecutionPolicy Bypass -File ".\\migrate.ps1"',
                    cwd=self.project_root
                )
            # Unix/Linux
            else:
                self.run_command("./migrate.sh", cwd=self.project_root)

            self.print_colored("✅ Migrações executadas", "green")

        except Exception as e:
            self.print_colored(f"❌ Erro nas migrações: {e}", "red")
            sys.exit(1)

    def start_api(self):
        """Inicia API"""
        self.print_colored("⚡ Iniciando API (FastAPI)...", "yellow")

        try:
            # Verifica se API já está rodando
            result = self.run_command(
                "docker compose -f docker.compose.yml ps api --format json",
                cwd=self.project_root, check=False
            )

            if result.returncode == 0 and result.stdout:
                try:
                    containers = [json.loads(line) for line in result.stdout.strip().split('\n') if line]
                    running = any(c.get('State') == 'running' for c in containers)

                    if running:
                        self.print_colored("🔄 Reiniciando API...", "yellow")
                        self.run_command(
                            "docker compose -f docker.compose.yml restart api",
                            cwd=self.project_root
                        )
                    else:
                        self.run_command(
                            "docker compose -f docker.compose.yml up -d api",
                            cwd=self.project_root
                        )
                except json.JSONDecodeError:
                    self.run_command(
                        "docker compose -f docker.compose.yml up -d api",
                        cwd=self.project_root
                    )
            else:
                self.run_command(
                    "docker compose -f docker.compose.yml up -d api",
                    cwd=self.project_root
                )

            self.print_colored("✅ API iniciada (http://localhost:8000)", "green")

        except Exception as e:
            self.print_colored(f"❌ Erro ao iniciar API: {e}", "red")
            sys.exit(1)

    def start_webapp(self):
        """Inicia aplicação web"""
        self.print_colored("🌐 Iniciando aplicação web (Next.js)...", "yellow")

        try:
            if os.name == 'nt':
                # Windows
                cmd = f'start "Next.js Dev" cmd /k "cd /d {self.web_path} && echo 🌐 Next.js Dev Server && pnpm dev"'
            else:
                # Unix/Linux
                cmd = f'gnome-terminal --title="Next.js Dev" -- bash -c "cd {self.web_path} && echo 🌐 Next.js Dev Server && pnpm dev; exec bash"'

            subprocess.Popen(cmd, shell=True, cwd=self.web_path)
            time.sleep(3)

            self.print_colored("✅ Web app iniciada (http://localhost:3000)", "green")

        except Exception as e:
            self.print_colored(f"❌ Erro ao iniciar web app: {e}", "red")
            sys.exit(1)

    def start_storybook(self):
        """Inicia Storybook"""
        self.print_colored("📚 Iniciando Storybook...", "yellow")

        try:
            if os.name == 'nt':
                # Windows
                cmd = f'start "Storybook" cmd /k "cd /d {self.web_path} && echo 📚 Storybook Dev Server && pnpm storybook"'
            else:
                # Unix/Linux
                cmd = f'gnome-terminal --title="Storybook" -- bash -c "cd {self.web_path} && echo 📚 Storybook Dev Server && pnpm storybook; exec bash"'

            subprocess.Popen(cmd, shell=True, cwd=self.web_path)
            time.sleep(3)

            self.print_colored("✅ Storybook iniciado (http://localhost:6006)", "green")

        except Exception as e:
            self.print_colored(f"❌ Erro ao iniciar Storybook: {e}", "red")
            # Não falha, Storybook é opcional

    def show_status(self, include_storybook=False):
        """Mostra status final"""
        print()
        self.print_colored("🎉 Lifecalling iniciado com sucesso!", "green")
        print()
        self.print_colored("📱 URLs disponíveis:", "cyan")
        print("  • API (FastAPI):     http://localhost:8000")
        print("  • Docs (Swagger):    http://localhost:8000/docs")
        print("  • Web App (Next.js): http://localhost:3000")
        if include_storybook:
            print("  • Storybook:         http://localhost:6006")
        print()
        self.print_colored("🛠️  Comandos úteis:", "yellow")
        print("  • Ver logs API:      docker compose -f docker.compose.yml logs api -f")
        print("  • Parar tudo:        docker compose -f docker.compose.yml stop")
        print("  • Reiniciar API:     docker compose -f docker.compose.yml restart api")
        print()
        self.print_colored("💡 Dica: Os dados do banco são preservados entre execuções", "green")
        print("    Para reset completo, use: docker compose -f docker.compose.yml down -v")
        print()

    def stop_services(self):
        """Para serviços"""
        print()
        self.print_colored("⏹️  Parando serviços...", "yellow")
        try:
            self.run_command(
                "docker compose -f docker.compose.yml stop api",
                cwd=self.project_root
            )
            self.print_colored("✅ Serviços parados (banco e dados preservados)", "green")
        except:
            pass

def main():
    parser = argparse.ArgumentParser(description="Lifecalling - Script de Desenvolvimento Otimizado")
    parser.add_argument("--skip-migrations", action="store_true", help="Pula execução das migrações")
    parser.add_argument("--storybook", action="store_true", help="Inicia também o Storybook")

    args = parser.parse_args()

    dev = LifecallingDev()

    try:
        dev.print_colored("🚀 Iniciando Lifecalling (Modo Desenvolvimento)", "green")
        print()

        dev.clear_ports(args.storybook)
        dev.start_database()
        dev.run_migrations(args.skip_migrations)
        dev.start_api()
        dev.start_webapp()

        if args.storybook:
            dev.start_storybook()

        dev.show_status(args.storybook)

        dev.print_colored("✋ Pressione Enter para parar os serviços...", "yellow")
        input()

    except KeyboardInterrupt:
        pass
    except Exception as e:
        dev.print_colored(f"❌ Erro durante inicialização: {e}", "red")
        sys.exit(1)
    finally:
        dev.stop_services()

if __name__ == "__main__":
    main()