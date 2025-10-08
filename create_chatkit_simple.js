import { createClient } from '@supabase/supabase-js';

// Use the anon key instead of service key
const supabaseUrl = 'https://lywdzvfibhzbljrgovwr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5d2R6dmZpYnp6YmxqcmdvdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MDc0MDgsImV4cCI6MjA1MzM4MzQwOH0.ecbPCoWuDCXDmbDu';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createChatKitTables() {
  try {
    console.log('Creating ChatKit tables...');

    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }

    console.log('Existing tables:', tables?.map(t => t.table_name) || []);

    // Try to create the tables using direct SQL execution
    const createTablesSQL = `
      -- Create ChatKit sessions table
      CREATE TABLE IF NOT EXISTS chatkit_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL UNIQUE,
        user_id UUID NOT NULL,
        workflow_id TEXT NOT NULL,
        employee_id TEXT,
        employee_role TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create ChatKit messages table
      CREATE TABLE IF NOT EXISTS chatkit_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        user_id UUID NOT NULL,
        message_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create ChatKit workflows table
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
    `;

    // Try to execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql: createTablesSQL });
    
    if (error) {
      console.error('Error creating tables:', error);
    } else {
      console.log('✅ Tables created successfully');
    }

    // Insert default workflows
    const workflows = [
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
    ];

    for (const workflow of workflows) {
      const { error: insertError } = await supabase
        .from('chatkit_workflows')
        .upsert(workflow, { onConflict: 'workflow_id' });

      if (insertError) {
        console.error(`Error inserting workflow ${workflow.workflow_id}:`, insertError);
      } else {
        console.log(`✅ Workflow ${workflow.workflow_id} inserted successfully`);
      }
    }

    console.log('🎉 ChatKit setup completed!');

  } catch (error) {
    console.error('Error:', error);
  }
}

createChatKitTables();
