-- Tabela de leads capturados
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  segment TEXT NOT NULL,
  consent_lgpd BOOLEAN NOT NULL DEFAULT false,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode ver todos os leads (vamos criar isso depois quando tivermos auth)
CREATE POLICY "Service role can manage leads" ON public.leads
FOR ALL USING (true);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Tabela de documentos MVV
CREATE TABLE public.mvv_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  segment TEXT NOT NULL,
  company_size TEXT,
  target_audience TEXT,
  purpose TEXT,
  tone_of_voice TEXT,
  desired_values TEXT[],
  mission TEXT,
  vision TEXT,
  values JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mvv_documents ENABLE ROW LEVEL SECURITY;

-- Policies para mvv_documents
CREATE POLICY "Users can view own documents" ON public.mvv_documents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON public.mvv_documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.mvv_documents
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.mvv_documents
FOR DELETE USING (auth.uid() = user_id);

-- Tabela de histórico de conversação
CREATE TABLE public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.mvv_documents(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Policies para conversation_history
CREATE POLICY "Users can view own conversation history" ON public.conversation_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.mvv_documents
    WHERE mvv_documents.id = conversation_history.document_id
    AND mvv_documents.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create conversation entries" ON public.conversation_history
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mvv_documents
    WHERE mvv_documents.id = conversation_history.document_id
    AND mvv_documents.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mvv_documents_updated_at
BEFORE UPDATE ON public.mvv_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar profile automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();