-- Add missing RLS policies for tables that have RLS enabled but no policies
-- This addresses critical security vulnerabilities

-- User API Keys - Users can only manage their own API keys
CREATE POLICY "Users can manage their own API keys" ON public.user_api_keys
    FOR ALL USING (auth.uid() = user_id);

-- User Credits - Users can only view their own credits
CREATE POLICY "Users can view their own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- User Subscriptions - Users can only view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Credit Transactions - Users can only view their own credit transactions
CREATE POLICY "Users can view their own credit transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- User Sessions - Users can manage their own sessions
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Integration Configs - Users can manage their own integration configurations
CREATE POLICY "Users can manage their own integration configs" ON public.integration_configs
    FOR ALL USING (auth.uid() = user_id);

-- Automation Executions - Users can view their own automation executions
CREATE POLICY "Users can view their own automation executions" ON public.automation_executions
    FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs - Only service role can access audit logs
CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Webhook Configs - Users can manage their own webhook configurations
CREATE POLICY "Users can manage their own webhook configs" ON public.webhook_configs
    FOR ALL USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON POLICY "Users can manage their own API keys" ON public.user_api_keys IS 'Users can only access their own API keys for security';
COMMENT ON POLICY "Users can view their own credits" ON public.user_credits IS 'Users can only view their own credit balance';
COMMENT ON POLICY "Users can view their own subscriptions" ON public.user_subscriptions IS 'Users can only view their own subscription details';
COMMENT ON POLICY "Users can view their own credit transactions" ON public.credit_transactions IS 'Users can only view their own credit transaction history';
COMMENT ON POLICY "Users can manage their own sessions" ON public.user_sessions IS 'Users can only manage their own session data';
COMMENT ON POLICY "Users can manage their own integration configs" ON public.integration_configs IS 'Users can only manage their own integration configurations';
COMMENT ON POLICY "Users can view their own automation executions" ON public.automation_executions IS 'Users can only view their own automation execution logs';
COMMENT ON POLICY "Service role can manage audit logs" ON public.audit_logs IS 'Only service role can access system audit logs';
COMMENT ON POLICY "Users can manage their own webhook configs" ON public.webhook_configs IS 'Users can only manage their own webhook configurations';
