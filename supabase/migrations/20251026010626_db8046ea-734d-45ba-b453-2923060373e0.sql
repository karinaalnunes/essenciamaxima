-- Adicionar flag is_admin na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Tabela: ai_usage_logs (rastreia chamadas de IA)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL CHECK (module IN ('mvv', 'cultura')),
  function_name TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  latency_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_module ON ai_usage_logs(module);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

-- Tabela: lead_events (rastreia eventos de captura de leads)
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('captured', 'converted', 'abandoned')),
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_email ON lead_events(email);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);

-- Tabela: conversation_metrics (rastreia métricas de conversas)
CREATE TABLE IF NOT EXISTS conversation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID,
  module TEXT NOT NULL CHECK (module IN ('mvv', 'cultura')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,
  total_messages INTEGER DEFAULT 0,
  total_duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_metrics_user_id ON conversation_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_module ON conversation_metrics(module);
CREATE INDEX IF NOT EXISTS idx_conversation_metrics_status ON conversation_metrics(status);

-- Tabela: purchases (rastreia compras/vendas)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('essencia_maxima', 'mvv_premium', 'cultura_premium')),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- RLS Policies para ai_usage_logs
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all ai usage logs"
  ON ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies para lead_events
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all lead events"
  ON lead_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Anyone can insert lead events"
  ON lead_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies para conversation_metrics
ALTER TABLE conversation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation metrics"
  ON conversation_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversation metrics"
  ON conversation_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversation metrics"
  ON conversation_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all conversation metrics"
  ON conversation_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- RLS Policies para purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all purchases"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger para atualizar updated_at em purchases
CREATE OR REPLACE FUNCTION update_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_purchases_updated_at_trigger
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_purchases_updated_at();

-- Função auxiliar: Taxa de conclusão MVV
CREATE OR REPLACE FUNCTION get_mvv_completion_rate()
RETURNS TABLE(
  total INTEGER,
  completed INTEGER,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total,
    COUNT(CASE WHEN mission IS NOT NULL AND vision IS NOT NULL THEN 1 END)::INTEGER AS completed,
    ROUND(
      COUNT(CASE WHEN mission IS NOT NULL AND vision IS NOT NULL THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) AS completion_rate
  FROM mvv_documents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar: Taxa de conclusão Cultura
CREATE OR REPLACE FUNCTION get_culture_completion_rate()
RETURNS TABLE(
  total INTEGER,
  completed INTEGER,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total,
    COUNT(CASE WHEN cultural_essence IS NOT NULL THEN 1 END)::INTEGER AS completed,
    ROUND(
      COUNT(CASE WHEN cultural_essence IS NOT NULL THEN 1 END)::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 
      2
    ) AS completion_rate
  FROM culture_documents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;