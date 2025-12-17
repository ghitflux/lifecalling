"""
Script SQL para adicionar índices de performance
Execute diretamente no banco se a migração Alembic falhar
"""

SQL_INDEXES = """
-- Índices para mobile_simulations
CREATE INDEX IF NOT EXISTS ix_mobile_simulations_user_id ON mobile_simulations(user_id);
CREATE INDEX IF NOT EXISTS ix_mobile_simulations_status ON mobile_simulations(status);
CREATE INDEX IF NOT EXISTS ix_mobile_simulations_created_at ON mobile_simulations(created_at DESC);

-- Índice para users
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);

-- Mostrar resultados
SELECT 'Índices criados com sucesso!' as resultado;
"""

if __name__ == "__main__":
    print("SQL para criar índices de performance:")
    print(SQL_INDEXES)
    
    # Executar
    from app.db import SessionLocal
    db = SessionLocal()
    
    try:
        db.execute(SQL_INDEXES)
        db.commit()
        print("\n✅ Índices criados com sucesso!")
    except Exception as e:
        print(f"\n⚠️  Erro (provavelmente já existem): {e}")
    finally:
        db.close()
