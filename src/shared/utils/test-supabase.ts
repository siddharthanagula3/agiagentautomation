/**
 * Supabase Connection Tester
 * Use this in browser console to test if Supabase is working
 */

import supabaseClient from '@/integrations/supabase/client';

export async function testSupabaseConnection() {
  console.log('=== TESTING SUPABASE CONNECTION ===');

  try {
    const supabase = supabaseClient;

    // Test 1: Check if client exists
    console.log('1. Supabase client:', supabase ? '✅ EXISTS' : '❌ MISSING');

    // Test 2: Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log(
      '2. Auth user:',
      user ? `✅ ${user.email}` : '❌ Not authenticated'
    );
    if (authError) console.error('   Auth error:', authError);

    if (!user) {
      console.log('❌ Cannot continue tests - user not authenticated');
      return;
    }

    // Test 3: Try to read purchased_employees
    console.log('3. Testing purchased_employees table read...');
    const { data: employees, error: readError } = await supabase
      .from('purchased_employees')
      .select('*')
      .eq('user_id', user.id);

    if (readError) {
      console.error('   ❌ Read error:', readError);
      console.error('   Error details:', JSON.stringify(readError, null, 2));
    } else {
      console.log('   ✅ Read successful');
      console.log('   Employees found:', employees?.length || 0);
      console.log('   Data:', employees);
    }

    // Test 4: Try to read chat_sessions
    console.log('4. Testing chat_sessions table read...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('   ❌ Read error:', sessionsError);
      console.error(
        '   Error details:',
        JSON.stringify(sessionsError, null, 2)
      );
    } else {
      console.log('   ✅ Read successful');
      console.log('   Sessions found:', sessions?.length || 0);
      console.log('   Data:', sessions);
    }

    // Test 5: Try to insert a test session
    console.log('5. Testing chat_sessions table insert...');
    const testSession = {
      user_id: user.id,
      employee_id: 'emp-016', // Video Content Creator
      role: 'Video Content Creator',
      provider: 'gemini',
    };

    const { data: newSession, error: insertError } = await supabase
      .from('chat_sessions')
      .insert(testSession)
      .select()
      .single();

    if (insertError) {
      console.error('   ❌ Insert error:', insertError);
      console.error('   Error code:', insertError.code);
      console.error('   Error message:', insertError.message);
      console.error('   Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('   ✅ Insert successful');
      console.log('   New session:', newSession);

      // Clean up test session
      console.log('6. Cleaning up test session...');
      const { error: deleteError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', newSession.id);

      if (deleteError) {
        console.error('   ❌ Delete error:', deleteError);
      } else {
        console.log('   ✅ Cleanup successful');
      }
    }

    console.log('=== TEST COMPLETE ===');
  } catch (error) {
    console.error('=== TEST FAILED ===');
    console.error('Error:', error);
  }
}

// Export for use in console
if (typeof window !== 'undefined') {
  (
    window as Window & { testSupabase: typeof testSupabaseConnection }
  ).testSupabase = testSupabaseConnection;
}

console.log(
  '✅ Supabase tester loaded! Run window.testSupabase() in console to test connection.'
);
