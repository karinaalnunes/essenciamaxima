-- Corrigir search_path das funções criadas
CREATE OR REPLACE FUNCTION public.update_company_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_crm_on_mvv_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.company_crm (mvv_document_id, pipeline_stage)
  VALUES (NEW.id, 'lead')
  ON CONFLICT (mvv_document_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;