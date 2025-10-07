-- Create feedback table
CREATE TABLE IF NOT EXISTS mvv_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES mvv_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_mvv_feedback_document ON mvv_feedback(document_id);
CREATE INDEX idx_mvv_feedback_user ON mvv_feedback(user_id);

-- Enable RLS
ALTER TABLE mvv_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own feedback"
  ON mvv_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON mvv_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);