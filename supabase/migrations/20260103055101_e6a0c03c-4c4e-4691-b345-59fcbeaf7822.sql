
-- Create table for anamnesis questions
CREATE TABLE public.anamnesis_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 7),
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'number', 'boolean', 'microchat', 'rating')),
  label TEXT NOT NULL,
  placeholder TEXT,
  options JSONB, -- For selects: [{value: "...", label: "..."}]
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL,
  microchat_prompt TEXT, -- For MicroChat fields
  is_core BOOLEAN DEFAULT true, -- true = maps to existing column, false = goes to extra_fields
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_key)
);

-- Add extra_fields column to organizational_anamnesis for custom questions
ALTER TABLE public.organizational_anamnesis 
ADD COLUMN IF NOT EXISTS extra_fields JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE public.anamnesis_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage anamnesis questions"
ON public.anamnesis_questions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active questions"
ON public.anamnesis_questions FOR SELECT
USING (auth.uid() IS NOT NULL AND active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_anamnesis_questions_updated_at
BEFORE UPDATE ON public.anamnesis_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all existing questions
-- Step 1: Cabeçalho
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(1, 'company_name', 'text', 'Nome da empresa', 'Ex: Máxima IA', NULL, true, 1, NULL, true),
(1, 'owner_name', 'text', 'Nome do proprietário principal', 'Seu nome completo', NULL, true, 2, NULL, true),
(1, 'owner_position', 'text', 'Sua posição na empresa', 'Ex: CEO, Sócio-Diretor', NULL, true, 3, NULL, true),
(1, 'segment', 'text', 'Segmento / Ramo de atividade', 'Ex: Tecnologia, Varejo, Serviços', NULL, true, 4, NULL, true),
(1, 'employees_count', 'number', 'Nº de colaboradores', '0', NULL, false, 5, NULL, true),
(1, 'leaders_count', 'number', 'Nº de líderes', '0', NULL, false, 6, NULL, true),
(1, 'company_size', 'select', 'Porte da empresa', 'Selecione o porte', '[{"value":"MEI","label":"MEI"},{"value":"ME","label":"ME - Microempresa"},{"value":"EPP","label":"EPP - Empresa de Pequeno Porte"},{"value":"Médio","label":"Médio Porte"},{"value":"Grande","label":"Grande Porte"}]'::jsonb, false, 7, NULL, true);

-- Step 2: História
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(2, 'business_origin', 'select', 'Como o negócio começou?', 'Selecione', '[{"value":"fundado","label":"Fundado por mim"},{"value":"herdado","label":"Herdado"},{"value":"adquirido","label":"Adquirido"}]'::jsonb, false, 1, NULL, true),
(2, 'founding_motivation', 'microchat', 'O que motivou você a assumir ou fundar essa empresa?', 'Compartilhe sua história...', NULL, false, 2, 'Você é um consultor estratégico fazendo anamnese empresarial. Faça follow-ups empáticos e consultivos sobre a motivação do empresário.', true),
(2, 'products_services_description', 'textarea', 'Produtos/serviços que oferece', 'Descreva brevemente...', NULL, false, 3, NULL, true),
(2, 'legal_structure', 'select', 'Estrutura legal atual', 'Selecione', '[{"value":"Simples Nacional","label":"Simples Nacional"},{"value":"Lucro Presumido","label":"Lucro Presumido"},{"value":"Lucro Real","label":"Lucro Real"},{"value":"Não sei","label":"Não sei"}]'::jsonb, false, 4, NULL, true),
(2, 'annual_revenue_range', 'select', 'Receita anual aproximada', 'Selecione uma faixa', '[{"value":"Até R$ 360 mil","label":"Até R$ 360 mil"},{"value":"R$ 360 mil - R$ 4,8 milhões","label":"R$ 360 mil - R$ 4,8 milhões"},{"value":"R$ 4,8 milhões - R$ 300 milhões","label":"R$ 4,8 milhões - R$ 300 milhões"},{"value":"Acima de R$ 300 milhões","label":"Acima de R$ 300 milhões"}]'::jsonb, false, 5, NULL, true),
(2, 'main_sales_channels', 'textarea', 'Principais canais de venda', 'Ex: Loja física, e-commerce, representantes...', NULL, false, 6, NULL, true);

-- Step 3: Estrutura
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(3, 'has_organogram', 'select', 'Você já tem um organograma definido?', 'Selecione', '[{"value":"sim","label":"Sim"},{"value":"parcial","label":"Parcial"},{"value":"não","label":"Não"}]'::jsonb, false, 1, NULL, true),
(3, 'outsourced_functions', 'textarea', 'Funções terceirizadas essenciais', 'Ex: contabilidade, jurídico, marketing, TI...', NULL, false, 2, NULL, true),
(3, 'satisfied_with_partners', 'select', 'Está satisfeito com esses parceiros?', 'Selecione', '[{"value":"sim","label":"Sim"},{"value":"parcial","label":"Parcialmente"},{"value":"não","label":"Não"}]'::jsonb, false, 3, NULL, true);

-- Step 4: Liderança
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(4, 'leadership_clarity', 'microchat', 'Você tem clareza sobre a direção geral da sua empresa?', 'Compartilhe sua visão...', NULL, false, 1, 'Você é um consultor estratégico. Se o empresário demonstrar falta de clareza, faça perguntas aprofundadas sobre o que falta para ter essa direção definida.', true),
(4, 'self_leadership_rating', 'rating', 'Como você se avalia como líder? (1-10)', '1-10', NULL, false, 2, NULL, true),
(4, 'self_leadership_reason', 'text', 'Por quê? (avaliação de liderança)', 'Por quê?', NULL, false, 3, NULL, true),
(4, 'team_understands_vision', 'select', 'Sua equipe entende a visão da empresa?', 'Selecione', '[{"value":"sim","label":"Sim"},{"value":"parcial","label":"Parcialmente"},{"value":"não","label":"Não"}]'::jsonb, false, 4, NULL, true),
(4, 'people_management_challenges', 'textarea', 'Maiores desafios na gestão de pessoas (até 3)', 'Liste os principais desafios...', NULL, false, 5, NULL, true);

-- Step 5: Finanças
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(5, 'finances_separated', 'boolean', 'Finanças pessoais e da empresa estão:', NULL, '[{"value":"true","label":"Separadas"},{"value":"false","label":"Misturadas"}]'::jsonb, false, 1, NULL, true),
(5, 'has_budget_and_cash_planning', 'select', 'Possui orçamento e planejamento de caixa?', 'Selecione', '[{"value":"sim","label":"Sim"},{"value":"parcial","label":"Parcialmente"},{"value":"não","label":"Não"}]'::jsonb, false, 2, NULL, true),
(5, 'tracked_financial_metrics', 'textarea', 'Principais métricas financeiras que acompanha', 'Ex: faturamento, lucro líquido, margem...', NULL, false, 3, NULL, true),
(5, 'finance_tracking_method', 'text', 'Como acompanha as finanças hoje?', 'Ex: sistema ERP, planilhas, software específico...', NULL, false, 4, NULL, true),
(5, 'financial_literacy_rating', 'rating', 'Capacidade de entender relatórios financeiros (1-10)', '1-10', NULL, false, 5, NULL, true);

-- Step 6: Clientes
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(6, 'ideal_customer_profile', 'textarea', 'Quem é o seu cliente ideal?', 'Descreva o perfil do seu cliente ideal...', NULL, false, 1, NULL, true),
(6, 'why_customers_buy', 'textarea', 'Por que eles compram de você?', 'Qual o diferencial que atrai seus clientes?', NULL, false, 2, NULL, true),
(6, 'sales_challenges', 'textarea', 'Maiores desafios em vendas ou atração de clientes', 'Liste os principais desafios...', NULL, false, 3, NULL, true),
(6, 'tracks_sales_funnel', 'select', 'Acompanha o funil de vendas?', 'Selecione', '[{"value":"sim","label":"Sim"},{"value":"não","label":"Não"}]'::jsonb, false, 4, NULL, true);

-- Step 7: Direção
INSERT INTO public.anamnesis_questions (step_number, field_key, field_type, label, placeholder, options, is_required, display_order, microchat_prompt, is_core) VALUES
(7, 'vision_3_5_years', 'textarea', 'Onde gostaria que a empresa estivesse em 3-5 anos?', 'Descreva sua visão de futuro...', NULL, false, 1, NULL, true),
(7, 'main_goal_12_months', 'textarea', 'Objetivo mais importante para os próximos 12 meses', 'Qual é a prioridade número 1?', NULL, false, 2, NULL, true),
(7, 'main_frustrations', 'textarea', 'Suas maiores frustrações como empresário (até 3)', 'Seja honesto sobre o que mais te frustra...', NULL, false, 3, NULL, true),
(7, 'innovation_readiness', 'microchat', 'Quão preparada sua empresa está para inovar e se adaptar?', 'Reflita sobre a capacidade de inovação...', NULL, false, 4, 'Você é um consultor estratégico. Explore a prontidão da empresa para mudanças e inovação. Pergunte sobre resistências e apoiadores.', true);
