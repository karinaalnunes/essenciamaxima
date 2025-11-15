-- Create value_chain_documents table
CREATE TABLE value_chain_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  anamnesis_id UUID REFERENCES organizational_anamnesis(id),
  
  -- Conversation
  conversation_history JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'mapping' CHECK (status IN ('mapping', 'completed')),
  
  -- Consolidated Data (generated at the end)
  activities JSONB DEFAULT '[]'::jsonb,
  maturity_summary JSONB,
  investment_summary JSONB,
  emotional_summary JSONB,
  value_matrix JSONB,
  top_priorities JSONB,
  recommendations JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE value_chain_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create own value chain documents"
  ON value_chain_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own value chain documents"
  ON value_chain_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own value chain documents"
  ON value_chain_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own value chain documents"
  ON value_chain_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_value_chain_documents_updated_at
  BEFORE UPDATE ON value_chain_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();