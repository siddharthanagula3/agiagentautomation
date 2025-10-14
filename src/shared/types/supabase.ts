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
