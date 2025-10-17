export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          api_endpoint: string;
          created_at: string | null;
          id: string;
          limit_per_hour: number;
          request_count: number | null;
          user_id: string;
          window_end: string;
          window_start: string;
        };
        Insert: {
          api_endpoint: string;
          created_at?: string | null;
          id?: string;
          limit_per_hour: number;
          request_count?: number | null;
          user_id: string;
          window_end: string;
          window_start: string;
        };
        Update: {
          api_endpoint?: string;
          created_at?: string | null;
          id?: string;
          limit_per_hour?: number;
          request_count?: number | null;
          user_id?: string;
          window_end?: string;
          window_start?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: string | null;
          resource_id: string | null;
          resource_type: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      automation_connections: {
        Row: {
          connection_type: string | null;
          created_at: string | null;
          id: string;
          source_node_id: string;
          target_node_id: string;
          workflow_id: string;
        };
        Insert: {
          connection_type?: string | null;
          created_at?: string | null;
          id?: string;
          source_node_id: string;
          target_node_id: string;
          workflow_id: string;
        };
        Update: {
          connection_type?: string | null;
          created_at?: string | null;
          id?: string;
          source_node_id?: string;
          target_node_id?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_connections_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'automation_workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      automation_executions: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          error_stack: string | null;
          executed_at: string | null;
          execution_log: string[] | null;
          id: string;
          input_data: Json | null;
          output_data: Json | null;
          started_at: string | null;
          status: string;
          trigger_source: string | null;
          user_id: string;
          workflow_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          error_stack?: string | null;
          executed_at?: string | null;
          execution_log?: string[] | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string;
          trigger_source?: string | null;
          user_id: string;
          workflow_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          error_stack?: string | null;
          executed_at?: string | null;
          execution_log?: string[] | null;
          id?: string;
          input_data?: Json | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string;
          trigger_source?: string | null;
          user_id?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_executions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'automation_workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      automation_nodes: {
        Row: {
          created_at: string | null;
          id: string;
          node_config: Json;
          node_id: string;
          node_type: string;
          position_x: number | null;
          position_y: number | null;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          node_config: Json;
          node_id: string;
          node_type: string;
          position_x?: number | null;
          position_y?: number | null;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          node_config?: Json;
          node_id?: string;
          node_type?: string;
          position_x?: number | null;
          position_y?: number | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'automation_nodes_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'automation_workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      automation_workflows: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_template: boolean | null;
          last_executed_at: string | null;
          name: string;
          tags: string[] | null;
          trigger_config: Json | null;
          trigger_type: string;
          updated_at: string | null;
          user_id: string;
          version: number | null;
          workflow_config: Json;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_template?: boolean | null;
          last_executed_at?: string | null;
          name: string;
          tags?: string[] | null;
          trigger_config?: Json | null;
          trigger_type: string;
          updated_at?: string | null;
          user_id: string;
          version?: number | null;
          workflow_config: Json;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_template?: boolean | null;
          last_executed_at?: string | null;
          name?: string;
          tags?: string[] | null;
          trigger_config?: Json | null;
          trigger_type?: string;
          updated_at?: string | null;
          user_id?: string;
          version?: number | null;
          workflow_config?: Json;
        };
        Relationships: [];
      };
      blog_authors: {
        Row: {
          avatar_emoji: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          display_name: string;
          id: string;
          post_count: number | null;
          social_links: Json | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          avatar_emoji?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name: string;
          id?: string;
          post_count?: number | null;
          social_links?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          avatar_emoji?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          display_name?: string;
          id?: string;
          post_count?: number | null;
          social_links?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      blog_categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          post_count: number | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          post_count?: number | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          post_count?: number | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      blog_comments: {
        Row: {
          approved: boolean | null;
          content: string;
          created_at: string | null;
          id: string;
          parent_id: string | null;
          post_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          approved?: boolean | null;
          content: string;
          created_at?: string | null;
          id?: string;
          parent_id?: string | null;
          post_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          approved?: boolean | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          parent_id?: string | null;
          post_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_comments_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'blog_comments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'blog_posts';
            referencedColumns: ['id'];
          },
        ];
      };
      cache_entries: {
        Row: {
          accessed_count: number | null;
          cache_key: string;
          cache_value: Json;
          created_at: string | null;
          expires_at: string;
          id: string;
          last_accessed_at: string | null;
        };
        Insert: {
          accessed_count?: number | null;
          cache_key: string;
          cache_value: Json;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          last_accessed_at?: string | null;
        };
        Update: {
          accessed_count?: number | null;
          cache_key?: string;
          cache_value?: Json;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          last_accessed_at?: string | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          role: string;
          session_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          role: string;
          session_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          role?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_sessions: {
        Row: {
          created_at: string | null;
          employee_id: string;
          id: string;
          is_active: boolean | null;
          last_message_at: string | null;
          provider: string;
          role: string;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          employee_id: string;
          id?: string;
          is_active?: boolean | null;
          last_message_at?: string | null;
          provider: string;
          role: string;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          is_active?: boolean | null;
          last_message_at?: string | null;
          provider?: string;
          role?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          company: string;
          company_size: string | null;
          created_at: string | null;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          message: string;
          metadata: Json | null;
          phone: string | null;
          source: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          company: string;
          company_size?: string | null;
          created_at?: string | null;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          message: string;
          metadata?: Json | null;
          phone?: string | null;
          source?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company?: string;
          company_size?: string | null;
          created_at?: string | null;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          message?: string;
          metadata?: Json | null;
          phone?: string | null;
          source?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          ai_employee_id: string | null;
          amount: number;
          created_at: string | null;
          description: string | null;
          id: string;
          metadata: Json | null;
          transaction_type: string;
          user_credit_id: string | null;
          user_id: string;
          workflow_id: string | null;
        };
        Insert: {
          ai_employee_id?: string | null;
          amount: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          transaction_type: string;
          user_credit_id?: string | null;
          user_id: string;
          workflow_id?: string | null;
        };
        Update: {
          ai_employee_id?: string | null;
          amount?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          transaction_type?: string;
          user_credit_id?: string | null;
          user_id?: string;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'credit_transactions_user_credit_id_fkey';
            columns: ['user_credit_id'];
            isOneToOne: false;
            referencedRelation: 'user_credits';
            referencedColumns: ['id'];
          },
        ];
      };
      faq_items: {
        Row: {
          answer: string;
          category: string | null;
          created_at: string | null;
          display_order: number | null;
          helpful_count: number | null;
          id: string;
          published: boolean | null;
          question: string;
          updated_at: string | null;
        };
        Insert: {
          answer: string;
          category?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          helpful_count?: number | null;
          id?: string;
          published?: boolean | null;
          question: string;
          updated_at?: string | null;
        };
        Update: {
          answer?: string;
          category?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          helpful_count?: number | null;
          id?: string;
          published?: boolean | null;
          question?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      help_articles: {
        Row: {
          category_id: string | null;
          content: string;
          created_at: string | null;
          excerpt: string | null;
          helpful_count: number | null;
          id: string;
          published: boolean | null;
          slug: string;
          title: string;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          category_id?: string | null;
          content: string;
          created_at?: string | null;
          excerpt?: string | null;
          helpful_count?: number | null;
          id?: string;
          published?: boolean | null;
          slug: string;
          title: string;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          category_id?: string | null;
          content?: string;
          created_at?: string | null;
          excerpt?: string | null;
          helpful_count?: number | null;
          id?: string;
          published?: boolean | null;
          slug?: string;
          title?: string;
          updated_at?: string | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'help_articles_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'support_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      integration_configs: {
        Row: {
          created_at: string | null;
          credentials: Json | null;
          id: string;
          integration_name: string;
          integration_type: string;
          is_active: boolean | null;
          last_used_at: string | null;
          rate_limit: number | null;
          settings: Json | null;
          total_uses: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          credentials?: Json | null;
          id?: string;
          integration_name: string;
          integration_type: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          rate_limit?: number | null;
          settings?: Json | null;
          total_uses?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          credentials?: Json | null;
          id?: string;
          integration_name?: string;
          integration_type?: string;
          is_active?: boolean | null;
          last_used_at?: string | null;
          rate_limit?: number | null;
          settings?: Json | null;
          total_uses?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          email: string;
          id: string;
          metadata: Json | null;
          name: string | null;
          source: string | null;
          status: string | null;
          subscribed_at: string | null;
          tags: Json | null;
          unsubscribed_at: string | null;
        };
        Insert: {
          email: string;
          id?: string;
          metadata?: Json | null;
          name?: string | null;
          source?: string | null;
          status?: string | null;
          subscribed_at?: string | null;
          tags?: Json | null;
          unsubscribed_at?: string | null;
        };
        Update: {
          email?: string;
          id?: string;
          metadata?: Json | null;
          name?: string | null;
          source?: string | null;
          status?: string | null;
          subscribed_at?: string | null;
          tags?: Json | null;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          link: string | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          message?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      purchased_employees: {
        Row: {
          created_at: string | null;
          employee_id: string;
          id: string;
          is_active: boolean | null;
          name: string;
          provider: string;
          purchased_at: string | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          employee_id: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          provider: string;
          purchased_at?: string | null;
          role: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          provider?: string;
          purchased_at?: string | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      resource_downloads: {
        Row: {
          downloaded_at: string | null;
          id: string;
          resource_id: string | null;
          user_email: string | null;
          user_id: string | null;
        };
        Insert: {
          downloaded_at?: string | null;
          id?: string;
          resource_id?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Update: {
          downloaded_at?: string | null;
          id?: string;
          resource_id?: string | null;
          user_email?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_downloads_resource_id_fkey';
            columns: ['resource_id'];
            isOneToOne: false;
            referencedRelation: 'resources';
            referencedColumns: ['id'];
          },
        ];
      };
      resources: {
        Row: {
          category: string;
          created_at: string | null;
          description: string;
          download_count: number | null;
          duration: string | null;
          featured: boolean | null;
          file_url: string | null;
          id: string;
          metadata: Json | null;
          published: boolean | null;
          thumbnail_url: string | null;
          title: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description: string;
          download_count?: number | null;
          duration?: string | null;
          featured?: boolean | null;
          file_url?: string | null;
          id?: string;
          metadata?: Json | null;
          published?: boolean | null;
          thumbnail_url?: string | null;
          title: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string;
          download_count?: number | null;
          duration?: string | null;
          featured?: boolean | null;
          file_url?: string | null;
          id?: string;
          metadata?: Json | null;
          published?: boolean | null;
          thumbnail_url?: string | null;
          title?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sales_leads: {
        Row: {
          assigned_to: string | null;
          company: string | null;
          contact_submission_id: string | null;
          created_at: string | null;
          email: string;
          estimated_value: number | null;
          id: string;
          lead_score: number | null;
          metadata: Json | null;
          notes: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          company?: string | null;
          contact_submission_id?: string | null;
          created_at?: string | null;
          email: string;
          estimated_value?: number | null;
          id?: string;
          lead_score?: number | null;
          metadata?: Json | null;
          notes?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          company?: string | null;
          contact_submission_id?: string | null;
          created_at?: string | null;
          email?: string;
          estimated_value?: number | null;
          id?: string;
          lead_score?: number | null;
          metadata?: Json | null;
          notes?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sales_leads_contact_submission_id_fkey';
            columns: ['contact_submission_id'];
            isOneToOne: false;
            referencedRelation: 'contact_submissions';
            referencedColumns: ['id'];
          },
        ];
      };
      scheduled_tasks: {
        Row: {
          created_at: string | null;
          cron_expression: string;
          id: string;
          is_active: boolean | null;
          last_run_at: string | null;
          name: string;
          next_run_at: string | null;
          timezone: string | null;
          total_runs: number | null;
          updated_at: string | null;
          user_id: string;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          cron_expression: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          name: string;
          next_run_at?: string | null;
          timezone?: string | null;
          total_runs?: number | null;
          updated_at?: string | null;
          user_id: string;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          cron_expression?: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          name?: string;
          next_run_at?: string | null;
          timezone?: string | null;
          total_runs?: number | null;
          updated_at?: string | null;
          user_id?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scheduled_tasks_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'automation_workflows';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_plans: {
        Row: {
          active: boolean | null;
          color_gradient: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          features: Json;
          id: string;
          name: string;
          not_included: Json | null;
          popular: boolean | null;
          price_monthly: number | null;
          price_yearly: number | null;
          slug: string;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          color_gradient?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          features?: Json;
          id?: string;
          name: string;
          not_included?: Json | null;
          popular?: boolean | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          slug: string;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          color_gradient?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          features?: Json;
          id?: string;
          name?: string;
          not_included?: Json | null;
          popular?: boolean | null;
          price_monthly?: number | null;
          price_yearly?: number | null;
          slug?: string;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      support_categories: {
        Row: {
          article_count: number | null;
          color_gradient: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon: string | null;
          id: string;
          slug: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          article_count?: number | null;
          color_gradient?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          slug: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          article_count?: number | null;
          color_gradient?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          slug?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      support_ticket_messages: {
        Row: {
          attachments: Json | null;
          created_at: string | null;
          id: string;
          is_internal: boolean | null;
          message: string;
          ticket_id: string | null;
          user_id: string | null;
        };
        Insert: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          message: string;
          ticket_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          is_internal?: boolean | null;
          message?: string;
          ticket_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'support_ticket_messages_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'support_tickets';
            referencedColumns: ['id'];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_to: string | null;
          category_id: string | null;
          created_at: string | null;
          description: string;
          id: string;
          priority: string | null;
          status: string | null;
          subject: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description: string;
          id?: string;
          priority?: string | null;
          status?: string | null;
          subject: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          description?: string;
          id?: string;
          priority?: string | null;
          status?: string | null;
          subject?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'support_tickets_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'support_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      token_usage: {
        Row: {
          created_at: string | null;
          id: string;
          input_cost: number;
          input_tokens: number;
          model: string;
          output_cost: number;
          output_tokens: number;
          provider: string;
          session_id: string | null;
          total_cost: number;
          total_tokens: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          input_cost?: number;
          input_tokens?: number;
          model: string;
          output_cost?: number;
          output_tokens?: number;
          provider: string;
          session_id?: string | null;
          total_cost?: number;
          total_tokens?: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          input_cost?: number;
          input_tokens?: number;
          model?: string;
          output_cost?: number;
          output_tokens?: number;
          provider?: string;
          session_id?: string | null;
          total_cost?: number;
          total_tokens?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      user_api_keys: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_credits: {
        Row: {
          bonus_credits: number | null;
          created_at: string | null;
          credits_used: number | null;
          first_time_user: boolean | null;
          id: string;
          last_billing_date: string | null;
          last_credit_purchase: string | null;
          next_billing_date: string | null;
          purchased_credits: number | null;
          subscription_id: string | null;
          total_credits: number | null;
          updated_at: string | null;
          user_id: string;
          weekly_billing_enabled: boolean | null;
        };
        Insert: {
          bonus_credits?: number | null;
          created_at?: string | null;
          credits_used?: number | null;
          first_time_user?: boolean | null;
          id?: string;
          last_billing_date?: string | null;
          last_credit_purchase?: string | null;
          next_billing_date?: string | null;
          purchased_credits?: number | null;
          subscription_id?: string | null;
          total_credits?: number | null;
          updated_at?: string | null;
          user_id: string;
          weekly_billing_enabled?: boolean | null;
        };
        Update: {
          bonus_credits?: number | null;
          created_at?: string | null;
          credits_used?: number | null;
          first_time_user?: boolean | null;
          id?: string;
          last_billing_date?: string | null;
          last_credit_purchase?: string | null;
          next_billing_date?: string | null;
          purchased_credits?: number | null;
          subscription_id?: string | null;
          total_credits?: number | null;
          updated_at?: string | null;
          user_id?: string;
          weekly_billing_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_credits_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          id: string;
          language: string | null;
          name: string | null;
          phone: string | null;
          timezone: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          id: string;
          language?: string | null;
          name?: string | null;
          phone?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          language?: string | null;
          name?: string | null;
          phone?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          created_at: string | null;
          device_info: string | null;
          expires_at: string | null;
          id: string;
          ip_address: string | null;
          last_activity: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          device_info?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: string | null;
          last_activity?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          device_info?: string | null;
          expires_at?: string | null;
          id?: string;
          ip_address?: string | null;
          last_activity?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          analytics_enabled: boolean | null;
          auto_save: boolean | null;
          backup_frequency: string | null;
          cache_size: string | null;
          created_at: string | null;
          debug_mode: boolean | null;
          email_notifications: boolean | null;
          employee_updates: boolean | null;
          id: string;
          instant_alerts: boolean | null;
          marketing_emails: boolean | null;
          max_concurrent_jobs: number | null;
          push_notifications: boolean | null;
          retention_period: number | null;
          session_timeout: number | null;
          system_maintenance: boolean | null;
          theme: string | null;
          two_factor_enabled: boolean | null;
          updated_at: string | null;
          weekly_reports: boolean | null;
          workflow_alerts: boolean | null;
        };
        Insert: {
          analytics_enabled?: boolean | null;
          auto_save?: boolean | null;
          backup_frequency?: string | null;
          cache_size?: string | null;
          created_at?: string | null;
          debug_mode?: boolean | null;
          email_notifications?: boolean | null;
          employee_updates?: boolean | null;
          id: string;
          instant_alerts?: boolean | null;
          marketing_emails?: boolean | null;
          max_concurrent_jobs?: number | null;
          push_notifications?: boolean | null;
          retention_period?: number | null;
          session_timeout?: number | null;
          system_maintenance?: boolean | null;
          theme?: string | null;
          two_factor_enabled?: boolean | null;
          updated_at?: string | null;
          weekly_reports?: boolean | null;
          workflow_alerts?: boolean | null;
        };
        Update: {
          analytics_enabled?: boolean | null;
          auto_save?: boolean | null;
          backup_frequency?: string | null;
          cache_size?: string | null;
          created_at?: string | null;
          debug_mode?: boolean | null;
          email_notifications?: boolean | null;
          employee_updates?: boolean | null;
          id?: string;
          instant_alerts?: boolean | null;
          marketing_emails?: boolean | null;
          max_concurrent_jobs?: number | null;
          push_notifications?: boolean | null;
          retention_period?: number | null;
          session_timeout?: number | null;
          system_maintenance?: boolean | null;
          theme?: string | null;
          two_factor_enabled?: boolean | null;
          updated_at?: string | null;
          weekly_reports?: boolean | null;
          workflow_alerts?: boolean | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          billing_cycle: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_id: string | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          trial_end: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          billing_cycle?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          billing_cycle?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          trial_end?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar: string | null;
          billing_period: string | null;
          created_at: string | null;
          email: string;
          id: string;
          is_active: boolean | null;
          last_login: string | null;
          location: string | null;
          name: string | null;
          phone: string | null;
          plan: string | null;
          plan_status: string | null;
          preferences: Json | null;
          role: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_end_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar?: string | null;
          billing_period?: string | null;
          created_at?: string | null;
          email: string;
          id: string;
          is_active?: boolean | null;
          last_login?: string | null;
          location?: string | null;
          name?: string | null;
          phone?: string | null;
          plan?: string | null;
          plan_status?: string | null;
          preferences?: Json | null;
          role?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_end_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar?: string | null;
          billing_period?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean | null;
          last_login?: string | null;
          location?: string | null;
          name?: string | null;
          phone?: string | null;
          plan?: string | null;
          plan_status?: string | null;
          preferences?: Json | null;
          role?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_end_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      webhook_configs: {
        Row: {
          allowed_methods: string[] | null;
          created_at: string | null;
          headers_config: Json | null;
          id: string;
          is_active: boolean | null;
          last_triggered_at: string | null;
          name: string;
          total_triggers: number | null;
          updated_at: string | null;
          user_id: string;
          webhook_secret: string | null;
          webhook_url: string;
          workflow_id: string | null;
        };
        Insert: {
          allowed_methods?: string[] | null;
          created_at?: string | null;
          headers_config?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          name: string;
          total_triggers?: number | null;
          updated_at?: string | null;
          user_id: string;
          webhook_secret?: string | null;
          webhook_url: string;
          workflow_id?: string | null;
        };
        Update: {
          allowed_methods?: string[] | null;
          created_at?: string | null;
          headers_config?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          name?: string;
          total_triggers?: number | null;
          updated_at?: string | null;
          user_id?: string;
          webhook_secret?: string | null;
          webhook_url?: string;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_configs_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'automation_workflows';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
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
      blog_authors: {
        Row: {
          id: string;
          display_name: string;
          bio: string | null;
          avatar_emoji: string | null;
          avatar_url: string | null;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          bio?: string | null;
          avatar_emoji?: string | null;
          avatar_url?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          bio?: string | null;
          avatar_emoji?: string | null;
          avatar_url?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          image_url: string | null;
          author_id: string;
          category_id: string;
          published: boolean;
          featured: boolean;
          read_time: string | null;
          views: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string | null;
          image_url?: string | null;
          author_id: string;
          category_id: string;
          published?: boolean;
          featured?: boolean;
          read_time?: string | null;
          views?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string | null;
          image_url?: string | null;
          author_id?: string;
          category_id?: string;
          published?: boolean;
          featured?: boolean;
          read_time?: string | null;
          views?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'blog_authors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blog_posts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'blog_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          phone: string | null;
          timezone: string | null;
          language: string | null;
          bio: string | null;
          company: string | null;
          role: string | null;
          plan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string | null;
          language?: string | null;
          bio?: string | null;
          company?: string | null;
          role?: string | null;
          plan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string | null;
          language?: string | null;
          bio?: string | null;
          company?: string | null;
          role?: string | null;
          plan?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workforce: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          employee_name: string;
          employee_role: string;
          employee_provider: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          employee_name: string;
          employee_role: string;
          employee_provider: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          employee_name?: string;
          employee_role?: string;
          employee_provider?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
