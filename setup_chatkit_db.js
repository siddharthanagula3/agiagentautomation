import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYnp6YmxqcmdvdndyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzgwNzQwOCwiZXhwIjoyMDUzMzgzNDA4fQ.ecbPCoWuDCXDmbDu'; // This is the service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupChatKitTables() {
  try {
    console.log('Setting up ChatKit tables...');

    // Create chatkit_sessions table
    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chatkit_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          workflow_id TEXT NOT NULL,
          employee_id TEXT,
          employee_role TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (sessionsError) {
      console.error('Error creating chatkit_sessions table:', sessionsError);
    } else {
      console.log('✅ chatkit_sessions table created successfully');
    }

    // Create chatkit_messages table
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chatkit_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id TEXT NOT NULL REFERENCES chatkit_sessions(session_id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          message_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
          content TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (messagesError) {
      console.error('Error creating chatkit_messages table:', messagesError);
    } else {
      console.log('✅ chatkit_messages table created successfully');
    }

    // Create chatkit_workflows table
    const { error: workflowsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chatkit_workflows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workflow_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          config JSONB NOT NULL DEFAULT '{}',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (workflowsError) {
      console.error('Error creating chatkit_workflows table:', workflowsError);
    } else {
      console.log('✅ chatkit_workflows table created successfully');
    }

    // Create indexes
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_user_id ON chatkit_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_workflow_id ON chatkit_sessions(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_status ON chatkit_sessions(status);
        CREATE INDEX IF NOT EXISTS idx_chatkit_sessions_expires_at ON chatkit_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_chatkit_messages_session_id ON chatkit_messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_chatkit_messages_user_id ON chatkit_messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_chatkit_messages_created_at ON chatkit_messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_chatkit_workflows_workflow_id ON chatkit_workflows(workflow_id);
        CREATE INDEX IF NOT EXISTS idx_chatkit_workflows_is_active ON chatkit_workflows(is_active);
      `
    });

    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
    } else {
      console.log('✅ Indexes created successfully');
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE chatkit_sessions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE chatkit_messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE chatkit_workflows ENABLE ROW LEVEL SECURITY;
      `
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Insert default workflows
    const { error: workflowsInsertError } = await supabase
      .from('chatkit_workflows')
      .upsert([
        {
          workflow_id: 'default-workflow',
          name: 'Default AI Assistant',
          description: 'Default ChatGPT-powered AI assistant workflow',
          config: {
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 4000,
            tools: ['web_search', 'code_interpreter', 'file_upload'],
            system_prompt: 'You are a helpful AI assistant powered by ChatGPT. You are part of an AI workforce and should provide expert assistance in your field.'
          }
        },
        {
          workflow_id: 'executive-workflow',
          name: 'Executive AI Assistant',
          description: 'ChatGPT-powered executive leadership assistant',
          config: {
            model: 'gpt-4o',
            temperature: 0.3,
            max_tokens: 4000,
            tools: ['strategic_analysis', 'market_research', 'financial_modeling'],
            system_prompt: 'You are an executive AI assistant with expertise in strategic planning, leadership, and organizational management.'
          }
        },
        {
          workflow_id: 'technical-workflow',
          name: 'Technical AI Assistant',
          description: 'ChatGPT-powered technical development assistant',
          config: {
            model: 'gpt-4o',
            temperature: 0.2,
            max_tokens: 4000,
            tools: ['code_generation', 'debugging', 'architecture_design'],
            system_prompt: 'You are a technical AI assistant with expertise in software development, architecture, and engineering best practices.'
          }
        },
        {
          workflow_id: 'creative-workflow',
          name: 'Creative AI Assistant',
          description: 'ChatGPT-powered creative and marketing assistant',
          config: {
            model: 'gpt-4o',
            temperature: 0.8,
            max_tokens: 4000,
            tools: ['content_creation', 'design_assistance', 'marketing_strategy'],
            system_prompt: 'You are a creative AI assistant with expertise in content creation, design, and marketing strategies.'
          }
        }
      ], { onConflict: 'workflow_id' });

    if (workflowsInsertError) {
      console.error('Error inserting default workflows:', workflowsInsertError);
    } else {
      console.log('✅ Default workflows inserted successfully');
    }

    console.log('🎉 ChatKit database setup completed successfully!');

  } catch (error) {
    console.error('Error setting up ChatKit tables:', error);
  }
}

// Run the setup
setupChatKitTables();
