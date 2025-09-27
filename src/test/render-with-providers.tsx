import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import { User } from '../lib/auth'
import { TestProviders } from './utils'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialUser?: User | null
  initialRoute?: string
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    queryClient,
    initialUser,
    initialRoute,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        queryClient={queryClient}
        initialUser={initialUser}
        initialRoute={initialRoute}
      >
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  })
}