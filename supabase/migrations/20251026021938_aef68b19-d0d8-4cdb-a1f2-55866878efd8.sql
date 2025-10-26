-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Configure karinanunes.oficial@gmail.com as admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('2bfa9d8d-15eb-4f6b-b2d9-408a40762f4f', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update RLS policies for ai_usage_logs
DROP POLICY IF EXISTS "Admin can view all ai usage logs" ON ai_usage_logs;
CREATE POLICY "Admin can view all ai usage logs"
  ON ai_usage_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for lead_events
DROP POLICY IF EXISTS "Admin can view all lead events" ON lead_events;
CREATE POLICY "Admin can view all lead events"
  ON lead_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for conversation_metrics
DROP POLICY IF EXISTS "Admin can view all conversation metrics" ON conversation_metrics;
CREATE POLICY "Admin can view all conversation metrics"
  ON conversation_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for purchases
DROP POLICY IF EXISTS "Admin can view all purchases" ON purchases;
CREATE POLICY "Admin can view all purchases"
  ON purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for leads
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert leads" ON leads;
CREATE POLICY "Admins can insert leads"
  ON leads FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update leads" ON leads;
CREATE POLICY "Admins can update leads"
  ON leads FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete leads" ON leads;
CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_roles table
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Drop is_admin column from profiles if exists
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;