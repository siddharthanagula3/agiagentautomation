import { supabase } from '../integrations/supabase/client';
import type { Database } from '../integrations/supabase/types';

type AIAgent = Database['public']['Tables']['ai_agents']['Row'];
type AIAgentInsert = Database['public']['Tables']['ai_agents']['Insert'];
type AIAgentUpdate = Database['public']['Tables']['ai_agents']['Update'];

export interface AgentFilters {
  category?: string;
  status?: string;
  search?: string;
  minRating?: number;
  maxRate?: number;
}

export interface AgentStats {
  total: number;
  available: number;
  working: number;
  maintenance: number;
  offline: number;
}

class AgentsService {
  async getAgents(filters?: AgentFilters): Promise<{ data: AIAgent[]; error: string | null }> {
    try {
      let query = supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,role.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.minRating) {
        query = query.gte('rating', filters.minRating);
      }

      if (filters?.maxRate) {
        query = query.lte('hourly_rate', filters.maxRate);
      }

      const { data, error } = await query;

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async getAgentById(id: string): Promise<{ data: AIAgent | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  async getAgentStats(): Promise<{ data: AgentStats; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('status')
        .eq('is_active', true);

      if (error) {
        return { data: { total: 0, available: 0, working: 0, maintenance: 0, offline: 0 }, error: error.message };
      }

      const stats: AgentStats = {
        total: data?.length || 0,
        available: data?.filter(agent => agent.status === 'available').length || 0,
        working: data?.filter(agent => agent.status === 'working').length || 0,
        maintenance: data?.filter(agent => agent.status === 'maintenance').length || 0,
        offline: data?.filter(agent => agent.status === 'offline').length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: { total: 0, available: 0, working: 0, maintenance: 0, offline: 0 }, error: 'An unexpected error occurred' };
    }
  }

  async getAgentsByCategory(category: string): Promise<{ data: AIAgent[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async getTopRatedAgents(limit: number = 10): Promise<{ data: AIAgent[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async updateAgentStatus(id: string, status: AIAgent['status']): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ status })
        .eq('id', id);

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async updateAgentRating(id: string, rating: number): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({ rating })
        .eq('id', id);

      return { error: error?.message || null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async incrementTasksCompleted(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.rpc('increment_tasks_completed', { agent_id: id });
      return { error: error?.message || null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }

  async getAgentCategories(): Promise<{ data: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('category')
        .eq('is_active', true);

      if (error) {
        return { data: [], error: error.message };
      }

      const categories = [...new Set(data?.map(agent => agent.category) || [])];
      return { data: categories, error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }
  }

  // Real-time subscription for agent updates
  subscribeToAgents(callback: (agents: AIAgent[]) => void) {
    return supabase
      .channel('ai_agents_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_agents' },
        async () => {
          const { data } = await this.getAgents();
          callback(data);
        }
      )
      .subscribe();
  }

  // Search agents with advanced filtering
  async searchAgents(query: string, filters?: AgentFilters): Promise<{ data: AIAgent[]; error: string | null }> {
    try {
      let supabaseQuery = supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true);

      if (query) {
        supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,role.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (filters?.category) {
        supabaseQuery = supabaseQuery.eq('category', filters.category);
      }

      if (filters?.status) {
        supabaseQuery = supabaseQuery.eq('status', filters.status);
      }

      if (filters?.minRating) {
        supabaseQuery = supabaseQuery.gte('rating', filters.minRating);
      }

      if (filters?.maxRate) {
        supabaseQuery = supabaseQuery.lte('hourly_rate', filters.maxRate);
      }

      const { data, error } = await supabaseQuery.order('rating', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Service error:', error);
      return { data: [], error: null };
    }
  }
}

export const agentsService = new AgentsService();
