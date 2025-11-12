-- Support and Settings Tables Migration
-- Creates tables for support tickets, FAQs, and API keys

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create support_ticket_replies table
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faqs table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for avatars (users can upload their own)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- RLS Policies for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for support_ticket_replies
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view replies to their tickets"
ON support_ticket_replies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can reply to their own tickets"
ON support_ticket_replies FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM support_tickets
    WHERE id = ticket_id AND user_id = auth.uid()
  )
);

-- RLS Policies for FAQs (public read, admin write)
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQs are publicly readable"
ON faqs FOR SELECT
TO public
USING (is_published = TRUE);

-- RLS Policies for API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
ON api_keys FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys"
ON api_keys FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys"
ON api_keys FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket_id ON support_ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Insert default FAQs
INSERT INTO faqs (category, question, answer, display_order, is_published) VALUES
('Getting Started', 'How do I hire my first AI employee?', 'Visit the Marketplace page, browse available AI employees, and click "Hire Now" on the employee you want. The cost is $0 per month for standard roles and $29/month for premium roles, and they will be immediately available in your Chat page.', 1, TRUE),
('Getting Started', 'What AI providers are supported?', 'We support ChatGPT (OpenAI), Claude (Anthropic), Gemini (Google), and Perplexity. You need to add at least one API key in your .env file to use the chat functionality.', 2, TRUE),
('Chat', 'How do I start a chat with an AI employee?', 'Go to the Chat page, click the "New Chat" button, select an employee from your purchased list, and start chatting. Each employee uses their configured AI provider.', 1, TRUE),
('Billing', 'How much does it cost?', 'Currently, hiring AI employees costs $0 per month for standard roles and $29/month for premium roles. The actual AI API costs depend on your usage and the provider you''re using.', 1, TRUE),
('Technical', 'Is my data secure?', 'Yes! We use Supabase for secure data storage with row-level security. Your conversations and data are encrypted and only accessible to you.', 1, TRUE),
('Automation', 'How do I create a workflow?', 'Go to Automation > Designer, use the visual workflow builder to create your automation by connecting nodes, and click "Save" when done.', 1, TRUE)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE support_tickets IS 'User support tickets and help requests';
COMMENT ON TABLE support_ticket_replies IS 'Replies to support tickets from users and staff';
COMMENT ON TABLE faqs IS 'Frequently asked questions for the help center';
COMMENT ON TABLE api_keys IS 'User-generated API keys for integrations (stored as hashed values)';
