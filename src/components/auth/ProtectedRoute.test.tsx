import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockUser, adminUser } from '../../test/utils'
import ProtectedRoute from './ProtectedRoute'
import { PERMISSIONS } from '../../config/security'

// Mock Navigate component
const MockedNavigate = vi.fn(() => null)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: MockedNavigate,
    useLocation: () => ({ pathname: '/test' }),
  }
})

// Mock LoadingSpinner component
vi.mock('../ui/loading-spinner', () => ({
  default: ({ size }: { size: string }) => <div data-testid={`loading-spinner-${size}`}>Loading...</div>
}))

const TestComponent = () => <div>Protected Content</div>

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner when authentication is loading', () => {
    // Mock loading state
    vi.mocked(vi.importMeta.glob('../../contexts/AuthContext')).useAuth = () => ({
      isAuthenticated: false,
      isLoading: true,
      checkPermission: vi.fn(),
      hasRole: vi.fn(),
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner-lg')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: null }
    )

    expect(MockedNavigate).toHaveBeenCalledWith(
      { to: '/login', state: { from: { pathname: '/test' } }, replace: true },
      {}
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(MockedNavigate).not.toHaveBeenCalled()
  })

  it('redirects to unauthorized when user lacks required permissions', () => {
    renderWithProviders(
      <ProtectedRoute requiredPermissions={[PERMISSIONS['admin.users']]}>
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(MockedNavigate).toHaveBeenCalledWith(
      { to: '/unauthorized', replace: true },
      {}
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has required permissions', () => {
    renderWithProviders(
      <ProtectedRoute requiredPermissions={[PERMISSIONS['chat.send']]}>
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(MockedNavigate).not.toHaveBeenCalled()
  })

  it('redirects to unauthorized when user lacks required roles', () => {
    renderWithProviders(
      <ProtectedRoute requiredRoles={['admin']}>
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(MockedNavigate).toHaveBeenCalledWith(
      { to: '/unauthorized', replace: true },
      {}
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when user has required roles', () => {
    renderWithProviders(
      <ProtectedRoute requiredRoles={['admin']}>
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: adminUser }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(MockedNavigate).not.toHaveBeenCalled()
  })

  it('handles multiple required permissions (all required)', () => {
    renderWithProviders(
      <ProtectedRoute
        requiredPermissions={[
          PERMISSIONS['chat.send'],
          PERMISSIONS['marketplace.browse']
        ]}
      >
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(MockedNavigate).not.toHaveBeenCalled()
  })

  it('redirects when user lacks any of multiple required permissions', () => {
    renderWithProviders(
      <ProtectedRoute
        requiredPermissions={[
          PERMISSIONS['chat.send'],
          PERMISSIONS['admin.users'] // mockUser doesn't have this
        ]}
      >
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(MockedNavigate).toHaveBeenCalledWith(
      { to: '/unauthorized', replace: true },
      {}
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('uses custom fallback URL', () => {
    renderWithProviders(
      <ProtectedRoute fallbackUrl="/custom-login">
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: null }
    )

    expect(MockedNavigate).toHaveBeenCalledWith(
      { to: '/custom-login', state: { from: { pathname: '/test' } }, replace: true },
      {}
    )
  })

  it('handles both permissions and roles requirements', () => {
    renderWithProviders(
      <ProtectedRoute
        requiredPermissions={[PERMISSIONS['admin.users']]}
        requiredRoles={['admin']}
      >
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: adminUser }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(MockedNavigate).not.toHaveBeenCalled()
  })

  it('redirects when user has permissions but not roles', () => {
    renderWithProviders(
      <ProtectedRoute
        requiredPermissions={[PERMISSIONS['chat.send']]} // mockUser has this
        requiredRoles={['admin']} // mockUser doesn't have this
      >
        <TestComponent />
      </ProtectedRoute>,
      { initialUser: mockUser }
    )

    expect(MockedNavigate).toHaveBeenCalledWith(
      { to: '/unauthorized', replace: true },
      {}
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})