-- Migração: Adicionar tabela password_reset_tokens
-- Data: 2026-01-04
-- Descrição: Tabela para armazenar tokens de recuperação de senha

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo'),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Comentários
COMMENT ON TABLE password_reset_tokens IS 'Tokens de recuperação de senha com expiração de 24 horas';
COMMENT ON COLUMN password_reset_tokens.token IS 'Token único gerado para recuperação';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Data/hora de expiração do token (24 horas após criação)';
COMMENT ON COLUMN password_reset_tokens.used IS 'Flag indicando se o token já foi utilizado';
