-- 1. Add FK constraint on culture_documents.mvv_document_id -> mvv_documents.id
ALTER TABLE public.culture_documents
ADD CONSTRAINT culture_documents_mvv_document_id_fkey
FOREIGN KEY (mvv_document_id) REFERENCES public.mvv_documents(id);

-- 2. Create culture_feedback table
CREATE TABLE public.culture_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.culture_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.culture_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for culture_feedback
CREATE POLICY "Users can insert their own culture feedback"
ON public.culture_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own culture feedback"
ON public.culture_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- 3. Create process_feedback table
CREATE TABLE public.process_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.process_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for process_feedback
CREATE POLICY "Users can insert their own process feedback"
ON public.process_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own process feedback"
ON public.process_feedback
FOR SELECT
USING (auth.uid() = user_id);