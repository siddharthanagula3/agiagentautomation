-- Create webhook audit log table for tracking Stripe webhook events
CREATE TABLE IF NOT EXISTS public.webhook_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_request_id ON public.webhook_audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_event_id ON public.webhook_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_timestamp ON public.webhook_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_webhook_audit_log_event_type ON public.webhook_audit_log(event_type);

-- Enable RLS
ALTER TABLE public.webhook_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only service role can access audit logs
CREATE POLICY "Service role can manage webhook audit logs" ON public.webhook_audit_log
    FOR ALL USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.webhook_audit_log IS 'Audit trail for Stripe webhook events and processing';
COMMENT ON COLUMN public.webhook_audit_log.request_id IS 'Unique request identifier for tracking';
COMMENT ON COLUMN public.webhook_audit_log.event_id IS 'Stripe event identifier';
COMMENT ON COLUMN public.webhook_audit_log.event_type IS 'Type of Stripe event (e.g., checkout.session.completed)';
COMMENT ON COLUMN public.webhook_audit_log.action IS 'Action taken (e.g., processing_started, processing_completed)';
COMMENT ON COLUMN public.webhook_audit_log.details IS 'Additional details about the event processing';
