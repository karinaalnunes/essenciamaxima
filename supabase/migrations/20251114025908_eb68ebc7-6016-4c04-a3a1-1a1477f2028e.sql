-- Create process_documents table
CREATE TABLE public.process_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT,
  function_description TEXT,
  has_function_descriptor BOOLEAN DEFAULT false,
  conversation_history JSONB DEFAULT '[]'::jsonb,
  processes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'mapping' CHECK (status IN ('mapping', 'ready', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.process_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own process documents" 
ON public.process_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own process documents" 
ON public.process_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own process documents" 
ON public.process_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own process documents" 
ON public.process_documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_process_documents_updated_at
BEFORE UPDATE ON public.process_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();