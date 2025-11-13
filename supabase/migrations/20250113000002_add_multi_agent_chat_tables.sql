-- =============================================
-- Multi-Agent Chat System Database Schema
-- Created: 2025-01-13
-- Purpose: Support multi-agent conversations with
--          real-time collaboration and tracking
-- =============================================

-- =============================================
-- 1. MULTI_AGENT_CONVERSATIONS TABLE
-- =============================================
-- Stores conversation sessions with multiple agents

CREATE TABLE IF NOT EXISTS multi_agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    conversation_type TEXT NOT NULL DEFAULT 'multi_agent'
        CHECK (conversation_type IN ('single', 'multi_agent', 'collaborative', 'mission_control')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paused', 'completed', 'archived', 'failed')),

    -- Configuration
    orchestration_mode TEXT DEFAULT 'automatic'
        CHECK (orchestration_mode IN ('automatic', 'manual', 'supervised')),
    collaboration_strategy TEXT DEFAULT 'parallel'
        CHECK (collaboration_strategy IN ('parallel', 'sequential', 'hierarchical')),
    max_agents INTEGER DEFAULT 10 CHECK (max_agents > 0 AND max_agents <= 50),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Statistics
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost NUMERIC(10, 4) DEFAULT 0.0,
    active_agents_count INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for common queries
    CONSTRAINT valid_dates CHECK (
        completed_at IS NULL OR completed_at >= started_at
    )
);

-- Indexes for performance
CREATE INDEX idx_multi_agent_conversations_user_id ON multi_agent_conversations(user_id);
CREATE INDEX idx_multi_agent_conversations_status ON multi_agent_conversations(status);
CREATE INDEX idx_multi_agent_conversations_type ON multi_agent_conversations(conversation_type);
CREATE INDEX idx_multi_agent_conversations_created_at ON multi_agent_conversations(created_at DESC);
CREATE INDEX idx_multi_agent_conversations_last_message ON multi_agent_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_multi_agent_conversations_tags ON multi_agent_conversations USING gin(tags);
CREATE INDEX idx_multi_agent_conversations_metadata ON multi_agent_conversations USING gin(metadata);

-- =============================================
-- 2. CONVERSATION_PARTICIPANTS TABLE
-- =============================================
-- Tracks which AI agents are participating in each conversation

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES multi_agent_conversations(id) ON DELETE CASCADE,

    -- Agent identification
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    employee_role TEXT NOT NULL,
    employee_provider TEXT NOT NULL,

    -- Participation details
    participant_role TEXT NOT NULL DEFAULT 'collaborator'
        CHECK (participant_role IN ('lead', 'collaborator', 'advisor', 'reviewer', 'observer')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'idle', 'working', 'completed', 'removed')),

    -- Capabilities
    capabilities JSONB DEFAULT '[]'::jsonb,
    tools_available TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Statistics
    message_count INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    cost_incurred NUMERIC(10, 4) DEFAULT 0.0,
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,

    -- Activity tracking
    last_active_at TIMESTAMPTZ,
    total_active_duration INTEGER DEFAULT 0, -- in seconds

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(conversation_id, employee_id),
    CONSTRAINT valid_dates CHECK (
        left_at IS NULL OR left_at >= joined_at
    )
);

-- Indexes for performance
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_employee ON conversation_participants(employee_id);
CREATE INDEX idx_conversation_participants_status ON conversation_participants(status);
CREATE INDEX idx_conversation_participants_role ON conversation_participants(participant_role);
CREATE INDEX idx_conversation_participants_joined ON conversation_participants(joined_at DESC);
CREATE INDEX idx_conversation_participants_capabilities ON conversation_participants USING gin(capabilities);

-- =============================================
-- 3. AGENT_COLLABORATIONS TABLE
-- =============================================
-- Tracks collaborative sessions between agents

CREATE TABLE IF NOT EXISTS agent_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES multi_agent_conversations(id) ON DELETE CASCADE,

    -- Collaboration details
    session_name TEXT,
    session_type TEXT NOT NULL DEFAULT 'task_based'
        CHECK (session_type IN ('task_based', 'brainstorming', 'review', 'problem_solving', 'research')),

    -- Participating agents (array of participant IDs)
    participant_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    lead_participant_id UUID,

    -- Task tracking
    task_description TEXT NOT NULL,
    task_status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (task_status IN ('pending', 'in_progress', 'reviewing', 'completed', 'failed', 'cancelled')),

    -- Collaboration flow
    workflow_steps JSONB DEFAULT '[]'::jsonb,
    current_step INTEGER DEFAULT 0,

    -- Results
    collaboration_result JSONB,
    output_artifacts JSONB DEFAULT '[]'::jsonb,

    -- Metrics
    total_messages INTEGER DEFAULT 0,
    total_iterations INTEGER DEFAULT 0,
    consensus_score NUMERIC(3, 2), -- 0.00 to 1.00

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_dates CHECK (
        completed_at IS NULL OR completed_at >= started_at
    )
);

-- Indexes for performance
CREATE INDEX idx_agent_collaborations_conversation ON agent_collaborations(conversation_id);
CREATE INDEX idx_agent_collaborations_status ON agent_collaborations(task_status);
CREATE INDEX idx_agent_collaborations_type ON agent_collaborations(session_type);
CREATE INDEX idx_agent_collaborations_started ON agent_collaborations(started_at DESC);
CREATE INDEX idx_agent_collaborations_participants ON agent_collaborations USING gin(participant_ids);

-- =============================================
-- 4. MESSAGE_REACTIONS TABLE
-- =============================================
-- User reactions to messages (likes, helpful, etc.)

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Reaction details
    reaction_type TEXT NOT NULL
        CHECK (reaction_type IN ('like', 'helpful', 'unhelpful', 'insightful', 'flag', 'bookmark')),

    -- Optional feedback
    feedback_text TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- One reaction per user per message per type
    UNIQUE(message_id, user_id, reaction_type)
);

-- Indexes for performance
CREATE INDEX idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_type ON message_reactions(reaction_type);
CREATE INDEX idx_message_reactions_created ON message_reactions(created_at DESC);

-- =============================================
-- 5. CONVERSATION_METADATA TABLE
-- =============================================
-- Extended metadata and settings for conversations

CREATE TABLE IF NOT EXISTS conversation_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES multi_agent_conversations(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Display settings
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    folder_id UUID, -- For future folder organization

    -- Sharing settings
    is_public BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE,
    shared_with UUID[] DEFAULT ARRAY[]::UUID[], -- User IDs

    -- Model configuration
    default_model TEXT,
    default_temperature NUMERIC(3, 2),
    default_max_tokens INTEGER,

    -- UI preferences
    ui_settings JSONB DEFAULT '{}'::jsonb,

    -- Analytics
    view_count INTEGER DEFAULT 0,
    export_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- Timestamps
    last_viewed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversation_metadata_conversation ON conversation_metadata(conversation_id);
CREATE INDEX idx_conversation_metadata_user ON conversation_metadata(user_id);
CREATE INDEX idx_conversation_metadata_pinned ON conversation_metadata(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX idx_conversation_metadata_archived ON conversation_metadata(is_archived) WHERE is_archived = TRUE;
CREATE INDEX idx_conversation_metadata_public ON conversation_metadata(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_conversation_metadata_share_token ON conversation_metadata(share_token) WHERE share_token IS NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE multi_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_metadata ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for multi_agent_conversations
-- =============================================

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
    ON multi_agent_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can create own conversations"
    ON multi_agent_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
    ON multi_agent_conversations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
    ON multi_agent_conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for conversation_participants
-- =============================================

-- Users can view participants of their conversations
CREATE POLICY "Users can view participants of own conversations"
    ON conversation_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = conversation_participants.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Users can insert participants to their conversations
CREATE POLICY "Users can add participants to own conversations"
    ON conversation_participants
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = conversation_participants.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Users can update participants in their conversations
CREATE POLICY "Users can update participants in own conversations"
    ON conversation_participants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = conversation_participants.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Users can delete participants from their conversations
CREATE POLICY "Users can remove participants from own conversations"
    ON conversation_participants
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = conversation_participants.conversation_id
            AND user_id = auth.uid()
        )
    );

-- =============================================
-- RLS Policies for agent_collaborations
-- =============================================

-- Users can view collaborations in their conversations
CREATE POLICY "Users can view collaborations in own conversations"
    ON agent_collaborations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = agent_collaborations.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Users can create collaborations in their conversations
CREATE POLICY "Users can create collaborations in own conversations"
    ON agent_collaborations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = agent_collaborations.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Users can update collaborations in their conversations
CREATE POLICY "Users can update collaborations in own conversations"
    ON agent_collaborations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = agent_collaborations.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Users can delete collaborations in their conversations
CREATE POLICY "Users can delete collaborations in own conversations"
    ON agent_collaborations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM multi_agent_conversations
            WHERE id = agent_collaborations.conversation_id
            AND user_id = auth.uid()
        )
    );

-- =============================================
-- RLS Policies for message_reactions
-- =============================================

-- Users can view all reactions (public)
CREATE POLICY "Anyone can view reactions"
    ON message_reactions
    FOR SELECT
    USING (true);

-- Users can create their own reactions
CREATE POLICY "Users can create own reactions"
    ON message_reactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update own reactions"
    ON message_reactions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
    ON message_reactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for conversation_metadata
-- =============================================

-- Users can view metadata of their own conversations
CREATE POLICY "Users can view metadata of own conversations"
    ON conversation_metadata
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create metadata for their conversations
CREATE POLICY "Users can create metadata for own conversations"
    ON conversation_metadata
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update metadata of their conversations
CREATE POLICY "Users can update metadata of own conversations"
    ON conversation_metadata
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete metadata of their conversations
CREATE POLICY "Users can delete metadata of own conversations"
    ON conversation_metadata
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_multi_agent_conversations_updated_at
    BEFORE UPDATE ON multi_agent_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_participants_updated_at
    BEFORE UPDATE ON conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_collaborations_updated_at
    BEFORE UPDATE ON agent_collaborations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_reactions_updated_at
    BEFORE UPDATE ON message_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_metadata_updated_at
    BEFORE UPDATE ON conversation_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update conversation statistics when participants change
CREATE OR REPLACE FUNCTION update_conversation_active_agents_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE multi_agent_conversations
        SET active_agents_count = (
            SELECT COUNT(*)
            FROM conversation_participants
            WHERE conversation_id = NEW.conversation_id
            AND status = 'active'
        )
        WHERE id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE multi_agent_conversations
        SET active_agents_count = (
            SELECT COUNT(*)
            FROM conversation_participants
            WHERE conversation_id = OLD.conversation_id
            AND status = 'active'
        )
        WHERE id = OLD.conversation_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain active agents count
CREATE TRIGGER maintain_active_agents_count
    AFTER INSERT OR UPDATE OR DELETE ON conversation_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_active_agents_count();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE multi_agent_conversations IS 'Stores multi-agent conversation sessions with orchestration configuration';
COMMENT ON TABLE conversation_participants IS 'Tracks AI agents participating in conversations with their roles and statistics';
COMMENT ON TABLE agent_collaborations IS 'Records collaborative sessions between multiple agents on specific tasks';
COMMENT ON TABLE message_reactions IS 'User reactions and feedback on conversation messages';
COMMENT ON TABLE conversation_metadata IS 'Extended metadata, sharing settings, and UI preferences for conversations';

-- =============================================
-- GRANTS (if needed for specific roles)
-- =============================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- END OF MIGRATION
-- =============================================
