-- Create assistant_prompts table for prompt management
CREATE TABLE public.assistant_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  version_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_assistant_prompts_key_status ON public.assistant_prompts(assistant_key, status);

-- Enable RLS
ALTER TABLE public.assistant_prompts ENABLE ROW LEVEL SECURITY;

-- Only admins can view prompts
CREATE POLICY "Admins can view all prompts"
ON public.assistant_prompts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert prompts
CREATE POLICY "Admins can insert prompts"
ON public.assistant_prompts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update prompts
CREATE POLICY "Admins can update prompts"
ON public.assistant_prompts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete prompts
CREATE POLICY "Admins can delete prompts"
ON public.assistant_prompts
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_assistant_prompts_updated_at
BEFORE UPDATE ON public.assistant_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();