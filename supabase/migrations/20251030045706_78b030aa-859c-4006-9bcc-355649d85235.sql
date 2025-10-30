-- Adicionar novos campos ao culture_documents para suportar Código de Cultura Máxima v2.0
ALTER TABLE culture_documents
ADD COLUMN IF NOT EXISTS cultural_positioning TEXT,
ADD COLUMN IF NOT EXISTS value_behaviors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS symbols_language JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS governance JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS stress_dilemmas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS kill_criteria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS rituals_calendar JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS activation_kit JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS report_version_inspirational TEXT,
ADD COLUMN IF NOT EXISTS report_version_technical TEXT;

COMMENT ON COLUMN culture_documents.cultural_positioning IS 'Frase única de posicionamento cultural da empresa';
COMMENT ON COLUMN culture_documents.value_behaviors IS 'Array de objetos: value, expected_behaviors[], anti_behaviors[], observable_signs[], ritual{}, metric{}';
COMMENT ON COLUMN culture_documents.symbols_language IS 'Objeto: expressions[], founding_stories[], cultural_objects[]';
COMMENT ON COLUMN culture_documents.governance IS 'Objeto: guardian (Guardião da Cultura), committee[], annual_review, consequences';
COMMENT ON COLUMN culture_documents.stress_dilemmas IS 'Array de dilemas de estresse: situation, guiding_principle_applied, decision, outcome';
COMMENT ON COLUMN culture_documents.kill_criteria IS 'Array de critérios de rompimento: stakeholder, criterion, exception, owner';
COMMENT ON COLUMN culture_documents.rituals_calendar IS 'Array de 12 meses com rituais planejados';
COMMENT ON COLUMN culture_documents.activation_kit IS 'Objeto: presentation_script, one_on_one_script, pocket_cards[], faqs[]';
COMMENT ON COLUMN culture_documents.report_version_inspirational IS 'Versão inspiradora do relatório (tom motivacional)';
COMMENT ON COLUMN culture_documents.report_version_technical IS 'Versão técnica do relatório (tom executivo)';