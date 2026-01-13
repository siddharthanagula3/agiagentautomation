-- Employee Memories Migration
-- Enables per-employee memory about users for sub-agent architecture
-- Each AI employee can remember facts about users across sessions

-- ================================================
-- Employee Memories Table
-- ================================================
-- Stores what each AI employee knows about each user
-- Key: (user_id, employee_id) - unique memory per employee per user

CREATE TABLE IF NOT EXISTS employee_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL, -- AI employee name (e.g., 'gym-trainer', 'dietitian')

    -- Knowledge storage (JSONB array of memory entries)
    knowledge_base JSONB DEFAULT '[]'::jsonb,
    -- Each entry: { id, category, key, value, confidence, source, createdAt, updatedAt }
    -- Categories: personal, preferences, history, goals, notes

    -- User preferences known by this employee
    preferences JSONB DEFAULT '{}'::jsonb,

    -- Interaction tracking
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one memory record per employee per user
    CONSTRAINT employee_memories_unique UNIQUE (user_id, employee_id)
);

-- ================================================
-- Indexes for Performance
-- ================================================

-- Fast lookup by user and employee
CREATE INDEX IF NOT EXISTS idx_employee_memories_user_employee
    ON employee_memories(user_id, employee_id);

-- Find all memories for a user (across employees)
CREATE INDEX IF NOT EXISTS idx_employee_memories_user
    ON employee_memories(user_id);

-- Find all memories for an employee (across users)
CREATE INDEX IF NOT EXISTS idx_employee_memories_employee
    ON employee_memories(employee_id);

-- Recent interactions
CREATE INDEX IF NOT EXISTS idx_employee_memories_last_interaction
    ON employee_memories(last_interaction DESC);

-- GIN index for knowledge_base JSONB queries
CREATE INDEX IF NOT EXISTS idx_employee_memories_knowledge_base
    ON employee_memories USING GIN (knowledge_base);

-- ================================================
-- Row Level Security (RLS)
-- ================================================

ALTER TABLE employee_memories ENABLE ROW LEVEL SECURITY;

-- Users can only see their own memories
CREATE POLICY "Users can view own employee memories" ON employee_memories
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert memories for themselves
CREATE POLICY "Users can create own employee memories" ON employee_memories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own memories
CREATE POLICY "Users can update own employee memories" ON employee_memories
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own memories
CREATE POLICY "Users can delete own employee memories" ON employee_memories
    FOR DELETE
    USING (auth.uid() = user_id);

-- ================================================
-- Updated At Trigger
-- ================================================

CREATE OR REPLACE FUNCTION update_employee_memories_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_memories_timestamp ON employee_memories;
CREATE TRIGGER update_employee_memories_timestamp
    BEFORE UPDATE ON employee_memories
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_memories_timestamp();

-- ================================================
-- Helper Functions
-- ================================================

-- Function to add knowledge entry to an employee's memory
CREATE OR REPLACE FUNCTION add_employee_knowledge(
    p_user_id UUID,
    p_employee_id TEXT,
    p_category TEXT,
    p_key TEXT,
    p_value TEXT,
    p_confidence NUMERIC DEFAULT 0.8,
    p_source TEXT DEFAULT 'inferred'
)
RETURNS JSONB AS $$
DECLARE
    v_entry JSONB;
    v_existing_index INTEGER;
BEGIN
    -- Build new entry
    v_entry := jsonb_build_object(
        'id', gen_random_uuid(),
        'category', p_category,
        'key', p_key,
        'value', p_value,
        'confidence', p_confidence,
        'source', p_source,
        'createdAt', NOW(),
        'updatedAt', NOW()
    );

    -- Upsert the memory record
    INSERT INTO employee_memories (user_id, employee_id, knowledge_base, interaction_count)
    VALUES (p_user_id, p_employee_id, jsonb_build_array(v_entry), 1)
    ON CONFLICT (user_id, employee_id) DO UPDATE SET
        knowledge_base = (
            SELECT CASE
                -- Check if entry with same key and category exists
                WHEN EXISTS (
                    SELECT 1 FROM jsonb_array_elements(employee_memories.knowledge_base) elem
                    WHERE elem->>'key' = p_key AND elem->>'category' = p_category
                )
                -- Update existing entry
                THEN (
                    SELECT jsonb_agg(
                        CASE
                            WHEN elem->>'key' = p_key AND elem->>'category' = p_category
                            THEN elem || jsonb_build_object('value', p_value, 'updatedAt', NOW())
                            ELSE elem
                        END
                    )
                    FROM jsonb_array_elements(employee_memories.knowledge_base) elem
                )
                -- Add new entry
                ELSE employee_memories.knowledge_base || v_entry
            END
        ),
        interaction_count = employee_memories.interaction_count + 1,
        last_interaction = NOW(),
        updated_at = NOW();

    RETURN v_entry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all knowledge for a user-employee pair
CREATE OR REPLACE FUNCTION get_employee_knowledge(
    p_user_id UUID,
    p_employee_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT knowledge_base INTO v_result
    FROM employee_memories
    WHERE user_id = p_user_id AND employee_id = p_employee_id;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get knowledge by category
CREATE OR REPLACE FUNCTION get_employee_knowledge_by_category(
    p_user_id UUID,
    p_employee_id TEXT,
    p_category TEXT
)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(elem)
        FROM employee_memories,
             jsonb_array_elements(knowledge_base) elem
        WHERE user_id = p_user_id
          AND employee_id = p_employee_id
          AND elem->>'category' = p_category
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Grant Permissions
-- ================================================

GRANT ALL ON employee_memories TO authenticated;
GRANT EXECUTE ON FUNCTION add_employee_knowledge TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_knowledge TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_knowledge_by_category TO authenticated;

-- ================================================
-- Comments for Documentation
-- ================================================

COMMENT ON TABLE employee_memories IS 'Per-employee memory storage for sub-agent architecture. Each AI employee remembers facts about users across sessions.';
COMMENT ON COLUMN employee_memories.knowledge_base IS 'Array of memory entries: {id, category, key, value, confidence, source, createdAt, updatedAt}';
COMMENT ON COLUMN employee_memories.preferences IS 'User preferences known by this specific employee';
COMMENT ON COLUMN employee_memories.interaction_count IS 'Number of interactions between this user and employee';
