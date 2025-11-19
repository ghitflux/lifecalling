-- Migration: Add client_cpf and client_name to finance_incomes table
-- Date: 2025-10-23

ALTER TABLE finance_incomes 
ADD COLUMN IF NOT EXISTS client_cpf VARCHAR(14);

ALTER TABLE finance_incomes 
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

-- Comment
COMMENT ON COLUMN finance_incomes.client_cpf IS 'CPF do cliente (para receitas manuais)';
COMMENT ON COLUMN finance_incomes.client_name IS 'Nome do cliente (para receitas manuais)';
