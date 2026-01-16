/**
 * Workforce Store
 * Manages hired AI employees and provides real-time sync
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '@shared/lib/supabase-client';
import { useAuthStore } from './authentication-store';

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

interface HireEmployeeParams {
  employee_id: string;
  name: string;
  role: string;
  provider: string;
}

interface WorkforceState {
  hiredEmployees: HiredEmployee[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHiredEmployees: () => Promise<void>;
  addHiredEmployee: (employee: HiredEmployee) => void;
  hireEmployee: (params: HireEmployeeParams) => Promise<HiredEmployee | null>;
  removeHiredEmployee: (employeeId: string) => void;
  fireEmployee: (employeeId: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const enableDevtools = import.meta.env.MODE !== 'production';

export const useWorkforceStore = create<WorkforceState>()(
  devtools(
    immer((set, get) => ({
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
        console.error(
          '[WorkforceStore] Error fetching hired employees:',
          error
        );
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ hiredEmployees: data || [], isLoading: false });
    } catch (error) {
      console.error('[WorkforceStore] Unexpected error:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  addHiredEmployee: (employee: HiredEmployee) => {
    set((state) => ({
      hiredEmployees: [employee, ...state.hiredEmployees],
    }));
  },

  /**
   * Hire an employee - persists to database and updates local state
   * This is the primary method for hiring employees from the UI
   */
  hireEmployee: async (params: HireEmployeeParams) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: 'User not authenticated' });
      return null;
    }

    set({ isLoading: true, error: null });

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('purchased_employees')
        .upsert(
          {
            user_id: user.id,
            employee_id: params.employee_id,
            name: params.name,
            role: params.role,
            provider: params.provider,
            is_active: true,
            purchased_at: now,
          },
          { onConflict: 'user_id,employee_id' }
        )
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('[WorkforceStore] Error hiring employee:', error);
        set({ error: error.message, isLoading: false });
        return null;
      }

      if (data) {
        // Add to local state (real-time subscription might also do this, but better to be responsive)
        const exists = get().hiredEmployees.some(
          (emp) => emp.employee_id === params.employee_id
        );
        if (!exists) {
          set((state) => ({
            hiredEmployees: [data as HiredEmployee, ...state.hiredEmployees],
            isLoading: false,
          }));
        } else {
          set({ isLoading: false });
        }
      }

      return data as HiredEmployee;
    } catch (error) {
      console.error('[WorkforceStore] Unexpected error hiring employee:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      return null;
    }
  },

  removeHiredEmployee: (employeeId: string) => {
    set((state) => ({
      hiredEmployees: state.hiredEmployees.filter(
        (emp) => emp.employee_id !== employeeId
      ),
    }));
  },

  /**
   * Fire an employee - persists to database and updates local state
   * Sets is_active to false rather than deleting
   */
  fireEmployee: async (employeeId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ error: 'User not authenticated' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('purchased_employees')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('employee_id', employeeId);

      if (error) {
        console.error('[WorkforceStore] Error firing employee:', error);
        set({ error: error.message, isLoading: false });
        return false;
      }

      // Remove from local state
      set((state) => ({
        hiredEmployees: state.hiredEmployees.filter(
          (emp) => emp.employee_id !== employeeId
        ),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error('[WorkforceStore] Unexpected error firing employee:', error);
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({ hiredEmployees: [], isLoading: false, error: null });
  },
    })),
    { name: 'WorkforceStore', enabled: enableDevtools }
  )
);

// Set up real-time subscription
// Track both the subscription and the user ID it was created for
let subscription: ReturnType<typeof supabase.channel> | null = null;
let subscriptionUserId: string | null = null;

/**
 * Set up real-time subscription for workforce changes
 * Automatically cleans up stale subscriptions if user changes
 */
export const setupWorkforceSubscription = () => {
  const { user } = useAuthStore.getState();

  // No user - clean up any existing subscription and exit
  if (!user) {
    cleanupWorkforceSubscription();
    return;
  }

  // If subscription exists for a different user, clean it up first
  if (subscription && subscriptionUserId !== user.id) {
    console.log('[WorkforceStore] User changed, cleaning up old subscription');
    cleanupWorkforceSubscription();
  }

  // If subscription already exists for this user, don't create a new one
  if (subscription && subscriptionUserId === user.id) {
    return;
  }

  // Create new subscription
  const channelName = `workforce-changes-${user.id}-${Date.now()}`;
  subscription = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'purchased_employees',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        // Verify subscription is still valid (user hasn't changed)
        const currentUser = useAuthStore.getState().user;
        if (!currentUser || currentUser.id !== subscriptionUserId) {
          console.warn('[WorkforceStore] Ignoring stale subscription event');
          return;
        }

        console.log('[WorkforceStore] Real-time update:', payload);

        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              useWorkforceStore
                .getState()
                .addHiredEmployee(newRecord as HiredEmployee);
            }
            break;
          case 'UPDATE':
            // Refresh the full list on updates to ensure consistency
            useWorkforceStore.getState().fetchHiredEmployees();
            break;
          case 'DELETE':
            if (oldRecord) {
              useWorkforceStore
                .getState()
                .removeHiredEmployee(oldRecord.employee_id);
            }
            break;
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[WorkforceStore] Real-time subscription established for user:', user.id);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[WorkforceStore] Subscription error, cleaning up');
        cleanupWorkforceSubscription();
      }
    });

  subscriptionUserId = user.id;
};

/**
 * Clean up workforce subscription
 * Safe to call multiple times - will only clean up if subscription exists
 */
export const cleanupWorkforceSubscription = () => {
  if (subscription) {
    try {
      supabase.removeChannel(subscription);
      console.log('[WorkforceStore] Real-time subscription cleaned up');
    } catch (error) {
      console.warn('[WorkforceStore] Error cleaning up subscription:', error);
    }
    subscription = null;
    subscriptionUserId = null;
  }
};

/**
 * Check if subscription is active for the current user
 */
export const isWorkforceSubscriptionActive = (): boolean => {
  const { user } = useAuthStore.getState();
  return !!(subscription && user && subscriptionUserId === user.id);
};

// Listen for team refresh events
// Use a module-level flag to prevent multiple event listener registration on HMR
let teamRefreshListenerAdded = false;
if (typeof window !== 'undefined' && !teamRefreshListenerAdded) {
  teamRefreshListenerAdded = true;
  window.addEventListener('team:refresh', () => {
    useWorkforceStore.getState().fetchHiredEmployees();
  });
}

// CRITICAL FIX: Listen for auth state changes to clean up subscriptions on logout
// This prevents memory leaks and data leakage between users
let authStateListenerAdded = false;
if (typeof window !== 'undefined' && !authStateListenerAdded) {
  authStateListenerAdded = true;

  // Subscribe to auth store changes
  // When user logs out (user becomes null), clean up the realtime subscription
  useAuthStore.subscribe((state, prevState) => {
    const wasLoggedIn = !!prevState.user;
    const isLoggedIn = !!state.user;

    // User logged out - clean up subscription and reset store
    if (wasLoggedIn && !isLoggedIn) {
      console.log('[WorkforceStore] User logged out, cleaning up subscription');
      cleanupWorkforceSubscription();
      useWorkforceStore.getState().reset();
    }

    // User logged in - set up new subscription
    if (!wasLoggedIn && isLoggedIn) {
      console.log('[WorkforceStore] User logged in, setting up subscription');
      setupWorkforceSubscription();
      useWorkforceStore.getState().fetchHiredEmployees();
    }

    // User changed (different user logged in) - clean up and re-setup
    if (wasLoggedIn && isLoggedIn && prevState.user?.id !== state.user?.id) {
      console.log('[WorkforceStore] User changed, resetting subscription');
      cleanupWorkforceSubscription();
      useWorkforceStore.getState().reset();
      setupWorkforceSubscription();
      useWorkforceStore.getState().fetchHiredEmployees();
    }
  });
}
