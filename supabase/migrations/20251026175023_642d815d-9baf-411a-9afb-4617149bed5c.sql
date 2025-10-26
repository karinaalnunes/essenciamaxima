-- Adicionar coluna phone na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Criar índice para buscas por telefone
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);