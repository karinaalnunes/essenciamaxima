-- Adicionar colunas para relatório gerado na anamnese
ALTER TABLE public.organizational_anamnesis
ADD COLUMN diagnostic_report TEXT,
ADD COLUMN report_generated_at TIMESTAMPTZ;