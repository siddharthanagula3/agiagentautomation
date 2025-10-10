/**
 * Database Setup Guide Page
 * Provides instructions for setting up the database to enable free hiring
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  ArrowLeft,
  Settings,
  Shield,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const SetupGuidePage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- ========================================
-- COMPLETE DATABASE SETUP FOR FREE HIRING
-- ========================================
-- Run this script in Supabase SQL Editor to set up the complete database
-- This includes: purchased_employees table, RLS policies, indexes, and token_usage table

-- 1. Create purchased_employees table for free AI Employee hiring
-- ========================================
DROP TABLE IF EXISTS purchased_employees CASCADE;

CREATE TABLE purchased_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, employee_id)
);

-- 2. Create indexes for performance
-- ========================================
CREATE INDEX idx_purchased_employees_user_id ON purchased_employees (user_id);
CREATE INDEX idx_purchased_employees_employee_id ON purchased_employees (employee_id);
CREATE INDEX idx_purchased_employees_is_active ON purchased_employees (is_active);

-- 3. Enable Row Level Security
-- ========================================
ALTER TABLE purchased_employees ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- ========================================
CREATE POLICY "Users can view their own purchased employees" ON purchased_employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchased employees" ON purchased_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchased employees" ON purchased_employees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchased employees" ON purchased_employees
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Grant permissions
-- ========================================
GRANT ALL ON purchased_employees TO authenticated;
GRANT ALL ON purchased_employees TO service_role;

-- 6. Create token_usage table if it doesn't exist
-- ========================================
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  llm_provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create indexes for token_usage
-- ========================================
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage (user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_llm_provider ON token_usage (llm_provider);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage (created_at);

-- 8. Enable RLS for token_usage
-- ========================================
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for token_usage
-- ========================================
CREATE POLICY "Users can view their own token usage" ON token_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all token usage" ON token_usage
  FOR ALL USING (auth.role() = 'service_role');

-- 10. Grant permissions for token_usage
-- ========================================
GRANT ALL ON token_usage TO authenticated;
GRANT ALL ON token_usage TO service_role;

-- 11. Create function to get user token limits based on plan
-- ========================================
CREATE OR REPLACE FUNCTION get_user_token_limits(user_uuid UUID)
RETURNS TABLE (
  plan TEXT,
  total_limit BIGINT,
  per_llm_limit BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.plan, 'free')::TEXT as plan,
    CASE 
      WHEN COALESCE(u.plan, 'free') = 'max' THEN 40000000  -- 40M total
      WHEN COALESCE(u.plan, 'free') = 'pro' THEN 10000000  -- 10M total
      ELSE 1000000  -- 1M total for free
    END as total_limit,
    CASE 
      WHEN COALESCE(u.plan, 'free') = 'max' THEN 10000000  -- 10M per LLM
      WHEN COALESCE(u.plan, 'free') = 'pro' THEN 2500000   -- 2.5M per LLM
      ELSE 250000  -- 250K per LLM for free
    END as per_llm_limit
  FROM users u
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permission on the function
-- ========================================
GRANT EXECUTE ON FUNCTION get_user_token_limits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_token_limits(UUID) TO service_role;

-- 13. Create function to get user token usage summary
-- ========================================
CREATE OR REPLACE FUNCTION get_user_token_usage_summary(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  llm_provider TEXT,
  total_tokens BIGINT,
  total_cost DECIMAL(10, 6)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.llm_provider,
    SUM(tu.total_tokens)::BIGINT as total_tokens,
    SUM(tu.cost_usd) as total_cost
  FROM token_usage tu
  WHERE tu.user_id = user_uuid
    AND tu.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY tu.llm_provider
  ORDER BY total_tokens DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permission on the function
-- ========================================
GRANT EXECUTE ON FUNCTION get_user_token_usage_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_token_usage_summary(UUID, INTEGER) TO service_role;

-- ========================================
-- SETUP COMPLETE
-- ========================================
-- The database is now ready for:
-- 1. Free AI Employee hiring (purchased_employees table)
-- 2. Token usage tracking (token_usage table)
-- 3. Pro/Max subscription plans with proper limits
-- 4. Row Level Security for data protection
-- 5. Performance indexes for fast queries

-- Test the setup by running:
-- SELECT * FROM get_user_token_limits('your-user-id-here');
-- SELECT * FROM get_user_token_usage_summary('your-user-id-here', 30);`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      toast.success('SQL script copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen pt-24 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <Database className="h-8 w-8 text-white" />
              </div>
              <div>
                <Badge className="mb-2 glass">
                  <Settings className="mr-2 h-3 w-3" />
                  Database Setup
                </Badge>
                <h1 className="text-4xl font-bold mb-2">Database Setup Guide</h1>
                <p className="text-xl text-muted-foreground">
                  Set up your database to enable free AI Employee hiring
                </p>
              </div>
            </div>

            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="glass">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Alert */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Alert className="glass-strong border-orange-200 bg-orange-50/50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Database Setup Required:</strong> The "Failed to hire employee" error occurs because the database tables haven't been created yet. Follow the steps below to set up your database and enable free hiring.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-strong h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                Access Supabase Dashboard
              </CardTitle>
              <CardDescription>
                Go to your Supabase project dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">1. Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/dashboard</a></p>
                <p className="text-sm text-muted-foreground">2. Select your project</p>
                <p className="text-sm text-muted-foreground">3. Navigate to the SQL Editor (left sidebar)</p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-strong h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                Run SQL Script
              </CardTitle>
              <CardDescription>
                Execute the database setup script
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">1. Click "New Query" in SQL Editor</p>
                <p className="text-sm text-muted-foreground">2. Paste the SQL script (copied below)</p>
                <p className="text-sm text-muted-foreground">3. Click "Run" to execute</p>
                <p className="text-sm text-muted-foreground">4. Verify tables are created successfully</p>
              </div>
              
              <Button 
                onClick={copyToClipboard}
                className="w-full gradient-primary text-white"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy SQL Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SQL Script */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Database Setup SQL Script
            </CardTitle>
            <CardDescription>
              Copy and paste this script into your Supabase SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
                <code>{sqlScript}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What This Creates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              What This Setup Creates
            </CardTitle>
            <CardDescription>
              The SQL script will create the following database components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Database className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">purchased_employees Table</h4>
                    <p className="text-sm text-muted-foreground">Stores hired AI employees with proper relationships and constraints</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Performance Indexes</h4>
                    <p className="text-sm text-muted-foreground">Optimized indexes for fast queries on user_id, employee_id, and status</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Row Level Security</h4>
                    <p className="text-sm text-muted-foreground">RLS policies ensure users can only access their own data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Token Usage System</h4>
                    <p className="text-sm text-muted-foreground">Complete token tracking and billing analytics system</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              After Setup
            </CardTitle>
            <CardDescription>
              Once you've run the SQL script, you can start hiring AI employees for free!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Free AI Employee hiring will work</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Hired employees will appear in your workforce</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Chat functionality will be available</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Pro/Max subscription features will work</span>
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <Link to="/marketplace" className="flex-1">
                <Button className="w-full gradient-primary text-white">
                  <Zap className="h-4 w-4 mr-2" />
                  Start Hiring AI Employees
                </Button>
              </Link>
              <Link to="/workforce">
                <Button variant="outline">
                  View Workforce
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupGuidePage;
