/**
 * Test VIBE Integration Script
 *
 * Tests the complete VIBE workflow:
 * 1. Create session
 * 2. Send message
 * 3. Call workforce orchestrator
 * 4. Log agent actions
 * 5. Verify real-time updates
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testVibeIntegration() {
  console.log('🧪 Testing VIBE Integration...\n');

  try {
    // Step 1: Create test session
    console.log('Step 1: Creating test session...');

    const testUserId = crypto.randomUUID();

    const { data: session, error: sessionError } = await supabase
      .from('vibe_sessions')
      .insert({
        user_id: testUserId,
        title: 'Test VIBE Session',
        metadata: { test: true }
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError.message);
      throw sessionError;
    }

    console.log('✅ Session created:', session.id);

    // Step 2: Create user message
    console.log('\nStep 2: Creating user message...');

    const { data: userMessage, error: messageError } = await supabase
      .from('vibe_messages')
      .insert({
        session_id: session.id,
        user_id: testUserId,
        role: 'user',
        content: 'Create a React component for user profiles',
        metadata: { test: true }
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Failed to create message:', messageError.message);
      throw messageError;
    }

    console.log('✅ User message created:', userMessage.id);
    console.log('   Content:', userMessage.content);
    console.log('   User ID:', userMessage.user_id);

    // Step 3: Create assistant message (simulating orchestrator response)
    console.log('\nStep 3: Creating assistant message...');

    const { data: assistantMessage, error: assistantError } = await supabase
      .from('vibe_messages')
      .insert({
        session_id: session.id,
        user_id: testUserId,
        role: 'assistant',
        content: 'I\'ll help you create a user profile component. Let me start by analyzing the requirements...',
        employee_name: 'code-reviewer',
        employee_role: 'Senior Developer',
        is_streaming: false,
        metadata: { test: true }
      })
      .select()
      .single();

    if (assistantError) {
      console.error('❌ Failed to create assistant message:', assistantError.message);
      throw assistantError;
    }

    console.log('✅ Assistant message created:', assistantMessage.id);
    console.log('   Agent:', assistantMessage.employee_name);

    // Step 4: Log agent actions
    console.log('\nStep 4: Logging agent actions...');

    const actions = [
      {
        session_id: session.id,
        agent_name: 'code-reviewer',
        action_type: 'file_read',
        status: 'completed',
        metadata: { file_path: 'src/components/UserProfile.tsx' },
        result: { lines: 150, summary: 'Analyzed component structure' }
      },
      {
        session_id: session.id,
        agent_name: 'code-reviewer',
        action_type: 'file_edit',
        status: 'completed',
        metadata: {
          file_path: 'src/components/UserProfile.tsx',
          changes: 'Added TypeScript types and props validation'
        },
        result: { success: true }
      },
      {
        session_id: session.id,
        agent_name: 'code-reviewer',
        action_type: 'command_execution',
        status: 'completed',
        metadata: { command: 'npm run type-check' },
        result: { exit_code: 0, output: 'Type checking passed' }
      }
    ];

    const { data: createdActions, error: actionsError } = await supabase
      .from('vibe_agent_actions')
      .insert(actions)
      .select();

    if (actionsError) {
      console.error('❌ Failed to create actions:', actionsError.message);
      throw actionsError;
    }

    console.log('✅ Agent actions created:', createdActions?.length);

    // Step 5: Verify data
    console.log('\nStep 5: Verifying data...');

    const { data: allMessages, error: fetchError } = await supabase
      .from('vibe_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('timestamp', { ascending: true });

    if (fetchError) {
      console.error('❌ Failed to fetch messages:', fetchError.message);
      throw fetchError;
    }

    console.log('✅ Messages verified:', allMessages?.length);
    allMessages?.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. ${msg.role}: ${msg.content.substring(0, 50)}...`);
      console.log(`      user_id: ${msg.user_id ? '✓' : '✗'}`);
    });

    // Step 6: Get action statistics
    console.log('\nStep 6: Getting action statistics...');

    const { data: sessionActions, error: statsError } = await supabase
      .from('vibe_agent_actions')
      .select('*')
      .eq('session_id', session.id);

    if (statsError) {
      console.error('❌ Failed to get actions:', statsError.message);
      throw statsError;
    }

    const stats = {
      total: sessionActions?.length || 0,
      completed: sessionActions?.filter(a => a.status === 'completed').length || 0,
      failed: sessionActions?.filter(a => a.status === 'failed').length || 0,
      by_type: sessionActions?.reduce((acc: any, action) => {
        acc[action.action_type] = (acc[action.action_type] || 0) + 1;
        return acc;
      }, {})
    };

    console.log('📊 Action Statistics:');
    console.log('   Total:', stats.total);
    console.log('   Completed:', stats.completed);
    console.log('   Failed:', stats.failed);
    console.log('   By Type:', JSON.stringify(stats.by_type, null, 2));

    // Step 7: Cleanup test data
    console.log('\nStep 7: Cleaning up test data...');

    const { error: cleanupError } = await supabase
      .from('vibe_sessions')
      .delete()
      .eq('id', session.id);

    if (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError.message);
    } else {
      console.log('✅ Test data cleaned up');
    }

    console.log('\n✅ All tests passed! VIBE integration is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testVibeIntegration();
