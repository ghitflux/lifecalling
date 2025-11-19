-- Migration: Add imposto_expense_id to contracts table
-- Created: 2025-01-25
-- Description: Adiciona FK para vincular despesa de imposto ao contrato

-- Add column
ALTER TABLE contracts
ADD COLUMN imposto_expense_id INTEGER;

-- Add foreign key constraint
ALTER TABLE contracts
ADD CONSTRAINT fk_contracts_imposto_expense
FOREIGN KEY (imposto_expense_id)
REFERENCES finance_expenses(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX ix_contracts_imposto_expense_id ON contracts(imposto_expense_id);

-- Verify the change
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'contracts' AND column_name = 'imposto_expense_id';
