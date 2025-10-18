# Testing Guide

## Testing Strategy

The project uses a comprehensive testing approach with multiple layers:

- **Unit Tests** - Individual functions and components
- **Integration Tests** - API interactions and data flow
- **E2E Tests** - Complete user workflows
- **Type Checking** - TypeScript validation

## Test Structure

```
tests/
├── unit/
│   ├── _core/           # Core services tests
│   ├── features/        # Feature module tests
│   └── shared/          # Shared utilities tests
├── integration/
│   ├── api/             # API integration tests
│   ├── database/        # Database tests
│   └── e2e-workflows/   # Workflow tests
└── e2e/
    └── playwright/      # E2E test suites
```

## Running Tests

### All Tests

```bash
npm run test
```

### Unit Tests Only

```bash
npm run test:unit
```

### E2E Tests Only

```bash
npm run e2e
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Unit Testing

### Framework: Vitest

**Configuration:** `vitest.config.ts`

### Writing Unit Tests

**Example: Testing a utility function**

```typescript
// tests/unit/shared/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '@shared/utils/formatDate';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2023-01-01');
    expect(formatDate(date)).toBe('Jan 1, 2023');
  });
});
```

**Example: Testing a React component**

```typescript
// tests/unit/features/auth/components/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '@features/auth/components/LoginForm';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockSubmit = vi.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });
});
```

### Testing Hooks

```typescript
// tests/unit/shared/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from '@shared/hooks/useAuth';

describe('useAuth', () => {
  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toBeDefined();
  });
});
```

### Testing Services

```typescript
// tests/unit/_core/ai/llm/unified-llm-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { unifiedLLMService } from '@_core/ai/llm/unified-llm-service';

// Mock the service
vi.mock('@_core/ai/llm/unified-llm-service');

describe('unifiedLLMService', () => {
  it('should send message', async () => {
    const mockResponse = { content: 'Hello' };
    vi.mocked(unifiedLLMService.sendMessage).mockResolvedValue(mockResponse);

    const result = await unifiedLLMService.sendMessage({
      provider: 'openai',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(result.content).toBe('Hello');
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// tests/integration/api/auth.test.ts
import { describe, it, expect } from 'vitest';
import { authService } from '@_core/auth/auth-service';

describe('Auth API Integration', () => {
  it('should authenticate user', async () => {
    const result = await authService.signIn('test@example.com', 'password');
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();
  });
});
```

### Database Integration Tests

```typescript
// tests/integration/database/user.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '@shared/lib/supabase-client';

describe('User Database Operations', () => {
  it('should create user profile', async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({ name: 'Test User', email: 'test@example.com' });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

## E2E Testing

### Framework: Playwright

**Configuration:** `playwright.config.ts`

### Writing E2E Tests

```typescript
// tests/e2e/playwright/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### Mission Control E2E Test

```typescript
// tests/e2e/playwright/mission-control.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mission Control', () => {
  test('should execute AI mission', async ({ page }) => {
    await page.goto('/mission-control');

    // Submit mission
    await page.fill(
      '[data-testid="mission-input"]',
      'Create a React component'
    );
    await page.click('[data-testid="submit-mission"]');

    // Wait for mission to start
    await expect(page.locator('[data-testid="mission-status"]')).toContainText(
      'Executing'
    );

    // Wait for completion
    await expect(page.locator('[data-testid="mission-status"]')).toContainText(
      'Completed'
    );
  });
});
```

## Test Data Management

### Mock Data

```typescript
// tests/fixtures/user-data.ts
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockEmployees = [
  {
    id: 'emp-1',
    name: 'Code Reviewer',
    role: 'Code Review Specialist',
  },
];
```

### Test Database Setup

```typescript
// tests/setup/test-db.ts
import { supabase } from '@shared/lib/supabase-client';

export const setupTestDatabase = async () => {
  // Create test user
  await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'password',
  });

  // Seed test data
  await supabase.from('user_profiles').insert({
    name: 'Test User',
    email: 'test@example.com',
  });
};
```

## Test Utilities

### Custom Render Function

```typescript
// tests/utils/test-utils.tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@shared/components/theme/theme-provider';

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </BrowserRouter>
  );
};
```

### Mock Functions

```typescript
// tests/mocks/llm-service.ts
export const mockLLMService = {
  sendMessage: vi.fn(),
  streamMessage: vi.fn(),
  getAvailableModels: vi.fn(),
};
```

## Coverage Requirements

### Minimum Coverage

- **Unit Tests:** 80% line coverage
- **Integration Tests:** 60% API coverage
- **E2E Tests:** 100% critical user flows

### Coverage Reports

```bash
npm run test:coverage
```

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run e2e
```

## Debugging Tests

### Unit Test Debugging

```bash
# Run specific test file
npm run test tests/unit/shared/utils/formatDate.test.ts

# Run with debug output
npm run test -- --reporter=verbose
```

### E2E Test Debugging

```bash
# Run with UI
npm run e2e:ui

# Run in headed mode
npm run e2e -- --headed
```

## Best Practices

### Test Organization

- Group related tests with `describe`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent

### Performance

- Use `vi.hoisted()` for expensive setup
- Mock external dependencies
- Clean up after tests
- Use `beforeEach` and `afterEach` appropriately

### Maintainability

- Write tests that are easy to understand
- Use helper functions for common patterns
- Keep test data in fixtures
- Update tests when code changes
