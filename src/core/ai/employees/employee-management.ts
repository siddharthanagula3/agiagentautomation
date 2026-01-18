import { supabase } from '@shared/lib/supabase-client';
import type {
  AIEmployee,
  EmployeeCategory,
  EmployeeLevel,
  EmployeeStatus,
  ToolDefinition,
  WorkflowDefinition,
  JobAssignment,
  AIEmployeeSystemConfig,
} from '../types/ai-employee';

class AIEmployeeService {
  private config: AIEmployeeSystemConfig = {
    maxConcurrentEmployees: 50,
    defaultResponseTime: 5,
    qualityThreshold: 85,
    autoAssignment: true,
    loadBalancing: true,
    monitoringEnabled: true,
    alertingEnabled: true,
    backupEmployees: [],
    escalationRules: [],
  };

  // Get all AI employees
  async getEmployees(filters?: {
    category?: EmployeeCategory;
    status?: EmployeeStatus;
    level?: EmployeeLevel;
    department?: string;
    available?: boolean;
  }) {
    try {
      let query = supabase.from('ai_employees').select('*');

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.department) {
        query = query.eq('department', filters.department);
      }
      if (filters?.available) {
        query = query.eq('status', 'available');
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get employee by ID
  async getEmployee(id: string) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Create new AI employee
  async createEmployee(
    employee: Omit<AIEmployee, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .insert({
          ...employee,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Failed to create employee: No data returned');
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Update employee
  async updateEmployee(id: string, updates: Partial<AIEmployee>) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Employee not found or update failed');
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Delete employee
  async deleteEmployee(id: string) {
    try {
      const { error } = await supabase
        .from('ai_employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get employees by category
  async getEmployeesByCategory(category: EmployeeCategory) {
    return this.getEmployees({ category });
  }

  // Get available employees for assignment
  async getAvailableEmployees(requirements?: {
    skills?: string[];
    level?: EmployeeLevel;
    maxCost?: number;
    department?: string;
  }) {
    try {
      let query = supabase
        .from('ai_employees')
        .select('*')
        .eq('status', 'available');

      if (requirements?.department) {
        query = query.eq('department', requirements.department);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by additional requirements
      let filteredEmployees = data || [];

      if (requirements?.skills && requirements.skills.length > 0) {
        filteredEmployees = filteredEmployees.filter((emp) =>
          requirements.skills!.some(
            (skill) =>
              emp.capabilities?.core_skills?.includes(skill) ||
              emp.capabilities?.technical_skills?.includes(skill)
          )
        );
      }

      if (requirements?.level) {
        filteredEmployees = filteredEmployees.filter(
          (emp) => emp.level === requirements.level
        );
      }

      if (requirements?.maxCost) {
        filteredEmployees = filteredEmployees.filter(
          (emp) => emp.cost?.hourly_rate <= requirements.maxCost!
        );
      }

      return { data: filteredEmployees, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Assign employee to job
  async assignEmployeeToJob(
    employeeId: string,
    jobId: string,
    priority: number = 1
  ) {
    try {
      const assignment: Omit<JobAssignment, 'id'> = {
        jobId,
        employeeId,
        assignedAt: new Date().toISOString(),
        status: 'assigned',
        priority,
        estimatedDuration: 0, // Will be calculated based on job complexity
        toolsUsed: [],
        workflowsExecuted: [],
        performance: {
          efficiency: 0,
          quality: 0,
          timeliness: 0,
          toolUsage: {},
          errors: 0,
          iterations: 0,
        },
      };

      const { data, error } = await supabase
        .from('job_assignments')
        .insert(assignment)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('Failed to create job assignment: No data returned');

      // Update employee status
      await this.updateEmployee(employeeId, { status: 'working' });

      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get employee performance stats
  async getEmployeePerformance(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('performance')
        .eq('id', employeeId)
        .maybeSingle();

      if (error) throw error;
      return { data: data?.performance, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Update employee performance
  async updateEmployeePerformance(employeeId: string, performance: unknown) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .update({
          performance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('Employee not found or performance update failed');
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get system configuration
  async getSystemConfig() {
    return { data: this.config, error: null };
  }

  // Update system configuration
  async updateSystemConfig(config: Partial<AIEmployeeSystemConfig>) {
    this.config = { ...this.config, ...config };
    return { data: this.config, error: null };
  }

  // Get employee tools
  async getEmployeeTools(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('tools')
        .eq('id', employeeId)
        .maybeSingle();

      if (error) throw error;
      return { data: data?.tools || [], error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Update employee tools
  async updateEmployeeTools(employeeId: string, tools: ToolDefinition[]) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .update({
          tools,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Employee not found or tools update failed');
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get employee workflows
  async getEmployeeWorkflows(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('workflows')
        .eq('id', employeeId)
        .maybeSingle();

      if (error) throw error;
      return { data: data?.workflows || [], error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Update employee workflows
  async updateEmployeeWorkflows(
    employeeId: string,
    workflows: WorkflowDefinition[]
  ) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .update({
          workflows,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data)
        throw new Error('Employee not found or workflows update failed');
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Search employees by skills
  async searchEmployeesBySkills(skills: string[], limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('status', 'available')
        .limit(limit);

      if (error) throw error;

      // Filter employees by skills match
      const matchedEmployees = (data || []).filter((emp) => {
        const allSkills = [
          ...(emp.capabilities?.core_skills || []),
          ...(emp.capabilities?.technical_skills || []),
          ...(emp.capabilities?.specializations || []),
        ];

        return skills.some((skill) =>
          allSkills.some((empSkill) =>
            empSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
      });

      return { data: matchedEmployees, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get employee assignments
  async getEmployeeAssignments(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('job_assignments')
        .select('*')
        .eq('employee_id', employeeId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const { data: employees, error: empError } = await supabase
        .from('ai_employees')
        .select('status, category, level');

      if (empError) throw empError;

      const { data: assignments, error: assignError } = await supabase
        .from('job_assignments')
        .select('status, employee_id');

      if (assignError) throw assignError;

      const stats = {
        totalEmployees: employees?.length || 0,
        availableEmployees:
          employees?.filter((emp) => emp.status === 'available').length || 0,
        workingEmployees:
          employees?.filter((emp) => emp.status === 'working').length || 0,
        activeAssignments:
          assignments?.filter((assign) => assign.status === 'in_progress')
            .length || 0,
        completedAssignments:
          assignments?.filter((assign) => assign.status === 'completed')
            .length || 0,
        categories: this.groupByCategory(employees || []),
        levels: this.groupByLevel(employees || []),
      };

      return { data: stats, error: null };
    } catch (error: unknown) {
      // Updated: Jan 15th 2026 - Fixed missing error type check
      const message = error instanceof Error ? error.message : String(error);
      return { data: null, error: message };
    }
  }

  private groupByCategory(employees: unknown[]) {
    return employees.reduce((acc, emp) => {
      acc[emp.category] = (acc[emp.category] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByLevel(employees: unknown[]) {
    return employees.reduce((acc, emp) => {
      acc[emp.level] = (acc[emp.level] || 0) + 1;
      return acc;
    }, {});
  }
}

export const aiEmployeeService = new AIEmployeeService();
