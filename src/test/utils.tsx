import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '../components/ui/tooltip'
import { AuthProvider } from '../contexts/AuthContext'
import { User } from '../lib/auth'
import { vi } from 'vitest'
import { createTestQueryClient } from './query-client'

interface TestProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
  initialUser?: User | null
  initialRoute?: string
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient = createTestQueryClient(),
  initialUser = null,
  initialRoute = '/'
}) => {
  const mockAuthContext = {
    user: initialUser,
    isLoading: false,
    isAuthenticated: !!initialUser,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    checkPermission: vi.fn((permission: string) =>
      initialUser?.permissions.includes(permission) || false
    ),
    hasRole: vi.fn((role: string) =>
      initialUser?.roles.includes(role) || false
    )
  }

  if (initialRoute !== '/') {
    window.history.pushState({}, '', initialRoute)
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

