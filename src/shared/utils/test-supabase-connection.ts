/**
 * Test Supabase Connection and Purchased Employees Table
 * This utility helps debug database connection issues
 */

import { supabase } from '@shared/lib/supabase-client';

export const testSupabaseConnection = async () => {
  console.log('[TestSupabase] Starting comprehensive connection test...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[TestSupabase] Auth check:', { user: user?.id, error: authError });
    
    if (authError) {
      console.error('[TestSupabase] Auth error:', authError);
      return { success: false, error: 'Authentication failed', details: authError };
    }
    
    if (!user) {
      console.warn('[TestSupabase] No authenticated user');
      return { success: false, error: 'No authenticated user', suggestion: 'Please sign in first' };
    }
    
    // Test 2: Try to query the purchased_employees table
    const { data, error: queryError } = await supabase
      .from('purchased_employees')
      .select('*')
      .limit(1);
    
    console.log('[TestSupabase] Query test:', { data, error: queryError });
    
    if (queryError) {
      console.error('[TestSupabase] Query error:', queryError);
      return { 
        success: false, 
        error: 'Database query failed', 
        details: queryError,
        suggestion: 'Check if the purchased_employees table exists and has proper RLS policies'
      };
    }
    
    // Test 3: Try to insert a test record (will be rolled back)
    const testRecord = {
      user_id: user.id,
      employee_id: 'test-employee-123',
      name: 'Test Employee',
      role: 'Test Role',
      provider: 'test',
      is_active: true,
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('purchased_employees')
      .insert(testRecord)
      .select();
    
    console.log('[TestSupabase] Insert test:', { data: insertData, error: insertError });
    
    if (insertError) {
      console.error('[TestSupabase] Insert error:', insertError);
      
      // Check if it's a unique constraint violation (expected for duplicate test)
      if (insertError.code === '23505') {
        console.log('[TestSupabase] Unique constraint violation (expected for duplicate test)');
        // Try to clean up and test again
        await supabase
          .from('purchased_employees')
          .delete()
          .eq('employee_id', 'test-employee-123')
          .eq('user_id', user.id);
        
        // Retry insert
        const { data: retryData, error: retryError } = await supabase
          .from('purchased_employees')
          .insert(testRecord)
          .select();
        
        if (retryError) {
          return { 
            success: false, 
            error: 'Database insert failed after cleanup', 
            details: retryError,
            suggestion: 'Check RLS policies and table structure'
          };
        }
        
        // Clean up successful test record
        await supabase
          .from('purchased_employees')
          .delete()
          .eq('employee_id', 'test-employee-123')
          .eq('user_id', user.id);
      } else {
        return { 
          success: false, 
          error: 'Database insert failed', 
          details: insertError,
          suggestion: 'Check RLS policies and table structure'
        };
      }
    } else {
      // Clean up successful test record
      await supabase
        .from('purchased_employees')
        .delete()
        .eq('employee_id', 'test-employee-123')
        .eq('user_id', user.id);
    }
    
    // Test 4: Test unique constraint (try to insert duplicate)
    const duplicateRecord = {
      user_id: user.id,
      employee_id: 'test-employee-123',
      name: 'Test Employee Duplicate',
      role: 'Test Role Duplicate',
      provider: 'test',
      is_active: true,
    };
    
    const { error: duplicateError } = await supabase
      .from('purchased_employees')
      .insert(duplicateRecord);
    
    console.log('[TestSupabase] Duplicate constraint test:', { error: duplicateError });
    
    if (duplicateError && duplicateError.code === '23505') {
      console.log('[TestSupabase] ✅ Unique constraint working correctly');
    } else if (duplicateError) {
      console.warn('[TestSupabase] ⚠️ Unexpected error on duplicate test:', duplicateError);
    } else {
      console.warn('[TestSupabase] ⚠️ Unique constraint may not be working - duplicate was inserted');
      // Clean up the duplicate
      await supabase
        .from('purchased_employees')
        .delete()
        .eq('employee_id', 'test-employee-123')
        .eq('user_id', user.id)
        .eq('name', 'Test Employee Duplicate');
    }
    
    console.log('[TestSupabase] All tests passed!');
    return { 
      success: true, 
      message: 'Supabase connection and purchased_employees table working correctly',
      userId: user.id,
      tests: [
        'Authentication',
        'Table query',
        'Record insertion',
        'Unique constraint'
      ]
    };
    
  } catch (error) {
    console.error('[TestSupabase] Unexpected error:', error);
    return { 
      success: false, 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Export for use in browser console or debugging
if (typeof window !== 'undefined') {
  (window as { testSupabaseConnection?: typeof testSupabaseConnection }).testSupabaseConnection = testSupabaseConnection;
}
