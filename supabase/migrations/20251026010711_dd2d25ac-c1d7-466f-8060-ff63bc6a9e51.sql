-- Corrigir warnings de segurança: adicionar search_path nas funções

-- Recriar função update_purchases_updated_at com search_path
DROP TRIGGER IF EXISTS update_purchases_updated_at_trigger ON purchases;
DROP FUNCTION IF EXISTS update_purchases_updated_at();

CREATE OR REPLACE FUNCTION update_purchases_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_purchases_updated_at_trigger
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_purchases_updated_at();

-- Recriar função get_mvv_completion_rate com search_path
DROP FUNCTION IF EXISTS get_mvv_completion_rate();

CREATE OR REPLACE FUNCTION get_mvv_completion_rate()
RETURNS TABLE(
  total INTEGER,
  completed INTEGER,
  completion_rate NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recriar função get_culture_completion_rate com search_path
DROP FUNCTION IF EXISTS get_culture_completion_rate();

CREATE OR REPLACE FUNCTION get_culture_completion_rate()
RETURNS TABLE(
  total INTEGER,
  completed INTEGER,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;