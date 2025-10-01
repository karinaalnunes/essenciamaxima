-- Adicionar novos campos para o relatório completo do Essência Máxima
ALTER TABLE public.mvv_documents
ADD COLUMN IF NOT EXISTS mission_pocket text,
ADD COLUMN IF NOT EXISTS mission_punchline text,
ADD COLUMN IF NOT EXISTS vision_indicators jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS company_context text,
ADD COLUMN IF NOT EXISTS feedback text;