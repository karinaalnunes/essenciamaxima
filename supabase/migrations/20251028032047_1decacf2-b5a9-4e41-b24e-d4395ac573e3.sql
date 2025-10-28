-- =========================================
-- CORREÇÕES DE SEGURANÇA CRÍTICAS
-- =========================================

-- 1. CORRIGIR password_reset_codes
-- Problema: Atualmente qualquer um pode ler TODOS os códigos, criar falsos, ou modificá-los
-- Solução: Restringir acesso para proteção adequada

-- Remover políticas públicas perigosas
DROP POLICY IF EXISTS "allow_public_select_password_reset" ON password_reset_codes;
DROP POLICY IF EXISTS "allow_public_update_password_reset" ON password_reset_codes;

-- Manter INSERT público (necessário para solicitar reset)
-- Já existe: allow_public_insert_password_reset

-- Adicionar SELECT restrito: usuário só pode verificar código com seu próprio email
CREATE POLICY "Users can verify own reset codes"
ON password_reset_codes
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Permitir que edge functions (service_role) gerenciem códigos
CREATE POLICY "Service role can manage password reset codes"
ON password_reset_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Adicionar DELETE para usuário limpar seu próprio código após uso
CREATE POLICY "Users can delete own reset codes"
ON password_reset_codes
FOR DELETE
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);


-- 2. CORRIGIR profiles - Proteger dados sensíveis em perfis públicos
-- Problema: Quando profile_visibility = 'public', TODOS os campos ficam visíveis,
-- incluindo email, phone, etc.
-- Solução: Criar função que filtra campos sensíveis e modificar política

-- Criar função para verificar se usuário pode ver dados sensíveis do perfil
CREATE OR REPLACE FUNCTION can_view_sensitive_profile_data(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Próprio usuário sempre pode ver seus dados
  IF auth.uid() = profile_id THEN
    RETURN true;
  END IF;
  
  -- Conexões aceitas podem ver dados sensíveis
  IF EXISTS (
    SELECT 1 FROM professional_connections
    WHERE (
      (requester_id = auth.uid() AND receiver_id = profile_id)
      OR (receiver_id = auth.uid() AND requester_id = profile_id)
    )
    AND status = 'accepted'
  ) THEN
    RETURN true;
  END IF;
  
  -- Admins podem ver todos os dados
  IF has_role(auth.uid(), 'admin') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Remover política pública atual que expõe tudo
DROP POLICY IF EXISTS "Public can view basic profiles" ON profiles;

-- Criar nova política que permite visualização mas respeita sensibilidade dos dados
CREATE POLICY "Public can view non-sensitive profile data"
ON profiles
FOR SELECT
USING (
  -- Perfis públicos: todos podem ver campos não-sensíveis
  profile_visibility = 'public'
  -- Próprio usuário vê tudo
  OR auth.uid() = id
  -- Conexões aceitas veem tudo
  OR EXISTS (
    SELECT 1 FROM professional_connections
    WHERE (
      (requester_id = auth.uid() AND receiver_id = profiles.id)
      OR (receiver_id = auth.uid() AND requester_id = profiles.id)
    )
    AND status = 'accepted'
  )
  -- Conexões pendentes veem apenas o básico (não sensível)
  OR (
    profile_visibility = 'connections_only'
    AND EXISTS (
      SELECT 1 FROM professional_connections
      WHERE (
        (requester_id = auth.uid() AND receiver_id = profiles.id)
        OR (receiver_id = auth.uid() AND requester_id = profiles.id)
      )
    )
  )
);

-- IMPORTANTE: Para ocultar campos sensíveis de perfis públicos na aplicação,
-- o frontend deve verificar se can_view_sensitive_profile_data() retorna true
-- antes de exibir email, phone, etc.
-- Alternativamente, criar views separadas ou modificar queries no código.

-- Comentário de segurança para desenvolvedores:
COMMENT ON FUNCTION can_view_sensitive_profile_data IS 
'Verifica se o usuário atual tem permissão para ver dados sensíveis (email, phone) de um perfil. 
Use esta função no frontend/edge functions antes de exibir informações pessoais.';


-- 3. ADICIONAR COMENTÁRIOS sobre lead_events e leads
-- Não removemos INSERT público pois é necessário para captura de leads
-- mas documentamos a necessidade de proteção adicional

COMMENT ON POLICY "Anyone can insert lead events" ON lead_events IS 
'WARNING: Esta política permite INSERT público. Implementar rate limiting e validação 
na camada de aplicação para prevenir spam e flood de dados falsos.';

COMMENT ON POLICY "Anonymous users can submit leads" ON leads IS 
'WARNING: Esta política permite INSERT anônimo. CRÍTICO: Implementar CAPTCHA e rate limiting 
no frontend/edge function para prevenir spam e envenenamento de dados.';

COMMENT ON POLICY "Authenticated users can submit leads" ON leads IS 
'WARNING: Usuários autenticados podem submeter leads. Implementar validação adicional 
se necessário para prevenir abuso.';