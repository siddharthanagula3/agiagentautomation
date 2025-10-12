// Database configuration and schema definitions
// Based on PRD specifications

export const DATABASE_SCHEMA = {
  // Users & Authentication
  users: `
    CREATE TABLE users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      subscription_tier TEXT DEFAULT 'starter',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_subscription ON users(subscription_tier);
    
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can update own profile" ON users
      FOR UPDATE USING (auth.uid() = id);
  `,

  // AI Employees
  ai_employees: `
    CREATE TABLE ai_employees (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT,
      level TEXT DEFAULT 'mid',
      status TEXT DEFAULT 'available',
      capabilities JSONB,
      system_prompt TEXT NOT NULL,
      tools JSONB DEFAULT '[]',
      workflows JSONB DEFAULT '[]',
      performance JSONB DEFAULT '{}',
      availability JSONB DEFAULT '{}',
      cost JSONB DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_employees_role ON ai_employees(role);
    CREATE INDEX idx_ai_employees_category ON ai_employees(category);
    CREATE INDEX idx_ai_employees_status ON ai_employees(status);
    CREATE INDEX idx_ai_employees_level ON ai_employees(level);
    
    ALTER TABLE ai_employees ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Anyone can view ai employees" ON ai_employees
      FOR SELECT USING (true);
  `,

  // Employee Hires (User-Employee Relationships)
  employee_hires: `
    CREATE TABLE employee_hires (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
      hired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE,
      status TEXT DEFAULT 'active',
      payment_status TEXT DEFAULT 'pending',
      payment_amount DECIMAL(10,2),
      UNIQUE(user_id, employee_id)
    );
    
    CREATE INDEX idx_employee_hires_user ON employee_hires(user_id);
    CREATE INDEX idx_employee_hires_employee ON employee_hires(employee_id);
    CREATE INDEX idx_employee_hires_status ON employee_hires(status);
    
    ALTER TABLE employee_hires ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own hires" ON employee_hires
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create hires" ON employee_hires
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own hires" ON employee_hires
      FOR UPDATE USING (auth.uid() = user_id);
  `,

  // AI Workforce
  ai_workforces: `
    CREATE TABLE ai_workforces (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      ceo_employee_id UUID REFERENCES ai_employees(id),
      members JSONB DEFAULT '[]',
      structure JSONB DEFAULT '{}',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_ai_workforces_user ON ai_workforces(user_id);
    CREATE INDEX idx_ai_workforces_status ON ai_workforces(status);
    
    ALTER TABLE ai_workforces ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own workforces" ON ai_workforces
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create workforces" ON ai_workforces
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own workforces" ON ai_workforces
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own workforces" ON ai_workforces
      FOR DELETE USING (auth.uid() = user_id);
  `,

  // Jobs/Tasks
  jobs: `
    CREATE TABLE jobs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      requirements JSONB DEFAULT '{}',
      assigned_to UUID[] DEFAULT '{}',
      workforce_id UUID REFERENCES ai_workforces(id),
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium',
      deadline TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      started_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      result JSONB
    );
    
    CREATE INDEX idx_jobs_user ON jobs(user_id);
    CREATE INDEX idx_jobs_status ON jobs(status);
    CREATE INDEX idx_jobs_priority ON jobs(priority);
    CREATE INDEX idx_jobs_created ON jobs(created_at);
    
    ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own jobs" ON jobs
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create jobs" ON jobs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own jobs" ON jobs
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own jobs" ON jobs
      FOR DELETE USING (auth.uid() = user_id);
  `,

  // Tool Executions
  tool_executions: `
    CREATE TABLE tool_executions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
      job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
      tool_id TEXT NOT NULL,
      tool_type TEXT NOT NULL,
      parameters JSONB DEFAULT '{}',
      result JSONB,
      status TEXT DEFAULT 'pending',
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      duration_ms INTEGER,
      error_message TEXT
    );
    
    CREATE INDEX idx_tool_executions_employee ON tool_executions(employee_id);
    CREATE INDEX idx_tool_executions_job ON tool_executions(job_id);
    CREATE INDEX idx_tool_executions_tool ON tool_executions(tool_id);
    CREATE INDEX idx_tool_executions_status ON tool_executions(status);
    CREATE INDEX idx_tool_executions_executed ON tool_executions(executed_at);
    
    ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view tool executions for their jobs" ON tool_executions
      FOR SELECT USING (
        job_id IN (
          SELECT id FROM jobs WHERE user_id = auth.uid()
        )
      );
  `,

  // Chat Sessions
  chat_sessions: `
    CREATE TABLE chat_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES ai_employees(id) ON DELETE CASCADE,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ended_at TIMESTAMP WITH TIME ZONE,
      message_count INTEGER DEFAULT 0,
      tools_used INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active'
    );
    
    CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
    CREATE INDEX idx_chat_sessions_employee ON chat_sessions(employee_id);
    CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
    
    ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own chat sessions" ON chat_sessions
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create chat sessions" ON chat_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own chat sessions" ON chat_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  `,

  // Chat Messages
  chat_messages: `
    CREATE TABLE chat_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'employee')),
      sender_id UUID NOT NULL,
      message TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
    CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_type, sender_id);
    CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
    
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view messages from their sessions" ON chat_messages
      FOR SELECT USING (
        session_id IN (
          SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
      );
    
    CREATE POLICY "Users can create messages in their sessions" ON chat_messages
      FOR INSERT WITH CHECK (
        session_id IN (
          SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
      );
  `,

  // Automated Workflows
  workflows: `
    CREATE TABLE workflows (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      trigger_type TEXT NOT NULL,
      trigger_config JSONB DEFAULT '{}',
      steps JSONB DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      last_executed TIMESTAMP WITH TIME ZONE,
      execution_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_workflows_user ON workflows(user_id);
    CREATE INDEX idx_workflows_status ON workflows(status);
    CREATE INDEX idx_workflows_trigger ON workflows(trigger_type);
    
    ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own workflows" ON workflows
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create workflows" ON workflows
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own workflows" ON workflows
      FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete own workflows" ON workflows
      FOR DELETE USING (auth.uid() = user_id);
  `,

  // Workflow Executions
  workflow_executions: `
    CREATE TABLE workflow_executions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
      trigger_data JSONB DEFAULT '{}',
      status TEXT DEFAULT 'running',
      started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      result JSONB,
      error_message TEXT,
      steps_completed INTEGER DEFAULT 0,
      total_steps INTEGER DEFAULT 0
    );
    
    CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
    CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
    CREATE INDEX idx_workflow_executions_started ON workflow_executions(started_at);
    
    ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view executions for their workflows" ON workflow_executions
      FOR SELECT USING (
        workflow_id IN (
          SELECT id FROM workflows WHERE user_id = auth.uid()
        )
      );
  `,

  // Billing & Payments
  billing: `
    CREATE TABLE billing (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      current_period_start TIMESTAMP WITH TIME ZONE,
      current_period_end TIMESTAMP WITH TIME ZONE,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      metadata JSONB DEFAULT '{}'
    );
    
    CREATE INDEX idx_billing_user ON billing(user_id);
    CREATE INDEX idx_billing_status ON billing(status);
    CREATE INDEX idx_billing_stripe_customer ON billing(stripe_customer_id);
    
    ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own billing" ON billing
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own billing" ON billing
      FOR UPDATE USING (auth.uid() = user_id);
  `,

  // Analytics Events
  analytics_events: `
    CREATE TABLE analytics_events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      employee_id UUID REFERENCES ai_employees(id),
      job_id UUID REFERENCES jobs(id),
      workflow_id UUID REFERENCES workflows(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
    CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
    CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
    CREATE INDEX idx_analytics_events_employee ON analytics_events(employee_id);
    CREATE INDEX idx_analytics_events_job ON analytics_events(job_id);
    
    ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own analytics events" ON analytics_events
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "System can insert analytics events" ON analytics_events
      FOR INSERT WITH CHECK (true);
  `,
};

// Function to create all tables
export const createAllTables = async (supabase: any) => {
  const tables = Object.values(DATABASE_SCHEMA);

  for (const tableSQL of tables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: tableSQL });
      if (error) {
        console.error('Error creating table:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to create table:', error);
      throw error;
    }
  }

  console.log('All database tables created successfully');
};

// Function to create indexes
export const createIndexes = async (supabase: any) => {
  const indexQueries = [
    // Additional performance indexes
    `CREATE INDEX CONCURRENTLY idx_jobs_assigned_to ON jobs USING GIN(assigned_to);`,
    `CREATE INDEX CONCURRENTLY idx_ai_employees_capabilities ON ai_employees USING GIN(capabilities);`,
    `CREATE INDEX CONCURRENTLY idx_ai_employees_tools ON ai_employees USING GIN(tools);`,
    `CREATE INDEX CONCURRENTLY idx_tool_executions_parameters ON tool_executions USING GIN(parameters);`,
    `CREATE INDEX CONCURRENTLY idx_chat_messages_metadata ON chat_messages USING GIN(metadata);`,
    `CREATE INDEX CONCURRENTLY idx_workflows_steps ON workflows USING GIN(steps);`,
    `CREATE INDEX CONCURRENTLY idx_analytics_events_data ON analytics_events USING GIN(event_data);`,
  ];

  for (const indexSQL of indexQueries) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error) {
        console.warn('Index creation warning:', error);
      }
    } catch (error) {
      console.warn('Index creation failed:', error);
    }
  }
};

// Function to set up RLS policies
export const setupRLSPolicies = async (supabase: any) => {
  const policies = [
    // Additional security policies
    `CREATE POLICY "Users can only access their own data" ON users
      FOR ALL USING (auth.uid() = id);`,

    `CREATE POLICY "Employees can be viewed by all authenticated users" ON ai_employees
      FOR SELECT USING (auth.role() = 'authenticated');`,

    `CREATE POLICY "Tool executions are viewable by job owners" ON tool_executions
      FOR SELECT USING (
        job_id IN (
          SELECT id FROM jobs WHERE user_id = auth.uid()
        )
      );`,
  ];

  for (const policySQL of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policySQL });
      if (error) {
        console.warn('Policy creation warning:', error);
      }
    } catch (error) {
      console.warn('Policy creation failed:', error);
    }
  }
};
