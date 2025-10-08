-- Web Fetch Logs Migration
-- Creates table for tracking web content fetching operations

-- Web Fetch Logs Table
CREATE TABLE IF NOT EXISTS web_fetch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  content_length INTEGER,
  word_count INTEGER,
  language TEXT,
  title TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_url ON web_fetch_logs(url);
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_timestamp ON web_fetch_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_fetch_logs_success ON web_fetch_logs(success);

-- Row Level Security (RLS)
ALTER TABLE web_fetch_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only service role can access these logs
CREATE POLICY "Service role can manage web fetch logs" ON web_fetch_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_web_fetch_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM web_fetch_logs 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Comments for documentation
COMMENT ON TABLE web_fetch_logs IS 'Logs web content fetching operations for analytics and debugging';
COMMENT ON FUNCTION cleanup_old_web_fetch_logs() IS 'Cleans up web fetch logs older than 30 days';
