-- Script para adicionar coluna agent_user_id na tabela finance_incomes
-- Execute este script no PostgreSQL para corrigir o erro

-- Adicionar coluna agent_user_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'finance_incomes'
        AND column_name = 'agent_user_id'
    ) THEN
        ALTER TABLE finance_incomes
        ADD COLUMN agent_user_id INTEGER REFERENCES users(id);

        RAISE NOTICE 'Coluna agent_user_id adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna agent_user_id já existe.';
    END IF;
END $$;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'finance_incomes'
ORDER BY ordinal_position;
