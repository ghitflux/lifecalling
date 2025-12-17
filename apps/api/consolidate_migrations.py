"""
Script para consolidar todas as migrações em uma única migração inicial.
"""
import os
import shutil
from datetime import datetime

def consolidate_migrations():
    """Consolida todas as migrações em uma única migração."""

    migrations_dir = "migrations/versions"
    backup_dir = f"migrations_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    print(f"1. Criando backup em: {backup_dir}")
    if os.path.exists(migrations_dir):
        shutil.copytree(migrations_dir, backup_dir)
        print(f"   Backup criado com sucesso!")

    # Listar todas as migrações atuais
    migrations = []
    if os.path.exists(migrations_dir):
        for file in os.listdir(migrations_dir):
            if file.endswith('.py') and file != '__init__.py':
                migrations.append(file)

    print(f"\n2. Encontradas {len(migrations)} migrações para consolidar:")
    for m in sorted(migrations):
        print(f"   - {m}")

    # Remover todas as migrações antigas
    print(f"\n3. Removendo migrações antigas...")
    for migration in migrations:
        filepath = os.path.join(migrations_dir, migration)
        os.remove(filepath)
        print(f"   Removido: {migration}")

    print("\n4. Agora execute:")
    print("   alembic revision --autogenerate -m 'initial_schema_consolidated'")
    print("\n5. E depois atualize o banco:")
    print("   DELETE FROM alembic_version;")
    print("   alembic upgrade head")

    return backup_dir

if __name__ == "__main__":
    backup = consolidate_migrations()
    print(f"\n✅ Consolidação preparada!")
    print(f"   Backup em: {backup}")
