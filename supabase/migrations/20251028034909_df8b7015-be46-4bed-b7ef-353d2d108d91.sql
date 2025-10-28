-- Corrigir Security Definer View
-- A view public_profiles não deve ser SECURITY DEFINER
-- Ela deve usar as permissões do usuário que está consultando

-- Recriar a view sem SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true)
AS
SELECT 
  id,
  name,
  company,
  position,
  bio,
  avatar_url,
  logo_url,
  company_website,
  linkedin_company,
  instagram_company,
  facebook_company,
  created_at
FROM profiles
WHERE profile_visibility = 'public';

-- Garantir permissões corretas
GRANT SELECT ON public.public_profiles TO anon, authenticated;

COMMENT ON VIEW public.public_profiles IS 
'View pública (security_invoker) que expõe APENAS dados não-sensíveis de perfis com visibility=public. 
Email, phone e redes sociais pessoais são SEMPRE privados.';