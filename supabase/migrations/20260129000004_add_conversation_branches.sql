-- Migration: Add conversation branches table
-- Date: 2026-01-29
-- Description: Stores branch metadata for conversation trees, tracking parent-child relationships
--              between chat sessions when users branch conversations at specific message points.

-- Create conversation_branches table
CREATE TABLE IF NOT EXISTS public.conversation_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    child_session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    branch_point_message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    branch_name TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure unique child session (a session can only be a branch of one parent)
    CONSTRAINT unique_child_session UNIQUE (child_session_id),
    -- Ensure parent and child are different sessions
    CONSTRAINT different_sessions CHECK (parent_session_id != child_session_id)
);

-- Add comment for documentation
COMMENT ON TABLE public.conversation_branches IS 'Stores branch metadata for conversation trees, tracking parent-child relationships between chat sessions';
COMMENT ON COLUMN public.conversation_branches.parent_session_id IS 'The original session that was branched from';
COMMENT ON COLUMN public.conversation_branches.child_session_id IS 'The new session created as a branch';
COMMENT ON COLUMN public.conversation_branches.branch_point_message_id IS 'The message in the parent session where the branch was created';
COMMENT ON COLUMN public.conversation_branches.branch_name IS 'Optional user-provided name for the branch';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_conversation_branches_parent_session
    ON public.conversation_branches(parent_session_id);

CREATE INDEX IF NOT EXISTS idx_conversation_branches_child_session
    ON public.conversation_branches(child_session_id);

CREATE INDEX IF NOT EXISTS idx_conversation_branches_branch_point
    ON public.conversation_branches(branch_point_message_id);

CREATE INDEX IF NOT EXISTS idx_conversation_branches_created_by
    ON public.conversation_branches(created_by);

CREATE INDEX IF NOT EXISTS idx_conversation_branches_created_at
    ON public.conversation_branches(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.conversation_branches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view branches for their own sessions
CREATE POLICY "Users can view their own conversation branches"
    ON public.conversation_branches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = conversation_branches.parent_session_id
            AND cs.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = conversation_branches.child_session_id
            AND cs.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can create branches for their own sessions
CREATE POLICY "Users can create branches for their sessions"
    ON public.conversation_branches
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = parent_session_id
            AND cs.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = child_session_id
            AND cs.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update branch names for their own branches
CREATE POLICY "Users can update their own branch names"
    ON public.conversation_branches
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = conversation_branches.child_session_id
            AND cs.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = child_session_id
            AND cs.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete branches for their own sessions
CREATE POLICY "Users can delete their own conversation branches"
    ON public.conversation_branches
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions cs
            WHERE cs.id = conversation_branches.child_session_id
            AND cs.user_id = auth.uid()
        )
    );

-- Create helper function to get the root session of a branch chain
CREATE OR REPLACE FUNCTION public.get_root_session(session_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_id UUID := session_id;
    parent_id UUID;
    max_depth INT := 100; -- Prevent infinite loops
    depth INT := 0;
BEGIN
    LOOP
        -- Look for parent of current session
        SELECT cb.parent_session_id INTO parent_id
        FROM conversation_branches cb
        WHERE cb.child_session_id = current_id;

        -- If no parent found, current is the root
        IF parent_id IS NULL THEN
            RETURN current_id;
        END IF;

        current_id := parent_id;
        depth := depth + 1;

        -- Safety check for infinite loops
        IF depth >= max_depth THEN
            RAISE EXCEPTION 'Maximum branch depth exceeded';
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.get_root_session IS 'Traverses the branch chain to find the root session';

-- Create helper function to get all branches for a session (direct children)
CREATE OR REPLACE FUNCTION public.get_session_branches(p_session_id UUID)
RETURNS TABLE (
    branch_id UUID,
    child_session_id UUID,
    branch_point_message_id UUID,
    branch_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cb.id,
        cb.child_session_id,
        cb.branch_point_message_id,
        cb.branch_name,
        cb.created_at
    FROM conversation_branches cb
    WHERE cb.parent_session_id = p_session_id
    ORDER BY cb.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_session_branches IS 'Returns all direct branches of a session';

-- Create helper function to get branch history (ancestors)
CREATE OR REPLACE FUNCTION public.get_branch_history(p_session_id UUID)
RETURNS TABLE (
    session_id UUID,
    branch_name TEXT,
    branch_point_message_id UUID,
    depth INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_id UUID := p_session_id;
    current_depth INT := 0;
    max_depth INT := 100;
    branch_record RECORD;
BEGIN
    LOOP
        -- Look for branch record where current session is the child
        SELECT cb.parent_session_id, cb.branch_name, cb.branch_point_message_id
        INTO branch_record
        FROM conversation_branches cb
        WHERE cb.child_session_id = current_id;

        -- If no parent found, we've reached the root
        IF branch_record.parent_session_id IS NULL THEN
            -- Return the root session
            session_id := current_id;
            branch_name := NULL;
            branch_point_message_id := NULL;
            depth := current_depth;
            RETURN NEXT;
            RETURN;
        END IF;

        -- Return current session info
        session_id := current_id;
        branch_name := branch_record.branch_name;
        branch_point_message_id := branch_record.branch_point_message_id;
        depth := current_depth;
        RETURN NEXT;

        -- Move to parent
        current_id := branch_record.parent_session_id;
        current_depth := current_depth + 1;

        -- Safety check
        IF current_depth >= max_depth THEN
            RAISE EXCEPTION 'Maximum branch depth exceeded';
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION public.get_branch_history IS 'Returns the branch ancestry chain from session to root';

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_root_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_session_branches TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_branch_history TO authenticated;
