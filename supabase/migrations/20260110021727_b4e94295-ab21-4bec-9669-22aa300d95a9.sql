-- =============================================
-- CRM ESSÊNCIA MÁXIMA - Tabelas e Triggers
-- =============================================

-- Tabela principal do CRM
CREATE TABLE public.company_crm (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mvv_document_id UUID NOT NULL UNIQUE REFERENCES public.mvv_documents(id) ON DELETE CASCADE,
  pipeline_stage TEXT NOT NULL DEFAULT 'lead' CHECK (pipeline_stage IN ('lead', 'essencia_andamento', 'essencia_concluida', 'contato_qualificado', 'proposta_aberta', 'cliente_ativo', 'arquivado')),
  access_type TEXT NOT NULL DEFAULT 'free_strategic' CHECK (access_type IN ('free_strategic', 'paid', 'paid_coupon', 'admin')),
  free_strategic_reason TEXT,
  pillar_structure_status TEXT DEFAULT 'na' CHECK (pillar_structure_status IN ('na', 'recommended', 'contracted', 'in_progress', 'completed')),
  pillar_governance_status TEXT DEFAULT 'na' CHECK (pillar_governance_status IN ('na', 'alert', 'talking', 'contracted')),
  pillar_council_status TEXT DEFAULT 'future',
  admin_notes TEXT,
  evolution_hypothesis JSONB DEFAULT '{}'::jsonb,
  next_action TEXT,
  next_action_date DATE,
  city TEXT,
  state TEXT,
  coupon_used TEXT,
  partner_origin TEXT,
  contacted_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de histórico de ações do admin
CREATE TABLE public.crm_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  crm_id UUID NOT NULL REFERENCES public.company_crm(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('stage_change', 'note_added', 'contact_made', 'proposal_sent', 'status_update', 'action_set')),
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.company_crm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activity_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para company_crm (apenas admins)
CREATE POLICY "Admins can view all CRM records"
ON public.company_crm FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert CRM records"
ON public.company_crm FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update CRM records"
ON public.company_crm FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete CRM records"
ON public.company_crm FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para crm_activity_log (apenas admins)
CREATE POLICY "Admins can view all activity logs"
ON public.crm_activity_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert activity logs"
ON public.crm_activity_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_company_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_company_crm_updated_at
BEFORE UPDATE ON public.company_crm
FOR EACH ROW EXECUTE FUNCTION update_company_crm_updated_at();

-- Trigger para auto-criar registro CRM quando MVV é criado
CREATE OR REPLACE FUNCTION create_crm_on_mvv_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_crm (mvv_document_id, pipeline_stage)
  VALUES (NEW.id, 'lead')
  ON CONFLICT (mvv_document_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_crm_on_mvv
AFTER INSERT ON public.mvv_documents
FOR EACH ROW EXECUTE FUNCTION create_crm_on_mvv_insert();

-- Migrar MVV documents existentes para o CRM
INSERT INTO public.company_crm (mvv_document_id, pipeline_stage)
SELECT 
  id,
  CASE 
    WHEN mission IS NOT NULL AND vision IS NOT NULL THEN 'essencia_concluida'
    WHEN mission IS NOT NULL OR vision IS NOT NULL THEN 'essencia_andamento'
    ELSE 'lead'
  END
FROM public.mvv_documents
ON CONFLICT (mvv_document_id) DO NOTHING;

-- Índices para performance
CREATE INDEX idx_company_crm_pipeline_stage ON public.company_crm(pipeline_stage);
CREATE INDEX idx_company_crm_access_type ON public.company_crm(access_type);
CREATE INDEX idx_crm_activity_log_crm_id ON public.crm_activity_log(crm_id);
CREATE INDEX idx_crm_activity_log_created_at ON public.crm_activity_log(created_at DESC);