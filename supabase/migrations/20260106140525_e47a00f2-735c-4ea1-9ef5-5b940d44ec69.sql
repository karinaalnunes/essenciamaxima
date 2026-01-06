-- =====================================================
-- Security fixes: close public write access + tighten RLS roles
-- =====================================================

-- 1) leads: remove public/anon write policies (use backend function instead)
DROP POLICY IF EXISTS "Anonymous users can submit leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can submit leads" ON public.leads;

-- 2) lead_events: remove open insert policy
DROP POLICY IF EXISTS "Anyone can insert lead events" ON public.lead_events;

-- 3) password_reset_codes: remove open insert policy (use backend function instead)
DROP POLICY IF EXISTS "allow_public_insert_password_reset" ON public.password_reset_codes;

-- 4) organizational_anamnesis: policies should apply to authenticated role (not public)
DROP POLICY IF EXISTS "Users can create own anamnesis" ON public.organizational_anamnesis;
DROP POLICY IF EXISTS "Users can view own anamnesis" ON public.organizational_anamnesis;
DROP POLICY IF EXISTS "Users can update own anamnesis" ON public.organizational_anamnesis;
DROP POLICY IF EXISTS "Users can delete own anamnesis" ON public.organizational_anamnesis;

CREATE POLICY "Users can create own anamnesis"
ON public.organizational_anamnesis
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own anamnesis"
ON public.organizational_anamnesis
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own anamnesis"
ON public.organizational_anamnesis
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own anamnesis"
ON public.organizational_anamnesis
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
