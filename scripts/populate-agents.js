import { createClient } from '@supabase/supabase-js';
import AI_AGENTS_DATA from '../src/data/aiAgents.ts';

const SUPABASE_URL = "https://spmkzfgswjbilimxtfob.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbWt6Zmdzd2piaWxpbXh0Zm9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY5OTkwOSwiZXhwIjoyMDc0Mjc1OTA5fQ.YourServiceKeyHere";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function populateAgents() {
  console.log('🚀 Starting to populate AI agents...');
  
  try {
    // Clear existing agents
    console.log('🧹 Clearing existing agents...');
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except a dummy condition
    
    if (deleteError) {
      console.error('Error clearing agents:', deleteError);
    } else {
      console.log('✅ Existing agents cleared');
    }

    // Insert all agents
    console.log('📝 Inserting AI agents...');
    const { data, error } = await supabase
      .from('ai_agents')
      .insert(AI_AGENTS_DATA);

    if (error) {
      console.error('❌ Error inserting agents:', error);
      return;
    }

    console.log(`✅ Successfully inserted ${AI_AGENTS_DATA.length} AI agents!`);
    
    // Verify insertion
    const { data: count, error: countError } = await supabase
      .from('ai_agents')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('Error counting agents:', countError);
    } else {
      console.log(`📊 Total agents in database: ${count?.length || 0}`);
    }

    // Show categories
    const categories = [...new Set(AI_AGENTS_DATA.map(agent => agent.category))];
    console.log('📂 Categories created:');
    categories.forEach(category => {
      const count = AI_AGENTS_DATA.filter(agent => agent.category === category).length;
      console.log(`  - ${category}: ${count} agents`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
populateAgents();
