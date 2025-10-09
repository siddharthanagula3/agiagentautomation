import supabaseClient from '@/integrations/supabase/client';
import { AI_EMPLOYEES, type AIEmployee } from '@/data/ai-employees';

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

export async function listPurchasedEmployees(userId?: string | null): Promise<PurchasedEmployeeRecord[]> {
  const uid = getUserIdOrThrow(userId);
  console.log('[listPurchasedEmployees] 🔍 Fetching for user:', uid);
  
  const supabase = supabaseClient as any;
  const { data, error } = await supabase
    .from('purchased_employees')
    .select('*')
    .eq('user_id', uid)
    .order('purchased_at', { ascending: false });
  
  console.log('[listPurchasedEmployees] 📊 Query result:', {
    success: !error,
    recordCount: data?.length || 0,
    error: error?.message,
    data: data
  });
  
  if (error) {
    console.error('[listPurchasedEmployees] ❌ Error:', error);
    throw error;
  }
  
  return (data || []) as PurchasedEmployeeRecord[];
}

export async function isEmployeePurchased(userId: string | null | undefined, employeeId: string): Promise<boolean> {
  const uid = getUserIdOrThrow(userId);
  const supabase = supabaseClient as any;
  const { data, error } = await supabase
    .from('purchased_employees')
    .select('id')
    .eq('user_id', uid)
    .eq('employee_id', employeeId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function purchaseEmployee(userId?: string | null, employee?: AIEmployee): Promise<PurchasedEmployeeRecord> {
  const uid = getUserIdOrThrow(userId);
  if (!employee) throw new Error('Employee not provided');
  
  console.log('[purchaseEmployee] 💳 Creating purchase for:', {
    userId: uid,
    employeeId: employee.id,
    employeeName: employee.name,
    role: employee.role,
    provider: employee.provider
  });
  
  const supabase = supabaseClient as any;

  // Upsert to avoid duplicates
  const { data, error } = await supabase
    .from('purchased_employees')
    .upsert({
      user_id: uid,
      employee_id: employee.id,
      name: employee.name, // Added name field
      provider: employee.provider,
      role: employee.role,
      is_active: true,
      purchased_at: new Date().toISOString(),
    }, { onConflict: 'user_id,employee_id' })
    .select('*')
    .maybeSingle();
  
  console.log('[purchaseEmployee] 📊 Result:', {
    success: !error,
    data,
    error: error?.message
  });
  
  if (error) {
    console.error('[purchaseEmployee] ❌ Error:', error);
    throw error;
  }
  
  return data as PurchasedEmployeeRecord;
}

export function getEmployeeById(employeeId: string): AIEmployee | undefined {
  return AI_EMPLOYEES.find(e => e.id === employeeId);
}


