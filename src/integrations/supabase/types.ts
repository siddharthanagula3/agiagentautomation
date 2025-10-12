export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          name: string;
          avatar_url: string | null;
          role: 'admin' | 'super_admin' | 'user' | 'viewer';
          company: string | null;
          phone: string | null;
          location: string | null;
          timezone: string;
          preferences: Json;
          subscription_id: string | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          name: string;
          avatar_url?: string | null;
          role?: 'admin' | 'super_admin' | 'user' | 'viewer';
          company?: string | null;
          phone?: string | null;
          location?: string | null;
          timezone?: string;
          preferences?: Json;
          subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'super_admin' | 'user' | 'viewer';
          company?: string | null;
          phone?: string | null;
          location?: string | null;
          timezone?: string;
          preferences?: Json;
          subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      ai_agents: {
        Row: {
          id: string;
          name: string;
          role: string;
          category:
            | 'executive_leadership'
            | 'engineering_technology'
            | 'product_management'
            | 'design_ux'
            | 'ai_data_science'
            | 'it_security_ops'
            | 'marketing_growth'
            | 'sales_business'
            | 'customer_success'
            | 'human_resources'
            | 'finance_accounting'
            | 'legal_risk_compliance'
            | 'specialized_niche';
          description: string | null;
          skills: string[];
          status:
            | 'available'
            | 'working'
            | 'maintenance'
            | 'offline'
            | 'training';
          rating: number;
          tasks_completed: number;
          hourly_rate: number;
          performance: Json;
          availability: Json;
          capabilities: Json;
          limitations: string[];
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          category:
            | 'executive_leadership'
            | 'engineering_technology'
            | 'product_management'
            | 'design_ux'
            | 'ai_data_science'
            | 'it_security_ops'
            | 'marketing_growth'
            | 'sales_business'
            | 'customer_success'
            | 'human_resources'
            | 'finance_accounting'
            | 'legal_risk_compliance'
            | 'specialized_niche';
          description?: string | null;
          skills?: string[];
          status?:
            | 'available'
            | 'working'
            | 'maintenance'
            | 'offline'
            | 'training';
          rating?: number;
          tasks_completed?: number;
          hourly_rate?: number;
          performance?: Json;
          availability?: Json;
          capabilities?: Json;
          limitations?: string[];
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          category?:
            | 'executive_leadership'
            | 'engineering_technology'
            | 'product_management'
            | 'design_ux'
            | 'ai_data_science'
            | 'it_security_ops'
            | 'marketing_growth'
            | 'sales_business'
            | 'customer_success'
            | 'human_resources'
            | 'finance_accounting'
            | 'legal_risk_compliance'
            | 'specialized_niche';
          description?: string | null;
          skills?: string[];
          status?:
            | 'available'
            | 'working'
            | 'maintenance'
            | 'offline'
            | 'training';
          rating?: number;
          tasks_completed?: number;
          hourly_rate?: number;
          performance?: Json;
          availability?: Json;
          capabilities?: Json;
          limitations?: string[];
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status:
            | 'queued'
            | 'running'
            | 'completed'
            | 'failed'
            | 'paused'
            | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
          progress: number;
          assigned_agent_id: string | null;
          estimated_duration: number | null;
          actual_duration: number | null;
          cost: number;
          files: Json;
          tags: string[];
          metadata: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?:
            | 'queued'
            | 'running'
            | 'completed'
            | 'failed'
            | 'paused'
            | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
          progress?: number;
          assigned_agent_id?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          cost?: number;
          files?: Json;
          tags?: string[];
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?:
            | 'queued'
            | 'running'
            | 'completed'
            | 'failed'
            | 'paused'
            | 'cancelled';
          priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
          progress?: number;
          assigned_agent_id?: string | null;
          estimated_duration?: number | null;
          actual_duration?: number | null;
          cost?: number;
          files?: Json;
          tags?: string[];
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_name: string;
          amount: number;
          status:
            | 'active'
            | 'cancelled'
            | 'past_due'
            | 'trialing'
            | 'incomplete';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          features: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_name: string;
          amount: number;
          status?:
            | 'active'
            | 'cancelled'
            | 'past_due'
            | 'trialing'
            | 'incomplete';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          features?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_name?: string;
          amount?: number;
          status?:
            | 'active'
            | 'cancelled'
            | 'past_due'
            | 'trialing'
            | 'incomplete';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          features?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      billing: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          amount: number;
          status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
          description: string | null;
          invoice_url: string | null;
          paid_at: string | null;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          amount: number;
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
          description?: string | null;
          invoice_url?: string | null;
          paid_at?: string | null;
          due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          amount?: number;
          status?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
          description?: string | null;
          invoice_url?: string | null;
          paid_at?: string | null;
          due_date?: string | null;
          created_at?: string;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          user_id: string;
          agent_id: string | null;
          job_id: string | null;
          tokens_used: number;
          cost: number;
          duration_minutes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agent_id?: string | null;
          job_id?: string | null;
          tokens_used?: number;
          cost?: number;
          duration_minutes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agent_id?: string | null;
          job_id?: string | null;
          tokens_used?: number;
          cost?: number;
          duration_minutes?: number;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: string;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          description: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          description?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          description?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_stats: {
        Args: {
          user_uuid: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
