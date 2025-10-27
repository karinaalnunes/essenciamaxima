-- Criar tabela user_tasks (Kanban)
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  culture_document_id UUID REFERENCES culture_documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('backlog', 'todo', 'in_progress', 'done')) DEFAULT 'backlog',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  source_type TEXT CHECK (source_type IN ('culture_report', 'mvv_report', 'meeting', 'manual')) NOT NULL,
  plan_period TEXT CHECK (plan_period IN ('30', '60', '90', '120')),
  tags TEXT[],
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_tasks_user ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_user_tasks_due_date ON user_tasks(due_date);

ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tasks"
  ON user_tasks FOR ALL
  USING (auth.uid() = user_id);

-- Criar trigger para updated_at
CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela meetings (Sistema completo de reuniões)
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT,
  meeting_type TEXT CHECK (meeting_type IN ('onboarding', 'follow_up', 'review', 'strategic', 'emergency')) DEFAULT 'follow_up',
  status TEXT CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')) DEFAULT 'scheduled',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_1h_sent BOOLEAN DEFAULT false,
  reminder_15min_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_meetings_user ON meetings(user_id);
CREATE INDEX idx_meetings_mentor ON meetings(mentor_id);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON meetings(status);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can confirm own meetings"
  ON meetings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'scheduled');

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Expandir tabela profiles (Redes Sociais + Bio)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_personal TEXT,
ADD COLUMN IF NOT EXISTS instagram_personal TEXT,
ADD COLUMN IF NOT EXISTS facebook_personal TEXT,
ADD COLUMN IF NOT EXISTS linkedin_company TEXT,
ADD COLUMN IF NOT EXISTS instagram_company TEXT,
ADD COLUMN IF NOT EXISTS facebook_company TEXT,
ADD COLUMN IF NOT EXISTS profile_visibility TEXT CHECK (profile_visibility IN ('public', 'connections_only', 'private')) DEFAULT 'connections_only',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Criar tabela mentorship_relationships
CREATE TABLE mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

CREATE INDEX idx_mentorship_mentor ON mentorship_relationships(mentor_id);
CREATE INDEX idx_mentorship_mentee ON mentorship_relationships(mentee_id);

ALTER TABLE mentorship_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can view their mentees"
  ON mentorship_relationships FOR SELECT
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentees can view their mentors"
  ON mentorship_relationships FOR SELECT
  USING (auth.uid() = mentee_id);

CREATE POLICY "Admins can manage mentorship relationships"
  ON mentorship_relationships FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Atualizar RLS de user_tasks para incluir mentores
CREATE POLICY "Mentors can manage mentee tasks"
  ON user_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mentorship_relationships
      WHERE mentor_id = auth.uid()
        AND mentee_id = user_tasks.user_id
        AND status = 'active'
    )
  );

-- Atualizar RLS de meetings para incluir mentores
CREATE POLICY "Mentors can view mentee meetings"
  ON meetings FOR SELECT
  USING (auth.uid() = mentor_id);

CREATE POLICY "Mentors can manage mentee meetings"
  ON meetings FOR ALL
  USING (
    auth.uid() = mentor_id OR
    EXISTS (
      SELECT 1 FROM mentorship_relationships
      WHERE mentor_id = auth.uid()
        AND mentee_id = meetings.user_id
        AND status = 'active'
    )
  );

-- Criar tabela professional_connections (Networking)
CREATE TABLE professional_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, receiver_id)
);

CREATE INDEX idx_connections_requester ON professional_connections(requester_id);
CREATE INDEX idx_connections_receiver ON professional_connections(receiver_id);

ALTER TABLE professional_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON professional_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can request connections"
  ON professional_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can respond to connection requests"
  ON professional_connections FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Atualizar RLS de profiles para networking
CREATE POLICY "Public can view basic profiles"
  ON profiles FOR SELECT
  USING (
    profile_visibility = 'public' OR
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM professional_connections
      WHERE ((requester_id = auth.uid() AND receiver_id = profiles.id)
         OR (receiver_id = auth.uid() AND requester_id = profiles.id))
        AND status = 'accepted'
    )
  );