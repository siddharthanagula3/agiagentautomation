/**
 * Workforce Store
 * Manages hired AI employees and provides real-time sync
 */

import { create } from 'zustand';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from './unified-auth-store';

interface HiredEmployee {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  role: string;
  provider: string;
  is_active: boolean;
  purchased_at: string;
  created_at: string;
  updated_at: string;
}

interface WorkforceState {
  hiredEmployees: HiredEmployee[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHiredEmployees: () => Promise<void>;
  addHiredEmployee: (employee: HiredEmployee) => void;
  removeHiredEmployee: (employeeId: string) => void;
  clearError: () => void;
  reset: () => void;
}

export const useWorkforceStore = create<WorkforceState>((set, get) => ({
  hiredEmployees: [],
  isLoading: false,
  error: null,

  fetchHiredEmployees: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ hiredEmployees: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('purchased_employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('purchased_at', { ascending: false });

            if (error) {
        console.error('[WorkforceStore] Error fetching hired employees:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ hiredEmployees: data || [], isLoading: false });
          } catch (error) {
      console.error('[WorkforceStore] Unexpected error:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      });
    }
  },

  addHiredEmployee: (employee: HiredEmployee) => {
    set((state) => ({
      hiredEmployees: [employee, ...state.hiredEmployees],
    }));
  },

  removeHiredEmployee: (employeeId: string) => {
    set((state) => ({
      hiredEmployees: state.hiredEmployees.filter(
        (emp) => emp.employee_id !== employeeId
      ),
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({ hiredEmployees: [], isLoading: false, error: null });
  },
}));

// Set up real-time subscription
let subscription: ReturnType<typeof supabase.channel> | null = null;

export const setupWorkforceSubscription = () => {
  const { user } = useAuthStore.getState();
  if (!user || subscription) return;

  subscription = supabase
    .channel('workforce-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'purchased_employees',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('[WorkforceStore] Real-time update:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              useWorkforceStore.getState().addHiredEmployee(newRecord as HiredEmployee);
            }
            break;
          case 'UPDATE':
            // Handle updates if needed
            break;
          case 'DELETE':
            if (oldRecord) {
              useWorkforceStore.getState().removeHiredEmployee(oldRecord.employee_id);
            }
                  break;
              }
      }
    )
    .subscribe();

  console.log('[WorkforceStore] Real-time subscription established');
};

export const cleanupWorkforceSubscription = () => {
  if (subscription) {
    supabase.removeChannel(subscription);
    subscription = null;
    console.log('[WorkforceStore] Real-time subscription cleaned up');
  }
};

// Listen for team refresh events
if (typeof window !== 'undefined') {
  window.addEventListener('team:refresh', () => {
    useWorkforceStore.getState().fetchHiredEmployees();
  });
}