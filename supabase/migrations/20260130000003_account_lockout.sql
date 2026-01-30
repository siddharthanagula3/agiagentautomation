-- Account Lockout System Migration
-- Implements brute force protection by tracking failed login attempts
-- and locking accounts after exceeding threshold

-- Create account_lockouts table to track failed login attempts
CREATE TABLE IF NOT EXISTS public.account_lockouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMPTZ,
    last_failed_at TIMESTAMPTZ,
    last_successful_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT account_lockouts_email_unique UNIQUE (email)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON public.account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON public.account_lockouts(locked_until) WHERE locked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only service role can access lockout data (security-sensitive)
-- No user should be able to read/modify lockout records directly
CREATE POLICY "Service role manages account lockouts" ON public.account_lockouts
    FOR ALL USING (auth.role() = 'service_role');

-- Function to record a failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
    p_email TEXT,
    p_max_attempts INTEGER DEFAULT 5,
    p_lockout_duration_minutes INTEGER DEFAULT 30
) RETURNS TABLE(
    is_locked BOOLEAN,
    attempts_remaining INTEGER,
    locked_until TIMESTAMPTZ,
    should_lock BOOLEAN
) AS $$
DECLARE
    v_record account_lockouts%ROWTYPE;
    v_is_locked BOOLEAN := FALSE;
    v_attempts_remaining INTEGER;
    v_locked_until TIMESTAMPTZ;
    v_should_lock BOOLEAN := FALSE;
    v_new_attempts INTEGER;
BEGIN
    -- Normalize email to lowercase
    p_email := LOWER(TRIM(p_email));

    -- Get or create the lockout record
    SELECT * INTO v_record FROM account_lockouts WHERE account_lockouts.email = p_email;

    IF v_record IS NULL THEN
        -- Create new record
        INSERT INTO account_lockouts (email, failed_attempts, last_failed_at, updated_at)
        VALUES (p_email, 1, NOW(), NOW())
        RETURNING * INTO v_record;

        v_new_attempts := 1;
    ELSE
        -- Check if currently locked
        IF v_record.locked_until IS NOT NULL AND v_record.locked_until > NOW() THEN
            -- Account is locked, return locked status
            RETURN QUERY SELECT
                TRUE,
                0,
                v_record.locked_until,
                FALSE;
            RETURN;
        END IF;

        -- Check if lockout has expired (reset counter if so)
        IF v_record.locked_until IS NOT NULL AND v_record.locked_until <= NOW() THEN
            -- Lockout expired, reset counter
            v_new_attempts := 1;
        ELSE
            -- Increment failed attempts
            v_new_attempts := v_record.failed_attempts + 1;
        END IF;

        -- Update the record
        UPDATE account_lockouts
        SET
            failed_attempts = v_new_attempts,
            last_failed_at = NOW(),
            locked_until = CASE
                WHEN v_new_attempts >= p_max_attempts
                THEN NOW() + (p_lockout_duration_minutes || ' minutes')::INTERVAL
                ELSE NULL
            END,
            updated_at = NOW()
        WHERE account_lockouts.email = p_email
        RETURNING * INTO v_record;
    END IF;

    -- Calculate return values
    v_is_locked := v_record.locked_until IS NOT NULL AND v_record.locked_until > NOW();
    v_should_lock := v_new_attempts >= p_max_attempts;
    v_attempts_remaining := GREATEST(0, p_max_attempts - v_new_attempts);
    v_locked_until := v_record.locked_until;

    RETURN QUERY SELECT
        v_is_locked,
        v_attempts_remaining,
        v_locked_until,
        v_should_lock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an account is locked
CREATE OR REPLACE FUNCTION public.check_account_lockout(
    p_email TEXT
) RETURNS TABLE(
    is_locked BOOLEAN,
    locked_until TIMESTAMPTZ,
    failed_attempts INTEGER
) AS $$
DECLARE
    v_record account_lockouts%ROWTYPE;
BEGIN
    -- Normalize email
    p_email := LOWER(TRIM(p_email));

    SELECT * INTO v_record FROM account_lockouts WHERE account_lockouts.email = p_email;

    IF v_record IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, 0;
        RETURN;
    END IF;

    -- Check if lock has expired
    IF v_record.locked_until IS NOT NULL AND v_record.locked_until <= NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, v_record.failed_attempts;
        RETURN;
    END IF;

    RETURN QUERY SELECT
        v_record.locked_until IS NOT NULL AND v_record.locked_until > NOW(),
        v_record.locked_until,
        v_record.failed_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record successful login (resets failed attempts)
CREATE OR REPLACE FUNCTION public.record_successful_login(
    p_email TEXT
) RETURNS VOID AS $$
BEGIN
    -- Normalize email
    p_email := LOWER(TRIM(p_email));

    -- Update or insert with reset values
    INSERT INTO account_lockouts (email, failed_attempts, last_successful_at, locked_until, updated_at)
    VALUES (p_email, 0, NOW(), NULL, NOW())
    ON CONFLICT (email) DO UPDATE SET
        failed_attempts = 0,
        locked_until = NULL,
        last_successful_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock an account (admin override)
CREATE OR REPLACE FUNCTION public.admin_unlock_account(
    p_email TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    -- Normalize email
    p_email := LOWER(TRIM(p_email));

    UPDATE account_lockouts
    SET
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
    WHERE account_lockouts.email = p_email;

    v_updated := FOUND;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lockout statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_lockout_stats()
RETURNS TABLE(
    total_locked_accounts INTEGER,
    total_tracked_accounts INTEGER,
    recent_lockouts INTEGER,
    avg_failed_attempts NUMERIC
) AS $$
BEGIN
    RETURN QUERY SELECT
        COUNT(*) FILTER (WHERE locked_until > NOW())::INTEGER,
        COUNT(*)::INTEGER,
        COUNT(*) FILTER (WHERE locked_until > NOW() - INTERVAL '24 hours')::INTEGER,
        COALESCE(AVG(failed_attempts), 0)::NUMERIC
    FROM account_lockouts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security_audit_logs table for tracking lockout events
-- (Separate from general audit_logs for security-specific events)
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    email TEXT,
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for security audit logs
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_email ON public.security_audit_logs(email);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON public.security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);

-- Enable RLS
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies: Only service role can access security audit logs
CREATE POLICY "Service role manages security audit logs" ON public.security_audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_email TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_severity TEXT DEFAULT 'info'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO security_audit_logs (
        event_type,
        email,
        user_id,
        ip_address,
        user_agent,
        details,
        severity
    )
    VALUES (
        p_event_type,
        LOWER(TRIM(p_email)),
        p_user_id,
        p_ip_address,
        p_user_agent,
        p_details,
        p_severity
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.account_lockouts IS 'Tracks failed login attempts and account lockouts for brute force protection';
COMMENT ON TABLE public.security_audit_logs IS 'Security-specific audit trail for authentication and access events';
COMMENT ON FUNCTION public.record_failed_login IS 'Records a failed login attempt and returns lockout status';
COMMENT ON FUNCTION public.check_account_lockout IS 'Checks if an account is currently locked';
COMMENT ON FUNCTION public.record_successful_login IS 'Records successful login and resets failed attempt counter';
COMMENT ON FUNCTION public.admin_unlock_account IS 'Admin override to unlock a locked account';
COMMENT ON FUNCTION public.log_security_event IS 'Logs security-related events for audit trail';
