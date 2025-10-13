-- Create backup and disaster recovery tables
-- This migration creates tables for storing backup metadata and backup data

-- Create backup_metadata table
CREATE TABLE public.backup_metadata (
    id text PRIMARY KEY,
    timestamp timestamptz NOT NULL,
    type text NOT NULL CHECK (type IN ('full', 'incremental', 'differential')),
    size bigint NOT NULL DEFAULT 0,
    status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    tables text[] NOT NULL DEFAULT '{}',
    checksum text NOT NULL,
    location text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create backup_storage table for storing backup data
CREATE TABLE public.backup_storage (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id text NOT NULL REFERENCES public.backup_metadata(id) ON DELETE CASCADE,
    data jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create disaster_recovery_log table
CREATE TABLE public.disaster_recovery_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL CHECK (event_type IN ('backup', 'restore', 'test', 'cleanup', 'error')),
    backup_id text REFERENCES public.backup_metadata(id) ON DELETE SET NULL,
    details jsonb,
    status text NOT NULL CHECK (status IN ('success', 'failure', 'warning')),
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_backup_metadata_timestamp ON public.backup_metadata(timestamp DESC);
CREATE INDEX idx_backup_metadata_status ON public.backup_metadata(status);
CREATE INDEX idx_backup_metadata_type ON public.backup_metadata(type);
CREATE INDEX idx_backup_storage_backup_id ON public.backup_storage(backup_id);
CREATE INDEX idx_disaster_recovery_log_event_type ON public.disaster_recovery_log(event_type);
CREATE INDEX idx_disaster_recovery_log_created_at ON public.disaster_recovery_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disaster_recovery_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backup_metadata
CREATE POLICY "Service role can manage backup metadata" ON public.backup_metadata
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view backup metadata" ON public.backup_metadata
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for backup_storage
CREATE POLICY "Service role can manage backup storage" ON public.backup_storage
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view backup storage" ON public.backup_storage
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create RLS policies for disaster_recovery_log
CREATE POLICY "Service role can manage disaster recovery log" ON public.disaster_recovery_log
    USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view disaster recovery log" ON public.disaster_recovery_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_backup_metadata_updated_at 
    BEFORE UPDATE ON public.backup_metadata 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_storage_updated_at 
    BEFORE UPDATE ON public.backup_storage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log disaster recovery events
CREATE OR REPLACE FUNCTION log_disaster_recovery_event(
    p_event_type text,
    p_backup_id text DEFAULT NULL,
    p_details jsonb DEFAULT NULL,
    p_status text DEFAULT 'success',
    p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.disaster_recovery_log (
        event_type,
        backup_id,
        details,
        status,
        error_message
    ) VALUES (
        p_event_type,
        p_backup_id,
        p_details,
        p_status,
        p_error_message
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get backup statistics
CREATE OR REPLACE FUNCTION get_backup_statistics()
RETURNS TABLE (
    total_backups bigint,
    successful_backups bigint,
    failed_backups bigint,
    total_size bigint,
    last_backup_date timestamptz,
    oldest_backup_date timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_backups,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_backups,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_backups,
        COALESCE(SUM(size), 0) as total_size,
        MAX(timestamp) as last_backup_date,
        MIN(timestamp) as oldest_backup_date
    FROM public.backup_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup old backups
CREATE OR REPLACE FUNCTION cleanup_old_backups(retention_days integer DEFAULT 30)
RETURNS TABLE (
    deleted_backups bigint,
    deleted_storage_records bigint
) AS $$
DECLARE
    cutoff_date timestamptz;
    deleted_backups_count bigint;
    deleted_storage_count bigint;
BEGIN
    cutoff_date := now() - (retention_days || ' days')::interval;
    
    -- Delete backup storage records first (due to foreign key constraint)
    DELETE FROM public.backup_storage 
    WHERE backup_id IN (
        SELECT id FROM public.backup_metadata 
        WHERE timestamp < cutoff_date
    );
    
    GET DIAGNOSTICS deleted_storage_count = ROW_COUNT;
    
    -- Delete backup metadata
    DELETE FROM public.backup_metadata 
    WHERE timestamp < cutoff_date;
    
    GET DIAGNOSTICS deleted_backups_count = ROW_COUNT;
    
    -- Log the cleanup event
    PERFORM log_disaster_recovery_event(
        'cleanup',
        NULL,
        jsonb_build_object(
            'retention_days', retention_days,
            'cutoff_date', cutoff_date,
            'deleted_backups', deleted_backups_count,
            'deleted_storage_records', deleted_storage_count
        ),
        'success'
    );
    
    RETURN QUERY SELECT deleted_backups_count, deleted_storage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial backup configuration
INSERT INTO public.backup_metadata (
    id,
    timestamp,
    type,
    size,
    status,
    tables,
    checksum,
    location
) VALUES (
    'initial_config',
    now(),
    'full',
    0,
    'completed',
    '{}',
    'initial',
    'system://initial'
) ON CONFLICT (id) DO NOTHING;

-- Log the initial setup
SELECT log_disaster_recovery_event(
    'backup',
    'initial_config',
    jsonb_build_object('action', 'initial_setup'),
    'success'
);
