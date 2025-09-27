import { createContext } from 'react';
import { type AuthUser } from '../services/authService';

export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    company?: string;
    phone?: string;
    location?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);