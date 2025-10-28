-- Criar tabela organizational_anamnesis para Anamnese Máxima
CREATE TABLE public.organizational_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mvv_document_id UUID REFERENCES public.mvv_documents(id) ON DELETE SET NULL,
  
  -- CABEÇALHO (Capa)
  company_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_position TEXT NOT NULL,
  has_partners BOOLEAN DEFAULT false,
  partners_count INTEGER,
  partners_equity_division TEXT,
  partners_equity_practice TEXT,
  partners_work_in_company BOOLEAN,
  partners_positions TEXT,
  partners_as_investors BOOLEAN,
  partners_strategic_relevance BOOLEAN,
  segment TEXT NOT NULL,
  is_potential_importer BOOLEAN DEFAULT false,
  employees_count INTEGER,
  leaders_count INTEGER,
  branches_count INTEGER DEFAULT 1,
  company_size TEXT, -- MEI, ME, EPP, etc
  
  -- BLOCO 1: História e Contexto
  business_origin TEXT, -- fundado, herdado, adquirido
  business_origin_date TEXT,
  founding_motivation TEXT,
  products_services_description TEXT,
  import_challenges TEXT, -- se is_potential_importer = true
  legal_structure TEXT, -- Simples, Lucro Presumido, Lucro Real
  annual_revenue_range TEXT,
  main_sales_channels TEXT,
  
  -- BLOCO 2: Estrutura e Apoios
  has_organogram TEXT, -- sim/não/parcial
  outsourced_functions TEXT,
  satisfied_with_partners TEXT, -- sim/não/parcial
  
  -- BLOCO 3: Liderança e Pessoas
  leadership_clarity TEXT, -- sim/não/parcial
  leadership_clarity_details TEXT, -- se não/parcial
  self_leadership_rating INTEGER CHECK (self_leadership_rating >= 1 AND self_leadership_rating <= 10),
  self_leadership_reason TEXT,
  team_understands_vision TEXT, -- sim/não/parcial
  team_understands_roles TEXT, -- sim/não/parcial
  people_management_challenges TEXT, -- até 3
  team_satisfaction TEXT, -- sim/não/parcial
  leader_satisfaction_with_team TEXT, -- sim/não/parcial
  would_not_rehire TEXT,
  communication_style TEXT,
  meeting_routine TEXT,
  
  -- BLOCO 4: Finanças
  finances_separated BOOLEAN,
  has_budget_and_cash_planning TEXT, -- sim/não/parcial
  all_transactions_registered BOOLEAN,
  tracked_financial_metrics TEXT,
  finance_tracking_method TEXT,
  satisfied_with_system TEXT, -- sim/não/parcial
  financial_literacy_rating INTEGER CHECK (financial_literacy_rating >= 1 AND financial_literacy_rating <= 10),
  financial_literacy_reason TEXT,
  
  -- BLOCO 5: Clientes e Mercado
  ideal_customer_profile TEXT,
  why_customers_buy TEXT,
  has_loyal_customers TEXT, -- sim/não/parcial
  sales_challenges TEXT,
  tracks_sales_funnel TEXT, -- sim/não
  sales_funnel_tracking_method TEXT,
  tracks_sales_performance TEXT, -- sim/não
  sales_performance_tracking_method TEXT,
  
  -- BLOCO 6: Direção, Inovação e Inspiração
  vision_3_5_years TEXT,
  main_goal_12_months TEXT,
  personal_goals_reflection TEXT,
  main_frustrations TEXT, -- até 3
  main_inspiration TEXT,
  innovation_readiness TEXT, -- escala ou texto
  team_resistance_to_change TEXT,
  change_supporters TEXT,
  change_resistors TEXT,
  
  -- METADADOS
  status TEXT DEFAULT 'draft', -- draft, completed
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizational_anamnesis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own anamnesis"
  ON public.organizational_anamnesis
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own anamnesis"
  ON public.organizational_anamnesis
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own anamnesis"
  ON public.organizational_anamnesis
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own anamnesis"
  ON public.organizational_anamnesis
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes para performance
CREATE INDEX idx_organizational_anamnesis_user_id ON public.organizational_anamnesis(user_id);
CREATE INDEX idx_organizational_anamnesis_status ON public.organizational_anamnesis(status);
CREATE INDEX idx_organizational_anamnesis_mvv_document_id ON public.organizational_anamnesis(mvv_document_id);

-- Trigger para updated_at
CREATE TRIGGER update_organizational_anamnesis_updated_at
  BEFORE UPDATE ON public.organizational_anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.organizational_anamnesis IS 
'Anamnese Máxima: diagnóstico consultivo inicial da empresa antes do Código de Cultura';