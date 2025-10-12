import { create } from 'zustand';
import { aiEmployeeService } from '../services/ai-employee-service';
import { toolInvocationService } from '../services/tool-invocation-service';
import type {
  AIEmployee,
  EmployeeCategory,
  EmployeeStatus,
  JobAssignment,
  ToolDefinition,
  WorkflowDefinition,
} from '../types/ai-employee';

interface AIEmployeeState {
  // State
  employees: Record<string, AIEmployee>;
  assignments: Record<string, JobAssignment>;
  tools: Record<string, ToolDefinition>;
  workflows: Record<string, WorkflowDefinition>;
  selectedEmployee: AIEmployee | null;
  isLoading: boolean;
  error: string | null;
  lastUpdateAt: Date | null;

  // Filters
  filters: {
    category?: EmployeeCategory;
    status?: EmployeeStatus;
    department?: string;
    available?: boolean;
  };

  // Actions
  loadEmployees: (filters?: unknown) => Promise<void>;
  loadEmployee: (id: string) => Promise<void>;
  createEmployee: (
    employee: Omit<AIEmployee, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<AIEmployee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  assignEmployeeToJob: (
    employeeId: string,
    jobId: string,
    priority?: number
  ) => Promise<void>;
  updateEmployeeStatus: (
    employeeId: string,
    status: EmployeeStatus
  ) => Promise<void>;
  updateEmployeePerformance: (
    employeeId: string,
    performance: unknown
  ) => Promise<void>;
  loadEmployeeTools: (employeeId: string) => Promise<void>;
  loadEmployeeWorkflows: (employeeId: string) => Promise<void>;
  executeTool: (
    toolId: string,
    parameters: Record<string, unknown>,
    context?: unknown
  ) => Promise<void>;
  searchEmployees: (query: string) => Promise<void>;
  setFilters: (filters: unknown) => void;
  clearFilters: () => void;
  setSelectedEmployee: (employee: AIEmployee | null) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useAIEmployeeStore = create<AIEmployeeState>((set, get) => ({
  // Initial state
  employees: {},
  assignments: {},
  tools: {},
  workflows: {},
  selectedEmployee: null,
  isLoading: false,
  error: null,
  lastUpdateAt: null,
  filters: {},

  // Load all employees
  loadEmployees: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await aiEmployeeService.getEmployees(filters);

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      const employeesMap = (data || []).reduce(
        (acc, employee) => {
          acc[employee.id] = employee;
          return acc;
        },
        {} as Record<string, AIEmployee>
      );

      set({
        employees: employeesMap,
        isLoading: false,
        lastUpdateAt: new Date(),
      });
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Load specific employee
  loadEmployee: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await aiEmployeeService.getEmployee(id);

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      if (data) {
        set(state => ({
          employees: { ...state.employees, [data.id]: data },
          selectedEmployee: data,
          isLoading: false,
          lastUpdateAt: new Date(),
        }));
      }
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create new employee
  createEmployee: async employee => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await aiEmployeeService.createEmployee(employee);

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      if (data) {
        set(state => ({
          employees: { ...state.employees, [data.id]: data },
          isLoading: false,
          lastUpdateAt: new Date(),
        }));
      }
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Update employee
  updateEmployee: async (id: string, updates) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await aiEmployeeService.updateEmployee(
        id,
        updates
      );

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      if (data) {
        set(state => ({
          employees: { ...state.employees, [id]: data },
          selectedEmployee:
            state.selectedEmployee?.id === id ? data : state.selectedEmployee,
          isLoading: false,
          lastUpdateAt: new Date(),
        }));
      }
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Delete employee
  deleteEmployee: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await aiEmployeeService.deleteEmployee(id);

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      set(state => {
        const newEmployees = { ...state.employees };
        delete newEmployees[id];

        return {
          employees: newEmployees,
          selectedEmployee:
            state.selectedEmployee?.id === id ? null : state.selectedEmployee,
          isLoading: false,
          lastUpdateAt: new Date(),
        };
      });
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Assign employee to job
  assignEmployeeToJob: async (
    employeeId: string,
    jobId: string,
    priority = 1
  ) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await aiEmployeeService.assignEmployeeToJob(
        employeeId,
        jobId,
        priority
      );

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      if (data) {
        set(state => ({
          assignments: { ...state.assignments, [data.id]: data },
          isLoading: false,
          lastUpdateAt: new Date(),
        }));
      }
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Update employee status
  updateEmployeeStatus: async (employeeId: string, status: EmployeeStatus) => {
    try {
      await get().updateEmployee(employeeId, { status });
    } catch (error: unknown) {
      set({ error: error.message });
    }
  },

  // Update employee performance
  updateEmployeePerformance: async (
    employeeId: string,
    performance: unknown
  ) => {
    try {
      await get().updateEmployee(employeeId, { performance });
    } catch (error: unknown) {
      set({ error: error.message });
    }
  },

  // Load employee tools
  loadEmployeeTools: async (employeeId: string) => {
    try {
      const { data, error } =
        await aiEmployeeService.getEmployeeTools(employeeId);

      if (error) {
        set({ error });
        return;
      }

      if (data) {
        const toolsMap = (data || []).reduce(
          (acc, tool) => {
            acc[tool.id] = tool;
            return acc;
          },
          {} as Record<string, ToolDefinition>
        );

        set(state => ({
          tools: { ...state.tools, ...toolsMap },
          lastUpdateAt: new Date(),
        }));
      }
    } catch (error: unknown) {
      set({ error: error.message });
    }
  },

  // Load employee workflows
  loadEmployeeWorkflows: async (employeeId: string) => {
    try {
      const { data, error } =
        await aiEmployeeService.getEmployeeWorkflows(employeeId);

      if (error) {
        set({ error });
        return;
      }

      if (data) {
        const workflowsMap = (data || []).reduce(
          (acc, workflow) => {
            acc[workflow.id] = workflow;
            return acc;
          },
          {} as Record<string, WorkflowDefinition>
        );

        set(state => ({
          workflows: { ...state.workflows, ...workflowsMap },
          lastUpdateAt: new Date(),
        }));
      }
    } catch (error: unknown) {
      set({ error: error.message });
    }
  },

  // Execute tool
  executeTool: async (
    toolId: string,
    parameters: Record<string, unknown>,
    context?: unknown
  ) => {
    set({ isLoading: true, error: null });

    try {
      const { success, error, result } =
        await toolInvocationService.executeTool(toolId, parameters, context);

      if (!success) {
        set({ error, isLoading: false });
        return;
      }

      set({ isLoading: false, lastUpdateAt: new Date() });

      // You might want to update the employee's performance based on tool execution
      // This would depend on your specific requirements
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Search employees
  searchEmployees: async (query: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await aiEmployeeService.searchEmployeesBySkills(
        [query],
        20
      );

      if (error) {
        set({ error, isLoading: false });
        return;
      }

      const employeesMap = (data || []).reduce(
        (acc, employee) => {
          acc[employee.id] = employee;
          return acc;
        },
        {} as Record<string, AIEmployee>
      );

      set({
        employees: employeesMap,
        isLoading: false,
        lastUpdateAt: new Date(),
      });
    } catch (error: unknown) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Set filters
  setFilters: filters => {
    set({ filters });
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} });
  },

  // Set selected employee
  setSelectedEmployee: employee => {
    set({ selectedEmployee: employee });
  },

  // Refresh all data
  refreshData: async () => {
    const { filters } = get();
    await get().loadEmployees(filters);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

// Selectors for common use cases
export const useEmployees = () =>
  useAIEmployeeStore(state => Object.values(state.employees));
export const useAvailableEmployees = () =>
  useAIEmployeeStore(state =>
    Object.values(state.employees).filter(emp => emp.status === 'available')
  );
export const useEmployeesByCategory = (category: EmployeeCategory) =>
  useAIEmployeeStore(state =>
    Object.values(state.employees).filter(emp => emp.category === category)
  );
export const useSelectedEmployee = () =>
  useAIEmployeeStore(state => state.selectedEmployee);
export const useEmployeeLoading = () =>
  useAIEmployeeStore(state => state.isLoading);
export const useEmployeeError = () => useAIEmployeeStore(state => state.error);
