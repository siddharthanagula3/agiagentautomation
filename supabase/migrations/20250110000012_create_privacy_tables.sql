-- Create privacy and GDPR compliance tables
-- This migration creates tables for managing data privacy, consent, and GDPR compliance

-- Create data_subject_requests table for GDPR data subject requests
CREATE TABLE public.data_subject_requests (
    id text PRIMARY KEY,
    user_id uuid NOT NULL,
    type text NOT NULL CHECK (type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    requested_at timestamptz NOT NULL,
    completed_at timestamptz,
    details jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create privacy_audit_log table for tracking privacy-related events
CREATE TABLE public.privacy_audit_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL CHECK (event_type IN ('consent_change', 'data_access', 'data_erasure', 'data_export', 'privacy_policy_update')),
    user_id text,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Create consent_preferences table for storing user consent preferences
CREATE TABLE public.consent_preferences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    essential boolean NOT NULL DEFAULT true,
    analytics boolean NOT NULL DEFAULT false,
    marketing boolean NOT NULL DEFAULT false,
    personalization boolean NOT NULL DEFAULT false,
    third_party boolean NOT NULL DEFAULT false,
    consent_version text NOT NULL DEFAULT '1.0',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Create data_retention_policies table for managing data retention rules
CREATE TABLE public.data_retention_policies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name text NOT NULL,
    retention_period_days integer NOT NULL,
    anonymize_after_days integer,
    delete_after_days integer,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create privacy_notices table for managing privacy notices and updates
CREATE TABLE public.privacy_notices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    version text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    effective_date timestamptz NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_data_subject_requests_user_id ON public.data_subject_requests(user_id);
CREATE INDEX idx_data_subject_requests_status ON public.data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_type ON public.data_subject_requests(type);
CREATE INDEX idx_data_subject_requests_requested_at ON public.data_subject_requests(requested_at DESC);

CREATE INDEX idx_privacy_audit_log_event_type ON public.privacy_audit_log(event_type);
CREATE INDEX idx_privacy_audit_log_user_id ON public.privacy_audit_log(user_id);
CREATE INDEX idx_privacy_audit_log_created_at ON public.privacy_audit_log(created_at DESC);

CREATE INDEX idx_consent_preferences_user_id ON public.consent_preferences(user_id);
CREATE INDEX idx_consent_preferences_updated_at ON public.consent_preferences(updated_at DESC);

CREATE INDEX idx_data_retention_policies_table_name ON public.data_retention_policies(table_name);
CREATE INDEX idx_data_retention_policies_is_active ON public.data_retention_policies(is_active);

CREATE INDEX idx_privacy_notices_version ON public.privacy_notices(version);
CREATE INDEX idx_privacy_notices_effective_date ON public.privacy_notices(effective_date DESC);
CREATE INDEX idx_privacy_notices_is_active ON public.privacy_notices(is_active);

-- Enable Row Level Security
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_notices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data_subject_requests
CREATE POLICY "Users can view their own data subject requests" ON public.data_subject_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data subject requests" ON public.data_subject_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all data subject requests" ON public.data_subject_requests
    USING (auth.role() = 'service_role');

-- Create RLS policies for privacy_audit_log
CREATE POLICY "Service role can manage privacy audit logs" ON public.privacy_audit_log
    USING (auth.role() = 'service_role');

-- Create RLS policies for consent_preferences
CREATE POLICY "Users can view their own consent preferences" ON public.consent_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent preferences" ON public.consent_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent preferences" ON public.consent_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all consent preferences" ON public.consent_preferences
    USING (auth.role() = 'service_role');

-- Create RLS policies for data_retention_policies
CREATE POLICY "Service role can manage data retention policies" ON public.data_retention_policies
    USING (auth.role() = 'service_role');

-- Create RLS policies for privacy_notices
CREATE POLICY "Anyone can view active privacy notices" ON public.privacy_notices
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage privacy notices" ON public.privacy_notices
    USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_data_subject_requests_updated_at 
    BEFORE UPDATE ON public.data_subject_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_preferences_updated_at 
    BEFORE UPDATE ON public.consent_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at 
    BEFORE UPDATE ON public.data_retention_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_notices_updated_at 
    BEFORE UPDATE ON public.privacy_notices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log privacy events
CREATE OR REPLACE FUNCTION log_privacy_event(
    p_event_type text,
    p_user_id text DEFAULT NULL,
    p_details jsonb DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.privacy_audit_log (
        event_type,
        user_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_event_type,
        p_user_id,
        p_details,
        p_ip_address,
        p_user_agent
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user consent status
CREATE OR REPLACE FUNCTION get_user_consent_status(p_user_id uuid)
RETURNS TABLE (
    essential boolean,
    analytics boolean,
    marketing boolean,
    personalization boolean,
    third_party boolean,
    consent_version text,
    last_updated timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.essential,
        cp.analytics,
        cp.marketing,
        cp.personalization,
        cp.third_party,
        cp.consent_version,
        cp.updated_at
    FROM public.consent_preferences cp
    WHERE cp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has consented to specific category
CREATE OR REPLACE FUNCTION has_user_consent(
    p_user_id uuid,
    p_category text
)
RETURNS boolean AS $$
DECLARE
    consent_value boolean;
BEGIN
    SELECT CASE p_category
        WHEN 'essential' THEN cp.essential
        WHEN 'analytics' THEN cp.analytics
        WHEN 'marketing' THEN cp.marketing
        WHEN 'personalization' THEN cp.personalization
        WHEN 'third_party' THEN cp.third_party
        ELSE false
    END INTO consent_value
    FROM public.consent_preferences cp
    WHERE cp.user_id = p_user_id;
    
    RETURN COALESCE(consent_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default data retention policies
INSERT INTO public.data_retention_policies (table_name, retention_period_days, anonymize_after_days, delete_after_days) VALUES
('audit_logs', 2555, 1825, 2555), -- 7 years retention, anonymize after 5 years
('chat_messages', 365, 180, 365), -- 1 year retention, anonymize after 6 months
('chat_sessions', 365, 180, 365), -- 1 year retention, anonymize after 6 months
('backup_metadata', 2555, NULL, 2555), -- 7 years retention
('privacy_audit_log', 2555, 1825, 2555), -- 7 years retention, anonymize after 5 years
('data_subject_requests', 2555, 1825, 2555); -- 7 years retention, anonymize after 5 years

-- Insert default privacy notice
INSERT INTO public.privacy_notices (version, title, content, effective_date) VALUES
('1.0', 'Privacy Policy', 'This privacy policy explains how we collect, use, and protect your personal data in accordance with GDPR and other applicable privacy laws.', now());

-- Log the initial setup
SELECT log_privacy_event(
    'privacy_policy_update',
    NULL,
    jsonb_build_object('action', 'initial_setup', 'version', '1.0'),
    NULL,
    'system'
);
