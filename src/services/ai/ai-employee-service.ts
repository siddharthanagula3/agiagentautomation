// AI Employee Service
// Handles AI Employee management, system prompts, and capabilities

import { supabase } from '../../integrations/supabase/client';
import { AIEmployee, AIEmployeeCapabilities, Tool, PerformanceMetrics } from '../../types';

export class AIEmployeeService {
  /**
   * Get all available AI Employees
   */
  async getAvailableEmployees(): Promise<AIEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI employees:', error);
      throw new Error('Failed to fetch AI employees');
    }
  }

  /**
   * Get AI Employee by ID
   */
  async getEmployeeById(id: string): Promise<AIEmployee | null> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching AI employee:', error);
      throw new Error('Failed to fetch AI employee');
    }
  }

  /**
   * Get AI Employees by category
   */
  async getEmployeesByCategory(category: string): Promise<AIEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('category', category)
        .eq('status', 'available')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI employees by category:', error);
      throw new Error('Failed to fetch AI employees by category');
    }
  }

  /**
   * Search AI Employees
   */
  async searchEmployees(query: string): Promise<AIEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .or(`name.ilike.%${query}%,role.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('status', 'available')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching AI employees:', error);
      throw new Error('Failed to search AI employees');
    }
  }

  /**
   * Create a new AI Employee
   */
  async createEmployee(employee: Omit<AIEmployee, 'id' | 'created_at' | 'updated_at'>): Promise<AIEmployee> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .insert(employee)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating AI employee:', error);
      throw new Error('Failed to create AI employee');
    }
  }

  /**
   * Update AI Employee
   */
  async updateEmployee(id: string, updates: Partial<AIEmployee>): Promise<AIEmployee> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AI employee:', error);
      throw new Error('Failed to update AI employee');
    }
  }

  /**
   * Update AI Employee performance metrics
   */
  async updatePerformance(id: string, metrics: Partial<PerformanceMetrics>): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_employees')
        .update({
          performance: metrics,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating AI employee performance:', error);
      throw new Error('Failed to update performance metrics');
    }
  }

  /**
   * Get AI Employee system prompt
   */
  async getSystemPrompt(id: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('system_prompt')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data?.system_prompt || '';
    } catch (error) {
      console.error('Error fetching system prompt:', error);
      throw new Error('Failed to fetch system prompt');
    }
  }

  /**
   * Get AI Employee tools
   */
  async getEmployeeTools(id: string): Promise<Tool[]> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('tools')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data?.tools || [];
    } catch (error) {
      console.error('Error fetching employee tools:', error);
      throw new Error('Failed to fetch employee tools');
    }
  }

  /**
   * Update AI Employee status
   */
  async updateStatus(id: string, status: 'available' | 'busy' | 'offline' | 'maintenance'): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_employees')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating AI employee status:', error);
      throw new Error('Failed to update employee status');
    }
  }

  /**
   * Get AI Employee capabilities
   */
  async getCapabilities(id: string): Promise<AIEmployeeCapabilities> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('capabilities')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data?.capabilities || {};
    } catch (error) {
      console.error('Error fetching AI employee capabilities:', error);
      throw new Error('Failed to fetch employee capabilities');
    }
  }

  /**
   * Check if AI Employee can handle a specific task
   */
  async canHandleTask(employeeId: string, taskRequirements: string[]): Promise<boolean> {
    try {
      const capabilities = await this.getCapabilities(employeeId);
      const employeeTools = await this.getEmployeeTools(employeeId);
      
      // Check if employee has required skills
      const hasRequiredSkills = taskRequirements.every(requirement =>
        capabilities.coreSkills?.includes(requirement) ||
        capabilities.technicalSkills?.includes(requirement)
      );

      // Check if employee has required tools
      const hasRequiredTools = taskRequirements.every(requirement =>
        employeeTools.some(tool => tool.name.toLowerCase().includes(requirement.toLowerCase()))
      );

      return hasRequiredSkills && hasRequiredTools;
    } catch (error) {
      console.error('Error checking task compatibility:', error);
      return false;
    }
  }

  /**
   * Get AI Employee performance metrics
   */
  async getPerformanceMetrics(id: string): Promise<PerformanceMetrics> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('performance')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data?.performance || {
        tasksCompleted: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageExecutionTime: 0,
        errorRate: 0,
        userSatisfaction: 0,
        costEfficiency: 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }

  /**
   * Get AI Employees by user's hired employees
   */
  async getUserHiredEmployees(userId: string): Promise<AIEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('employee_hires')
        .select(`
          ai_employees (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      return data?.map(hire => hire.ai_employees).filter(Boolean) || [];
    } catch (error) {
      console.error('Error fetching user hired employees:', error);
      throw new Error('Failed to fetch hired employees');
    }
  }

  /**
   * Hire an AI Employee
   */
  async hireEmployee(userId: string, employeeId: string, paymentAmount: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_hires')
        .insert({
          user_id: userId,
          employee_id: employeeId,
          payment_amount: paymentAmount,
          status: 'active',
          payment_status: 'completed'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error hiring AI employee:', error);
      throw new Error('Failed to hire AI employee');
    }
  }

  /**
   * Terminate an AI Employee
   */
  async terminateEmployee(userId: string, employeeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('employee_hires')
        .update({
          status: 'terminated',
          expires_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('employee_id', employeeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error terminating AI employee:', error);
      throw new Error('Failed to terminate AI employee');
    }
  }
}

export const aiEmployeeService = new AIEmployeeService();
