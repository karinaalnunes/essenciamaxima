-- Tabela de códigos de recuperação de senha
CREATE TABLE password_reset_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_password_reset_email ON password_reset_codes(email);
CREATE INDEX idx_password_reset_expires ON password_reset_codes(expires_at);

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Tabela de logs de WhatsApp
CREATE TABLE whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT DEFAULT 'twilio',
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_whatsapp_logs_user ON whatsapp_logs(user_id);
CREATE INDEX idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX idx_whatsapp_logs_type ON whatsapp_logs(type);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all whatsapp logs"
  ON whatsapp_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own whatsapp logs"
  ON whatsapp_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Tabela de logs de email
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_type ON email_logs(type);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all email logs"
  ON email_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Função para resetar senha com código
CREATE OR REPLACE FUNCTION public.reset_user_password_with_code(
  user_email TEXT,
  reset_code TEXT,
  new_password TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid_code password_reset_codes;
  target_user_id UUID;
BEGIN
  -- Validar código
  SELECT * INTO valid_code
  FROM password_reset_codes
  WHERE email = user_email
    AND code = reset_code
    AND expires_at > now()
    AND used_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF valid_code IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido ou expirado');
  END IF;

  -- Buscar user_id
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Atualizar senha
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;

  -- Marcar código como usado
  UPDATE password_reset_codes
  SET used_at = now()
  WHERE id = valid_code.id;

  RETURN jsonb_build_object('success', true);
END;
$$;