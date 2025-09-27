// Complete AI Employee Service
// Comprehensive service for managing AI employees with full CRUD operations

import { supabase } from '../integrations/supabase/client';
import { completeMCPService } from './complete-mcp-service';
import type {
  AIEmployee,
  EmployeeCategory,
  EmployeeLevel,
  EmployeeStatus,
  JobAssignment,
  ToolExecution,
  ChatMessage,
  EmployeeHire,
  EmployeeSession,
  EmployeeSearchFilters,
  EmployeeSearchResult,
  EmployeeAnalytics,
  APIResponse,
  PaginatedResponse,
  PerformanceMetrics,
  CostMetrics,
  Availability,
  EmployeeMetadata,
  ToolDefinition,
  WorkflowDefinition,
  EmployeeCapabilities,
  AssignmentStatus,
  PaymentStatus,
  MessageType,
  TrainingStatus,
  EmployeeTrainingRecord,
  EmployeePerformanceHistory,
  EmployeeNotification,
  EmployeeError,
  ValidationResult,
  ValidationError
} from '../types/complete-ai-employee';

class CompleteAIEmployeeService {
  private realtimeSubscriptions: Map<string, any> = new Map();

  // ========================================
  // EMPLOYEE CRUD OPERATIONS
  // ========================================

  // Get all employees with pagination and filters
  async getEmployees(
    filters: EmployeeSearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<APIResponse<PaginatedResponse<AIEmployee>>> {
    try {
      let query = supabase
        .from('ai_employees')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.level && filters.level.length > 0) {
        query = query.in('level', filters.level);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.availability !== undefined) {
        query = query.eq('status', filters.availability ? 'available' : 'working');
      }

      if (filters.priceRange) {
        query = query.gte('cost->hourly_rate', filters.priceRange.min);
        query = query.lte('cost->hourly_rate', filters.priceRange.max);
      }

      if (filters.rating) {
        query = query.gte('performance->rating', filters.rating.min);
        query = query.lte('performance->rating', filters.rating.max);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          hasMore: (count || 0) > to + 1
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get employee by ID
  async getEmployee(id: string): Promise<APIResponse<AIEmployee>> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as AIEmployee,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Create new employee
  async createEmployee(employee: Partial<AIEmployee>): Promise<APIResponse<AIEmployee>> {
    try {
      // Validate employee data
      const validation = this.validateEmployee(employee);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          data: validation.errors,
          timestamp: new Date().toISOString()
        };
      }

      const { data, error } = await supabase
        .from('ai_employees')
        .insert({
          name: employee.name,
          role: employee.role,
          category: employee.category,
          department: employee.department,
          level: employee.level,
          status: employee.status || 'available',
          capabilities: employee.capabilities || {},
          system_prompt: employee.systemPrompt || '',
          tools: employee.tools || [],
          workflows: employee.workflows || [],
          performance: employee.performance || this.getDefaultPerformance(),
          availability: employee.availability || this.getDefaultAvailability(),
          cost: employee.cost || this.getDefaultCost(),
          metadata: employee.metadata || {},
          is_active: true,
          is_hired: false
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as AIEmployee,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update employee
  async updateEmployee(id: string, updates: Partial<AIEmployee>): Promise<APIResponse<AIEmployee>> {
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

      return {
        success: true,
        data: data as AIEmployee,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Delete employee (soft delete)
  async deleteEmployee(id: string): Promise<APIResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('ai_employees')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // HIRING OPERATIONS
  // ========================================

  // Hire an employee
  async hireEmployee(employeeId: string, userId: string, paymentAmount: number = 1.00): Promise<APIResponse<EmployeeHire>> {
    try {
      // Check if employee is available
      const employeeResponse = await this.getEmployee(employeeId);
      if (!employeeResponse.success || !employeeResponse.data) {
        return {
          success: false,
          error: 'Employee not found',
          timestamp: new Date().toISOString()
        };
      }

      if (employeeResponse.data.isHired) {
        return {
          success: false,
          error: 'Employee is already hired',
          timestamp: new Date().toISOString()
        };
      }

      // Create hire record
      const { data, error } = await supabase
        .from('employee_hires')
        .insert({
          user_id: userId,
          employee_id: employeeId,
          payment_amount: paymentAmount,
          payment_status: 'completed',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Update employee status
      await this.updateEmployee(employeeId, {
        isHired: true,
        hiredBy: userId,
        hiredAt: new Date().toISOString(),
        status: 'available'
      });

      return {
        success: true,
        data: data as EmployeeHire,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get user's hired employees
  async getUserHiredEmployees(userId: string): Promise<APIResponse<AIEmployee[]>> {
    try {
      const { data, error } = await supabase
        .from('employee_hires')
        .select(`
          *,
          ai_employees (*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const employees = data?.map(hire => hire.ai_employees).filter(Boolean) as AIEmployee[];

      return {
        success: true,
        data: employees,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // CHAT OPERATIONS
  // ========================================

  // Start chat session
  async startChatSession(employeeId: string, userId: string): Promise<APIResponse<EmployeeSession>> {
    try {
      // Check if user has hired this employee
      const { data: hire, error: hireError } = await supabase
        .from('employee_hires')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (hireError || !hire) {
        return {
          success: false,
          error: 'User has not hired this employee',
          timestamp: new Date().toISOString()
        };
      }

      // End any existing active session
      await supabase
        .from('employee_sessions')
        .update({ is_active: false, session_end: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('employee_id', employeeId)
        .eq('is_active', true);

      // Create new session
      const { data, error } = await supabase
        .from('employee_sessions')
        .insert({
          user_id: userId,
          employee_id: employeeId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as EmployeeSession,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Send chat message
  async sendChatMessage(
    employeeId: string,
    userId: string,
    content: string,
    messageType: MessageType = 'text',
    metadata: any = {}
  ): Promise<APIResponse<ChatMessage>> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          employee_id: employeeId,
          user_id: userId,
          message_type: messageType,
          content,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as ChatMessage,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get chat messages
  async getChatMessages(employeeId: string, userId: string, limit: number = 50): Promise<APIResponse<ChatMessage[]>> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data as ChatMessage[],
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // TOOL EXECUTION
  // ========================================

  // Execute tool for employee
  async executeTool(
    employeeId: string,
    toolName: string,
    parameters: Record<string, any>,
    userId?: string,
    jobId?: string
  ): Promise<APIResponse<any>> {
    try {
      // Execute tool via MCP service
      const result = await completeMCPService.executeTool(toolName, parameters, {
        employeeId,
        userId,
        jobId
      });

      // Log tool execution
      await this.logToolExecution({
        toolId: await this.getToolId(toolName),
        employeeId,
        jobId,
        parameters,
        result: result.data,
        success: result.success,
        errorMessage: result.error,
        durationMs: result.executionTime,
        userId
      });

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Log tool execution
  private async logToolExecution(execution: Partial<ToolExecution>): Promise<void> {
    try {
      await supabase.from('tool_executions').insert({
        tool_id: execution.toolId,
        mcp_tool_id: execution.mcpToolId,
        employee_id: execution.employeeId,
        job_id: execution.jobId,
        parameters: execution.parameters,
        result: execution.result,
        context: execution.context,
        executed_at: new Date().toISOString(),
        success: execution.success,
        error_message: execution.errorMessage,
        duration_ms: execution.durationMs,
        user_id: execution.userId
      });
    } catch (error) {
      console.error('Error logging tool execution:', error);
    }
  }

  // Get tool ID
  private async getToolId(toolName: string): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('mcp_tools')
        .select('id')
        .eq('name', toolName)
        .single();

      return data?.id || null;
    } catch {
      return null;
    }
  }

  // ========================================
  // JOB ASSIGNMENTS
  // ========================================

  // Assign job to employee
  async assignJobToEmployee(
    jobId: string,
    employeeId: string,
    priority: number = 1,
    estimatedDuration: number = 60
  ): Promise<APIResponse<JobAssignment>> {
    try {
      const { data, error } = await supabase
        .from('job_assignments')
        .insert({
          job_id: jobId,
          employee_id: employeeId,
          priority,
          estimated_duration: estimatedDuration,
          status: 'assigned'
        })
        .select()
        .single();

      if (error) throw error;

      // Update employee status
      await this.updateEmployee(employeeId, { status: 'working' });

      return {
        success: true,
        data: data as JobAssignment,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update assignment status
  async updateAssignmentStatus(
    assignmentId: string,
    status: AssignmentStatus,
    feedback?: string
  ): Promise<APIResponse<JobAssignment>> {
    try {
      const updates: any = { status };
      if (feedback) updates.feedback = feedback;
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (status === 'in_progress') updates.started_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('job_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as JobAssignment,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // PERFORMANCE TRACKING
  // ========================================

  // Update employee performance
  async updateEmployeePerformance(
    employeeId: string,
    performanceData: PerformanceMetrics
  ): Promise<APIResponse<boolean>> {
    try {
      // Update employee performance
      await this.updateEmployee(employeeId, { performance: performanceData });

      // Log performance history
      await supabase.from('employee_performance_history').insert({
        employee_id: employeeId,
        performance_data: performanceData,
        recorded_at: new Date().toISOString()
      });

      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get employee analytics
  async getEmployeeAnalytics(): Promise<APIResponse<EmployeeAnalytics>> {
    try {
      const { data, error } = await supabase.rpc('get_employee_stats');

      if (error) throw error;

      return {
        success: true,
        data: data as EmployeeAnalytics,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========================================
  // REAL-TIME SUBSCRIPTIONS
  // ========================================

  // Subscribe to employee updates
  subscribeToEmployeeUpdates(employeeId: string, callback: (data: any) => void): string {
    const subscriptionId = `employee_${employeeId}_${Date.now()}`;
    
    const subscription = supabase
      .channel(`employee_${employeeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ai_employees',
        filter: `id=eq.${employeeId}`
      }, callback)
      .subscribe();

    this.realtimeSubscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  // Subscribe to chat messages
  subscribeToChatMessages(employeeId: string, userId: string, callback: (data: any) => void): string {
    const subscriptionId = `chat_${employeeId}_${userId}_${Date.now()}`;
    
    const subscription = supabase
      .channel(`chat_${employeeId}_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `employee_id=eq.${employeeId}`
      }, callback)
      .subscribe();

    this.realtimeSubscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  // Unsubscribe from updates
  unsubscribe(subscriptionId: string): void {
    const subscription = this.realtimeSubscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.realtimeSubscriptions.delete(subscriptionId);
    }
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  // Validate employee data
  private validateEmployee(employee: Partial<AIEmployee>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!employee.name) {
      errors.push({ field: 'name', message: 'Name is required', code: 'REQUIRED' });
    }

    if (!employee.role) {
      errors.push({ field: 'role', message: 'Role is required', code: 'REQUIRED' });
    }

    if (!employee.category) {
      errors.push({ field: 'category', message: 'Category is required', code: 'REQUIRED' });
    }

    if (!employee.department) {
      errors.push({ field: 'department', message: 'Department is required', code: 'REQUIRED' });
    }

    if (!employee.level) {
      errors.push({ field: 'level', message: 'Level is required', code: 'REQUIRED' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // DEFAULT VALUES
  // ========================================

  // Get default performance metrics
  private getDefaultPerformance(): PerformanceMetrics {
    return {
      efficiency: 90,
      accuracy: 95,
      speed: 85,
      reliability: 92,
      rating: 4.5,
      totalTasksCompleted: 0,
      averageTaskTime: 30,
      successRate: 95,
      userSatisfaction: 90,
      lastUpdated: new Date().toISOString(),
      trends: []
    };
  }

  // Get default availability
  private getDefaultAvailability(): Availability {
    return {
      timezone: 'UTC',
      workingHours: {
        monday: { start: '09:00', end: '17:00', isAvailable: true },
        tuesday: { start: '09:00', end: '17:00', isAvailable: true },
        wednesday: { start: '09:00', end: '17:00', isAvailable: true },
        thursday: { start: '09:00', end: '17:00', isAvailable: true },
        friday: { start: '09:00', end: '17:00', isAvailable: true },
        saturday: { start: '10:00', end: '14:00', isAvailable: false },
        sunday: { start: '10:00', end: '14:00', isAvailable: false }
      },
      availability: [],
      holidays: [],
      maintenance: []
    };
  }

  // Get default cost metrics
  private getDefaultCost(): CostMetrics {
    return {
      hourlyRate: 50.00,
      currency: 'USD',
      billingModel: 'hourly',
      minimumHours: 1,
      maximumHours: 40
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Get available tools for employee
  async getEmployeeTools(employeeId: string): Promise<APIResponse<ToolDefinition[]>> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('tools')
        .eq('id', employeeId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data.tools || [],
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update employee tools
  async updateEmployeeTools(employeeId: string, tools: ToolDefinition[]): Promise<APIResponse<boolean>> {
    try {
      await this.updateEmployee(employeeId, { tools });
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get employee workflows
  async getEmployeeWorkflows(employeeId: string): Promise<APIResponse<WorkflowDefinition[]>> {
    try {
      const { data, error } = await supabase
        .from('ai_employees')
        .select('workflows')
        .eq('id', employeeId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data.workflows || [],
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Update employee workflows
  async updateEmployeeWorkflows(employeeId: string, workflows: WorkflowDefinition[]): Promise<APIResponse<boolean>> {
    try {
      await this.updateEmployee(employeeId, { workflows });
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cleanup subscriptions
  cleanup(): void {
    this.realtimeSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.realtimeSubscriptions.clear();
  }
}

export const completeAIEmployeeService = new CompleteAIEmployeeService();
