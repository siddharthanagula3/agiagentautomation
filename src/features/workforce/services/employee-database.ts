import { supabase } from '@shared/lib/supabase-client';
import { AI_EMPLOYEES, type AIEmployee } from '@/data/marketplace-employees';

export interface PurchasedEmployeeRecord {
  id: string; // UUID
  user_id: string;
  employee_id: string; // maps to AIEmployee.id
  name: string; // AI Employee name
  provider: string;
  role: string;
  is_active: boolean;
  purchased_at: string;
  created_at?: string;
}

function getUserIdOrThrow(userId?: string | null): string {
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

export async function listPurchasedEmployees(
  userId?: string | null
): Promise<PurchasedEmployeeRecord[]> {
  const uid = getUserIdOrThrow(userId);
  console.log('[listPurchasedEmployees] 🔍 Fetching for user:', uid);

  try {
    const { data, error } = await supabase
      .from('purchased_employees')
      .select('*')
      .eq('user_id', uid)
      .order('purchased_at', { ascending: false });

    console.log('[listPurchasedEmployees] 📊 Query result:', {
      success: !error,
      recordCount: data?.length || 0,
      error: error?.message,
      data: data,
    });

    if (error) {
      console.error('[listPurchasedEmployees] ❌ Error:', error);

      // Check if it's a table not found error
      if (
        error.message?.includes(
          'relation "purchased_employees" does not exist'
        ) ||
        error.message?.includes('does not exist') ||
        error.code === '42P01'
      ) {
        console.warn(
          '[listPurchasedEmployees] ⚠️ Table does not exist, returning empty array'
        );
        return []; // Return empty array instead of throwing error
      }

      throw error;
    }

    return (data || []) as PurchasedEmployeeRecord[];
  } catch (err) {
    console.error('[listPurchasedEmployees] ❌ Error:', err);

    // If it's a table not found error, return empty array
    if (
      err instanceof Error &&
      (err.message?.includes('relation "purchased_employees" does not exist') ||
        err.message?.includes('does not exist'))
    ) {
      console.warn(
        '[listPurchasedEmployees] ⚠️ Table does not exist, returning empty array'
      );
      return [];
    }

    throw err;
  }
}

export async function isEmployeePurchased(
  userId: string | null | undefined,
  employeeId: string
): Promise<boolean> {
  const uid = getUserIdOrThrow(userId);

  try {
    const { data, error } = await supabase
      .from('purchased_employees')
      .select('id')
      .eq('user_id', uid)
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // Check if it's a table not found error
      if (
        error.message?.includes(
          'relation "purchased_employees" does not exist'
        ) ||
        error.message?.includes('does not exist') ||
        error.code === '42P01'
      ) {
        console.warn(
          '[isEmployeePurchased] ⚠️ Table does not exist, returning false'
        );
        return false; // Return false instead of throwing error
      }
      throw error;
    }

    return !!data;
  } catch (err) {
    // If it's a table not found error, return false
    if (
      err instanceof Error &&
      (err.message?.includes('relation "purchased_employees" does not exist') ||
        err.message?.includes('does not exist'))
    ) {
      console.warn(
        '[isEmployeePurchased] ⚠️ Table does not exist, returning false'
      );
      return false;
    }

    throw err;
  }
}

export async function purchaseEmployee(
  userId?: string | null,
  employee?: AIEmployee
): Promise<PurchasedEmployeeRecord> {
  const uid = getUserIdOrThrow(userId);
  if (!employee) throw new Error('Employee not provided');

  console.log('[purchaseEmployee] 💳 Creating purchase for:', {
    userId: uid,
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    provider: employee.provider,
  });

  try {
    // Upsert to avoid duplicates
    const { data, error } = await supabase
      .from('purchased_employees')
      .upsert(
        {
          user_id: uid,
          employee_id: employee.id,
          name: employee.name, // Added name field
          provider: employee.provider,
          role: employee.role,
          is_active: true,
          purchased_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,employee_id' }
      )
      .select('*')
      .maybeSingle();

    console.log('[purchaseEmployee] 📊 Result:', {
      success: !error,
      data,
      error: error?.message,
    });

    if (error) {
      console.error('[purchaseEmployee] ❌ Error:', error);

      // Check if it's a table not found error
      if (
        error.message?.includes(
          'relation "purchased_employees" does not exist'
        ) ||
        error.message?.includes('does not exist') ||
        error.code === '42P01'
      ) {
        throw new Error(
          'DATABASE_SETUP_REQUIRED: The purchased_employees table needs to be created. Please run the database setup script in Supabase.'
        );
      }

      throw error;
    }

    return data as PurchasedEmployeeRecord;
  } catch (err) {
    console.error('[purchaseEmployee] ❌ Error:', err);
    throw err;
  }
}

export function getEmployeeById(employeeId: string): AIEmployee | undefined {
  return AI_EMPLOYEES.find((e) => e.id === employeeId);
}
