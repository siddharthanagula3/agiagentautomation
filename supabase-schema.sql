-- ============================================
-- AGI Platform - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PURCHASED EMPLOYEES TABLE
-- Stores which AI employees each user has purchased
-- ============================================
CREATE TABLE IF NOT EXISTS purchased_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL, -- References employee ID from AI_EMPLOYEES data
    role VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- chatgpt, claude, gemini, perplexity
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Indexes
    CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, employee_id)
);

-- Add index for faster queries
CREATE INDEX idx_purchased_employees_user_id ON purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON purchased_employees(employee_id);

-- ============================================
-- 2. CHAT SESSIONS TABLE
-- Stores chat conversations with AI employees
-- ============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    role VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_employee_id ON chat_sessions(employee_id);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at DESC);

-- ============================================
-- 3. CHAT MESSAGES TABLE
-- Stores individual messages in chat sessions
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- 4. NOTIFICATIONS TABLE (Optional)
-- Stores user notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Purchased Employees Policies
CREATE POLICY "Users can view their own purchased employees"
    ON purchased_employees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased employees"
    ON purchased_employees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchased employees"
    ON purchased_employees FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchased employees"
    ON purchased_employees FOR DELETE
    USING (auth.uid() = user_id);

-- Chat Sessions Policies
CREATE POLICY "Users can view their own chat sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Chat Messages Policies
CREATE POLICY "Users can view messages from their chat sessions"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their chat sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages from their chat sessions"
    ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 6. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for purchased_employees
CREATE TRIGGER update_purchased_employees_updated_at
    BEFORE UPDATE ON purchased_employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update chat session's last_message_at
CREATE OR REPLACE FUNCTION update_chat_session_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET last_message_at = NEW.created_at
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is added
CREATE TRIGGER update_session_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_session_last_message();

-- ============================================
-- 7. HELPER VIEWS (Optional but useful)
-- ============================================

-- View to get user's purchased employees with stats
CREATE OR REPLACE VIEW user_purchased_employees_with_stats AS
SELECT 
    pe.*,
    COUNT(DISTINCT cs.id) as total_chats,
    COUNT(DISTINCT cm.id) as total_messages,
    MAX(cs.last_message_at) as last_chat_at
FROM purchased_employees pe
LEFT JOIN chat_sessions cs ON pe.employee_id = cs.employee_id AND pe.user_id = cs.user_id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY pe.id;

-- View to get recent chat sessions with message count
CREATE OR REPLACE VIEW recent_chat_sessions AS
SELECT 
    cs.id,
    cs.user_id,
    cs.employee_id,
    cs.role,
    cs.provider,
    cs.title,
    cs.is_active,
    cs.created_at,
    cs.updated_at,
    cs.last_message_at as session_last_message_at,
    COUNT(cm.id) as message_count,
    MAX(cm.created_at) as latest_message_at
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.user_id, cs.employee_id, cs.role, cs.provider, cs.title, cs.is_active, cs.created_at, cs.updated_at, cs.last_message_at
ORDER BY COALESCE(MAX(cm.created_at), cs.last_message_at, cs.created_at) DESC;

-- ============================================
-- 8. SAMPLE DATA FOR TESTING (Optional)
-- Uncomment to insert test data
-- ============================================

/*
-- Insert sample purchased employee (replace 'YOUR_USER_ID' with actual user ID)
INSERT INTO purchased_employees (user_id, employee_id, role, provider)
VALUES 
    ('YOUR_USER_ID', 'emp-001', 'Software Architect', 'claude'),
    ('YOUR_USER_ID', 'emp-002', 'Solutions Architect', 'claude');

-- Insert sample chat session
INSERT INTO chat_sessions (user_id, employee_id, role, provider, title)
VALUES 
    ('YOUR_USER_ID', 'emp-001', 'Software Architect', 'claude', 'Project Discussion');

-- Insert sample messages (replace 'SESSION_ID' with actual session ID)
INSERT INTO chat_messages (session_id, role, content)
VALUES 
    ('SESSION_ID', 'assistant', 'Hi! I''m your Software Architect. How can I help you today?'),
    ('SESSION_ID', 'user', 'I need help designing a scalable architecture.');
*/

-- ============================================
-- COMPLETE! Schema is ready for use.
-- ============================================

-- Verify tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'purchased_employees',
    'chat_sessions', 
    'chat_messages',
    'notifications'
)
ORDER BY table_name;
