-- Create search_history table for tracking user searches
-- Migration: 20260129000003_add_search_history.sql

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_created ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(query);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own search history
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own search history
CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own search history
CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create search_analytics table for aggregated popular searches
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_normalized TEXT NOT NULL,
  search_count INTEGER NOT NULL DEFAULT 1,
  total_results BIGINT NOT NULL DEFAULT 0,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  first_searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(query_normalized)
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_count ON search_analytics(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_last_searched ON search_analytics(last_searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query_normalized ON search_analytics(query_normalized);

-- Enable RLS for analytics (read-only for all authenticated users)
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read analytics (for popular searches)
CREATE POLICY "Authenticated users can view search analytics"
  ON search_analytics FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update analytics
CREATE POLICY "Service role can manage search analytics"
  ON search_analytics FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to track a search and update analytics
CREATE OR REPLACE FUNCTION track_search(
  p_user_id UUID,
  p_query TEXT,
  p_result_count INTEGER,
  p_filters JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
  v_normalized_query TEXT;
BEGIN
  -- Normalize the query (lowercase, trim)
  v_normalized_query := LOWER(TRIM(p_query));

  -- Skip empty queries
  IF v_normalized_query = '' THEN
    RETURN NULL;
  END IF;

  -- Insert into search history
  INSERT INTO search_history (user_id, query, result_count, filters)
  VALUES (p_user_id, p_query, p_result_count, p_filters)
  RETURNING id INTO v_history_id;

  -- Update or insert analytics
  INSERT INTO search_analytics (query_normalized, search_count, total_results, last_searched_at, first_searched_at)
  VALUES (v_normalized_query, 1, p_result_count, NOW(), NOW())
  ON CONFLICT (query_normalized) DO UPDATE SET
    search_count = search_analytics.search_count + 1,
    total_results = search_analytics.total_results + EXCLUDED.total_results,
    last_searched_at = NOW(),
    updated_at = NOW();

  -- Cleanup old history for this user (keep last 100)
  DELETE FROM search_history
  WHERE user_id = p_user_id
  AND id NOT IN (
    SELECT id FROM search_history
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 100
  );

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent searches for a user (deduplicated)
CREATE OR REPLACE FUNCTION get_recent_searches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  query TEXT,
  result_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_unique AS (
    SELECT DISTINCT ON (LOWER(TRIM(sh.query)))
      sh.query,
      sh.result_count,
      sh.created_at
    FROM search_history sh
    WHERE sh.user_id = p_user_id
    ORDER BY LOWER(TRIM(sh.query)), sh.created_at DESC
  )
  SELECT ru.query, ru.result_count, ru.created_at
  FROM recent_unique ru
  ORDER BY ru.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular searches (last 7 days)
CREATE OR REPLACE FUNCTION get_popular_searches(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  query TEXT,
  search_count INTEGER,
  avg_results NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.query_normalized AS query,
    sa.search_count,
    ROUND(sa.total_results::NUMERIC / NULLIF(sa.search_count, 0), 0) AS avg_results
  FROM search_analytics sa
  WHERE sa.last_searched_at >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY sa.search_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search suggestions based on user history and partial query
CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_user_id UUID,
  p_partial_query TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  suggestion TEXT,
  source TEXT,
  score INTEGER
) AS $$
DECLARE
  v_partial_lower TEXT;
BEGIN
  v_partial_lower := LOWER(TRIM(p_partial_query));

  -- Skip if partial query is too short
  IF LENGTH(v_partial_lower) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  (
    -- User's own recent searches (higher priority)
    SELECT DISTINCT
      sh.query AS suggestion,
      'recent'::TEXT AS source,
      3 AS score
    FROM search_history sh
    WHERE sh.user_id = p_user_id
      AND LOWER(sh.query) LIKE v_partial_lower || '%'
    ORDER BY sh.created_at DESC
    LIMIT p_limit
  )
  UNION ALL
  (
    -- Popular searches from analytics
    SELECT
      sa.query_normalized AS suggestion,
      'popular'::TEXT AS source,
      2 AS score
    FROM search_analytics sa
    WHERE sa.query_normalized LIKE v_partial_lower || '%'
      AND sa.last_searched_at >= NOW() - INTERVAL '30 days'
    ORDER BY sa.search_count DESC
    LIMIT p_limit
  )
  ORDER BY score DESC, suggestion
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear user's search history
CREATE OR REPLACE FUNCTION clear_search_history(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM search_history
  WHERE user_id = p_user_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE search_history IS 'Stores individual user search queries with results';
COMMENT ON TABLE search_analytics IS 'Aggregated search analytics for popular/trending searches';
COMMENT ON FUNCTION track_search IS 'Records a search query and updates analytics, maintaining max 100 history per user';
COMMENT ON FUNCTION get_recent_searches IS 'Returns deduplicated recent searches for a user';
COMMENT ON FUNCTION get_popular_searches IS 'Returns popular searches from the last N days';
COMMENT ON FUNCTION get_search_suggestions IS 'Returns autocomplete suggestions based on user history and popular searches';
COMMENT ON FUNCTION clear_search_history IS 'Clears all search history for a user';
