-- Add unique constraint to ensure only one MVV per user
ALTER TABLE public.mvv_documents
ADD CONSTRAINT one_mvv_per_user UNIQUE (user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_mvv_documents_user_id ON public.mvv_documents(user_id);