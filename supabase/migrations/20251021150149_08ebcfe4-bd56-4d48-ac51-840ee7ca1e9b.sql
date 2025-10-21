-- Create culture_documents table
CREATE TABLE culture_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mvv_document_id UUID NOT NULL,
  
  -- Metadados
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Identidade e Diferenciação
  reputation_goal TEXT,
  competitive_advantage TEXT,
  swot_strengths JSONB DEFAULT '[]',
  swot_improvements JSONB DEFAULT '[]',
  
  -- Princípios Norteadores
  guiding_principles JSONB DEFAULT '[]',
  
  -- Desenvolvimento Integral
  growth_practices TEXT,
  wellbeing_support TEXT,
  psychological_safety_practices TEXT,
  
  -- Rituais e Práticas
  cultural_rituals JSONB DEFAULT '[]',
  
  -- Relacionamento
  stakeholder_guidelines JSONB DEFAULT '{}',
  
  -- Indicadores de Cultura
  culture_indicators JSONB DEFAULT '[]',
  
  -- Plano de Ação SMART (5W2H estendido)
  action_plan_30 JSONB DEFAULT '[]',
  action_plan_60 JSONB DEFAULT '[]',
  action_plan_90 JSONB DEFAULT '[]',
  action_plan_120 JSONB DEFAULT '[]',
  
  -- Resumo Consultivo
  cultural_essence TEXT,
  cultural_strengths JSONB DEFAULT '[]',
  cultural_challenges JSONB DEFAULT '[]',
  strategic_focus TEXT,
  closing_message TEXT
);

-- Enable RLS
ALTER TABLE culture_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for culture_documents
CREATE POLICY "Users can view own culture documents"
  ON culture_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own culture documents"
  ON culture_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own culture documents"
  ON culture_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own culture documents"
  ON culture_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_culture_documents_updated_at
  BEFORE UPDATE ON culture_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create culture_conversation_history table
CREATE TABLE culture_conversation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  culture_document_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE culture_conversation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for culture_conversation_history
CREATE POLICY "Users can view own culture conversation history"
  ON culture_conversation_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM culture_documents
      WHERE culture_documents.id = culture_conversation_history.culture_document_id
      AND culture_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create culture conversation entries"
  ON culture_conversation_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM culture_documents
      WHERE culture_documents.id = culture_conversation_history.culture_document_id
      AND culture_documents.user_id = auth.uid()
    )
  );