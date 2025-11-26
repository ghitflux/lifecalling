"""
Script para atualizar senhas de todos os usuários do sistema
"""
import sys
import os

# Adicionar o diretório app ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db import SessionLocal
from app.models import User
from app.security import hash_password

# Mapeamento de emails e senhas fornecido pelo usuário
USERS_PASSWORDS = {
    "admin@lifecalling.com": "Admin@2025",
    "calc2@lifecalling.com": "Calc2@2025",
    "fechamento@lifecalling.com": "Fechamento@2025",
    "calculista@lifecalling.com": "Calculista@2025",
    "atendente1@lifecalling.com": "Atend1@2025",
    "atendente2@lifecalling.com": "Atend2@2025",
    "atendente3@lifecalling.com": "Atend3@2025",
    "atendente4@lifecalling.com": "Atend4@2025",
    "atendente5@lifecalling.com": "Atend5@2025",
    "atendente6@lifecalling.com": "Atend6@2025",
    "atendente7@lifecalling.com": "Atend7@2025",
    "financeiro@lifecalling.com": "Financeiro@2025",
    "atendente8@lifecalling.com": "Atend8@2025",
    "balcao@lifecalling.com": "Balcao@2025",
    "carolinda33.11@gmail.com": "Carolinda@2025",
    "flaviamacedoc@hotmail.com": "Flavia@2025",
    "peltson@gmail.com": "Peltson@2025",
    "phb@lifecalling.com": "PHB@2025",
    "vanessa@lifedigital.com": "Vanessa@2025",
    "wfws@gmail.com": "WFWS@2025",
}

def list_users():
    """Lista todos os usuários do banco de dados"""
    print("\n" + "="*80)
    print("USUÁRIOS NO BANCO DE DADOS")
    print("="*80)

    with SessionLocal() as db:
        users = db.query(User).order_by(User.id).all()

        if not users:
            print("❌ Nenhum usuário encontrado no banco de dados!")
            return []

        print(f"\nTotal de usuários: {len(users)}\n")

        for user in users:
            status = "✓ ATIVO" if user.active else "✗ INATIVO"
            has_new_password = "✓" if user.email in USERS_PASSWORDS else "✗"
            print(f"[{user.id:2d}] {status} | Nova senha: {has_new_password} | {user.email:40s} | {user.name:30s} | Role: {user.role}")

        return users

def update_passwords():
    """Atualiza as senhas de todos os usuários"""
    print("\n" + "="*80)
    print("ATUALIZANDO SENHAS")
    print("="*80 + "\n")

    updated_count = 0
    not_found_count = 0
    skipped_count = 0

    with SessionLocal() as db:
        for email, password in USERS_PASSWORDS.items():
            user = db.query(User).filter(User.email == email).first()

            if not user:
                print(f"⚠️  Usuário não encontrado no banco: {email}")
                not_found_count += 1
                continue

            # Atualiza a senha
            new_hash = hash_password(password)
            user.password_hash = new_hash

            print(f"✓ Senha atualizada: {email:40s} | {user.name}")
            updated_count += 1

        # Commit das alterações
        db.commit()
        print(f"\n{'='*80}")
        print(f"RESUMO:")
        print(f"  ✓ Senhas atualizadas: {updated_count}")
        print(f"  ⚠️  Usuários não encontrados: {not_found_count}")
        print(f"  → Usuários pulados: {skipped_count}")
        print(f"{'='*80}\n")

def main():
    """Função principal"""
    print("\n" + "="*80)
    print("SCRIPT DE ATUALIZAÇÃO DE SENHAS - LIFECALLING")
    print("="*80)

    # Verificar se foi passado --force
    force = "--force" in sys.argv or "-f" in sys.argv

    try:
        # 1. Listar usuários
        users = list_users()

        if not users:
            print("\n❌ Não há usuários no banco de dados!")
            return

        # 2. Confirmar atualização
        print(f"\n{'='*80}")
        print("⚠️  ATENÇÃO: Este script irá atualizar as senhas de {0} usuários!".format(len(USERS_PASSWORDS)))
        print("="*80)

        if not force:
            resposta = input("\nDeseja continuar? (sim/não): ").strip().lower()

            if resposta not in ['sim', 's', 'yes', 'y']:
                print("\n❌ Operação cancelada pelo usuário.")
                return
        else:
            print("\n⚠️  Modo --force ativado. Continuando sem confirmação...")

        # 3. Atualizar senhas
        update_passwords()

        print("\n✅ Processo concluído com sucesso!")
        print("\nVocê pode agora testar o login com as novas credenciais.")

    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
