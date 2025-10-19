import { supabase } from '@/shared/lib/supabase-client';

export interface AIEmployee {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color: string;
  tools: string[];
  model: string;
  systemPrompt: string;
  isActive: boolean;
  status: 'idle' | 'working' | 'thinking';
  createdAt: Date;
  updatedAt: Date;
}

// Supabase row types for strong typing and lint compliance
interface SupabaseAiEmployeeRow {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color: string;
  tools: string[] | null;
  model: string;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabasePurchasedEmployeeRow {
  ai_employees: SupabaseAiEmployeeRow;
}

export interface PurchasedEmployee {
  id: string;
  userId: string;
  employeeId: string;
  purchasedAt: Date;
  aiEmployee: AIEmployee;
}

class EmployeeService {
  /**
   * Get user's purchased employees
   */
  async getPurchasedEmployees(userId: string): Promise<AIEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('purchased_employees')
        .select(`
          *,
          ai_employees (
            id,
            name,
            description,
            avatar,
            color,
            tools,
            model,
            system_prompt,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching purchased employees:', error);
        return [];
      }

      const rows = (data as SupabasePurchasedEmployeeRow[] | null);
      return rows?.map((pe) => ({
        id: pe.ai_employees.id,
        name: pe.ai_employees.name,
        description: pe.ai_employees.description,
        avatar: pe.ai_employees.avatar,
        color: pe.ai_employees.color,
        tools: pe.ai_employees.tools || [],
        model: pe.ai_employees.model,
        systemPrompt: pe.ai_employees.system_prompt,
        isActive: pe.ai_employees.is_active,
        status: 'idle' as const,
        createdAt: new Date(pe.ai_employees.created_at),
        updatedAt: new Date(pe.ai_employees.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error in getPurchasedEmployees:', error);
      return [];
    }
  }

  /**
   * Get employee details by ID
   */
  async getEmployeeDetails(employeeId: string): Promise<AIEmployee | null> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (error) {
        console.error('Error fetching employee details:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        color: data.color,
        tools: data.tools || [],
        model: data.model,
        systemPrompt: data.system_prompt,
        isActive: data.is_active,
        status: 'idle',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in getEmployeeDetails:', error);
      return null;
    }
  }

  /**
   * Get all available employees in marketplace
   */
  async getAvailableEmployees(): Promise<AIEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching available employees:', error);
        return [];
      }

      const rows = (data as SupabaseAiEmployeeRow[] | null);
      return rows?.map((emp) => ({
        id: emp.id,
        name: emp.name,
        description: emp.description,
        avatar: emp.avatar,
        color: emp.color,
        tools: emp.tools || [],
        model: emp.model,
        systemPrompt: emp.system_prompt,
        isActive: emp.is_active,
        status: 'idle' as const,
        createdAt: new Date(emp.created_at),
        updatedAt: new Date(emp.updated_at),
      })) || [];
    } catch (error) {
      console.error('Error in getAvailableEmployees:', error);
      return [];
    }
  }

  /**
   * Purchase an employee
   */
  async purchaseEmployee(userId: string, employeeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purchased_employees')
        .insert({
          user_id: userId,
          employee_id: employeeId,
        });

      if (error) {
        console.error('Error purchasing employee:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in purchaseEmployee:', error);
      return false;
    }
  }

  /**
   * Update employee status
   */
  async updateEmployeeStatus(
    employeeId: string, 
    status: 'idle' | 'working' | 'thinking'
  ): Promise<boolean> {
    try {
      // This would typically update a real-time status in the database
      // For now, we'll just return true as the status is managed in the store
      return true;
    } catch (error) {
      console.error('Error updating employee status:', error);
      return false;
    }
  }

  /**
   * Get employee by name (for quick lookup)
   */
  async getEmployeeByName(name: string): Promise<AIEmployee | null> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching employee by name:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        color: data.color,
        tools: data.tools || [],
        model: data.model,
        systemPrompt: data.system_prompt,
        isActive: data.is_active,
        status: 'idle',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error in getEmployeeByName:', error);
      return null;
    }
  }
}

export const employeeService = new EmployeeService();
