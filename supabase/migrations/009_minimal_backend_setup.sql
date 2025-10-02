-- Minimal Backend Setup - Only essential functions and policies

-- ============================================================================
-- 1. ESSENTIAL DATABASE FUNCTIONS
-- ============================================================================

-- Function to get dashboard stats (minimal version)
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'total_employees', COALESCE((SELECT COUNT(*) FROM purchased_employees WHERE user_id = p_user_id), 0),
        'total_chats', COALESCE((SELECT COUNT(*) FROM chat_sessions WHERE user_id = p_user_id), 0),
        'total_workflows', COALESCE((SELECT COUNT(*) FROM automation_workflows WHERE user_id = p_user_id), 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limits (simplified)
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_resource TEXT,
    p_limit INTEGER DEFAULT 100
)
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, always return true (unlimited)
    -- Can be enhanced later with actual rate limiting table
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Users table
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Chat sessions table
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own chat sessions" ON chat_sessions;
CREATE POLICY "Users can create own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own chat sessions" ON chat_sessions;
CREATE POLICY "Users can update own chat sessions" ON chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chat sessions" ON chat_sessions;
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Chat messages table
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own chat messages" ON chat_messages;
CREATE POLICY "Users can create own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid()
        )
    );

-- Automation workflows table
ALTER TABLE IF EXISTS automation_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own workflows" ON automation_workflows;
CREATE POLICY "Users can view own workflows" ON automation_workflows
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own workflows" ON automation_workflows;
CREATE POLICY "Users can create own workflows" ON automation_workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workflows" ON automation_workflows;
CREATE POLICY "Users can update own workflows" ON automation_workflows
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workflows" ON automation_workflows;
CREATE POLICY "Users can delete own workflows" ON automation_workflows
    FOR DELETE USING (auth.uid() = user_id);

-- Purchased employees table
ALTER TABLE IF EXISTS purchased_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own employees" ON purchased_employees;
CREATE POLICY "Users can view own employees" ON purchased_employees
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own employees" ON purchased_employees;
CREATE POLICY "Users can create own employees" ON purchased_employees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own employees" ON purchased_employees;
CREATE POLICY "Users can update own employees" ON purchased_employees
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================

-- Only create indexes that don't exist
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created ON chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_user ON automation_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_employees_user ON purchased_employees(user_id);

-- ============================================================================
-- 4. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Minimal backend setup completed successfully';
    RAISE NOTICE 'RLS policies enabled on all main tables';
    RAISE NOTICE 'Essential functions created';
END $$;
