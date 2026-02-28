-- Web conversations table (compatible with desktop app schema)
CREATE TABLE IF NOT EXISTS web_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  employee_id TEXT DEFAULT 'general',
  role TEXT DEFAULT 'assistant',
  provider TEXT DEFAULT 'openai',
  is_active BOOLEAN DEFAULT true,
  is_starred BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  shared_link TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Web messages table
CREATE TABLE IF NOT EXISTS web_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES web_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  edited BOOLEAN DEFAULT false,
  edit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS web_conversations_user_id_idx ON web_conversations(user_id);
CREATE INDEX IF NOT EXISTS web_messages_session_id_idx ON web_messages(session_id);

-- RLS
ALTER TABLE web_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own conversations"
  ON web_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE web_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access messages in their conversations"
  ON web_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM web_conversations wc
      WHERE wc.id = web_messages.session_id
      AND wc.user_id = auth.uid()
    )
  );
