-- =====================================================
-- FIX 1: password_reset_codes - Remover políticas que permitem leitura de códigos
-- Os códigos só devem ser verificados via função server-side (reset_user_password_with_code)
-- =====================================================

-- Remover política que permite usuários autenticados lerem códigos
DROP POLICY IF EXISTS "Users can verify own reset codes" ON public.password_reset_codes;

-- Remover política que permite usuários autenticados deletarem códigos
DROP POLICY IF EXISTS "Users can delete own reset codes" ON public.password_reset_codes;

-- =====================================================
-- FIX 2: profiles - Corrigir políticas para não expor dados sensíveis
-- =====================================================

-- Remover a política que permite SELECT para role 'public' (não autenticados)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Remover a política atual de INSERT para public (deve ser authenticated)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Remover a política atual de UPDATE para public (deve ser authenticated)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Criar política de INSERT para usuários autenticados
CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Criar política de UPDATE para usuários autenticados
CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);