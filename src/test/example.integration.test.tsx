import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoadingSpinner from '../components/ui/loading-spinner'

// Simple integration test examples
describe('Integration Tests', () => {
  const createTestQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

  it('renders LoadingSpinner with correct attributes', () => {
    render(<LoadingSpinner size="lg" />)

    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading...')
    expect(spinner).toHaveClass('h-8', 'w-8') // lg size classes
  })

  it('renders LoadingSpinner with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    let spinner = screen.getByRole('progressbar')
    expect(spinner).toHaveClass('h-4', 'w-4') // sm size classes

    rerender(<LoadingSpinner size="md" />)
    spinner = screen.getByRole('progressbar')
    expect(spinner).toHaveClass('h-6', 'w-6') // md size classes

    rerender(<LoadingSpinner size="lg" />)
    spinner = screen.getByRole('progressbar')
    expect(spinner).toHaveClass('h-8', 'w-8') // lg size classes
  })

  it('QueryClient can be created and configured', () => {
    const queryClient = createTestQueryClient()

    expect(queryClient).toBeInstanceOf(QueryClient)
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false)
  })

  it('can render components with required providers', () => {
    const TestComponent = () => <div>Test Content</div>
    const queryClient = createTestQueryClient()

    render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})