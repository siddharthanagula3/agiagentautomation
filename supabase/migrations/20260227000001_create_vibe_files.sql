-- Create vibe_files table for /vibe AI coding workspace
CREATE TABLE IF NOT EXISTS vibe_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'plaintext',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS vibe_files_user_id_idx ON vibe_files(user_id);
CREATE INDEX IF NOT EXISTS vibe_files_session_id_idx ON vibe_files(session_id);

-- RLS
ALTER TABLE vibe_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own vibe files"
  ON vibe_files FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
