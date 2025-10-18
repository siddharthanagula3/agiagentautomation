-- Add missing RLS policies for 9 unprotected tables
-- This migration addresses CRITICAL security vulnerability F002

-- User API Keys - CRITICAL SECURITY
CREATE POLICY "Users can manage their own API keys" 
ON user_api_keys FOR ALL 
USING (auth.uid() = user_id);

-- User Credits - Financial Data
CREATE POLICY "Users can view their own credits" 
ON user_credits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits" 
ON user_credits FOR ALL 
USING (auth.role() = 'service_role');

-- User Subscriptions - Billing Data
CREATE POLICY "Users can view their own subscriptions" 
ON user_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" 
ON user_subscriptions FOR ALL 
USING (auth.role() = 'service_role');

-- Credit Transactions - Financial History
CREATE POLICY "Users can view their own credit transactions" 
ON credit_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- User Sessions - Session Management
CREATE POLICY "Users can manage their own sessions" 
ON user_sessions FOR ALL 
USING (auth.uid() = user_id);

-- Integration Configs - Integration Settings
CREATE POLICY "Users can manage their own integration configs" 
ON integration_configs FOR ALL 
USING (auth.uid() = user_id);

-- Automation Executions - Execution Logs
CREATE POLICY "Users can view their own automation executions" 
ON automation_executions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create automation executions" 
ON automation_executions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Audit Logs - Admin Only
CREATE POLICY "Service role can manage audit logs" 
ON audit_logs FOR ALL 
USING (auth.role() = 'service_role');

-- Webhook Configs - Integration Settings
CREATE POLICY "Users can manage their own webhook configs" 
ON webhook_configs FOR ALL 
USING (auth.uid() = user_id);
