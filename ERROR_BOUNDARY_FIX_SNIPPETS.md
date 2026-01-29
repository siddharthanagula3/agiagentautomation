# Error Boundary Implementation Snippets
## Quick Reference for Code Fixes

This document provides copy-paste snippets for implementing ErrorBoundary fixes across all identified pages.

---

## Generic ErrorBoundary Wrapper Pattern

Use this pattern for ANY page:

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { AlertTriangle } from 'lucide-react';

// Step 1: Rename your existing component export
const YourPageContent: React.FC = () => {
  // All your existing page code goes here unchanged
};

// Step 2: Create wrapper component with ErrorBoundary
const YourPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="YourPageName"  // Use actual page name here
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Page Error</CardTitle>
              <CardDescription>
                Something went wrong loading this page. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      showReportDialog={true}
    >
      <YourPageContent />
    </ErrorBoundary>
  );
};

export default YourPage;
```

---

## Authentication Pages

### Login.tsx

**Location:** `src/features/auth/pages/Login.tsx`

**Replace entire file content with:**

```typescript
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card';
import { useAuthStore } from '@shared/stores/authentication-store';
import {
  Bot,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Particles } from '@shared/ui/particles';
import { Spotlight } from '@shared/ui/spotlight';
import { checkRateLimit, resetRateLimit } from '@core/auth/rate-limiter';
import { toast } from 'sonner';

type LocationState = {
  from?: {
    pathname: string;
  };
};

// Step 1: Existing LoginPage content extracted to LoginPageContent
const LoginPageContent: React.FC = () => {
  const { login, isLoading, error, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation<LocationState>();

  // Check if demo mode is explicitly enabled via environment variable
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // **KEY FIX: Add redirect logic after successful authentication**
  useEffect(() => {
    console.log('LoginPage: Auth state changed:', {
      isAuthenticated,
      user: user?.email,
    });

    if (isAuthenticated && user) {
      console.log('✅ LoginPage: User authenticated, redirecting to dashboard');

      // Get the intended destination from location state, or default to dashboard
      const from = location.state?.from?.pathname || '/dashboard';

      // Small delay to ensure auth state is fully settled
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('LoginPage: Attempting login...');

    // SECURITY: Check rate limit before attempting login
    const rateLimitResult = await checkRateLimit('LOGIN', formData.email);
    if (!rateLimitResult.allowed) {
      const message = `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`;
      console.warn('LoginPage: Rate limit exceeded:', message);
      toast.error(message, {
        icon: <Shield className="h-4 w-4" />,
        duration: 5000,
      });
      return;
    }

    try {
      await login({ email: formData.email, password: formData.password });
      console.log('LoginPage: Login function completed');

      // SECURITY: Reset rate limit on successful login
      resetRateLimit('LOGIN', formData.email);
    } catch (err) {
      console.error('LoginPage: Login failed:', err);
      // Rate limit counter incremented automatically
      const remaining = rateLimitResult.remaining - 1;
      if (remaining <= 2 && remaining > 0) {
        toast.warning(
          `Login failed. ${remaining} attempts remaining before temporary lockout.`
        );
      }
    }
  };

  const handleDemoLogin = async () => {
    // Only allow demo login if explicitly enabled via environment variable
    if (!isDemoMode) {
      console.warn(
        'LoginPage: Demo login attempted but VITE_DEMO_MODE is not enabled'
      );
      return;
    }

    console.log('LoginPage: Demo login triggered');
    const demoEmail = import.meta.env.VITE_DEMO_EMAIL || 'demo@example.com';
    const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'demo123';

    setFormData({
      email: demoEmail,
      password: demoPassword,
    });

    // Trigger login immediately with demo credentials
    try {
      await login({ email: demoEmail, password: demoPassword });
    } catch (err) {
      console.error('LoginPage: Demo login failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Don't render login form if user is already authenticated
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-purple-500/5 p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Enhanced background */}
      <Particles className="absolute inset-0" quantity={60} />
      <Spotlight className="absolute inset-0" />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-6 text-center">
            <motion.div
              className="mb-4 flex justify-center"
              whileHover={{ scale: 1.1 }}
            >
              <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-3">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </motion.div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your AI Workforce account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error display */}
            {error && (
              <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-white"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Demo login (if enabled) */}
              {isDemoMode && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                >
                  Try Demo
                </Button>
              )}
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Sign up link */}
            <Link to="/register">
              <Button variant="outline" className="w-full">
                Create an account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

// Step 2: Wrap with ErrorBoundary
const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="LoginPage"
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Login Error</CardTitle>
              <CardDescription>
                Unable to load the login page. Please try refreshing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/')}
              >
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      showReportDialog={true}
    >
      <LoginPageContent />
    </ErrorBoundary>
  );
};

export default LoginPage;
```

### Register.tsx

**Location:** `src/features/auth/pages/Register.tsx`

**Changes:** Wrap existing component like Login.tsx above.

```typescript
import ErrorBoundary from '@shared/components/ErrorBoundary';

// Rename existing export to RegisterPageContent
const RegisterPageContent: React.FC = () => {
  // ... existing Register code ...
};

// Add wrapper with ErrorBoundary
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="RegisterPage"
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Registration Error</CardTitle>
              <CardDescription>
                Unable to load the registration page. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      showReportDialog={true}
    >
      <RegisterPageContent />
    </ErrorBoundary>
  );
};

export default RegisterPage;
```

### ForgotPassword.tsx & ResetPassword.tsx

Same pattern as above - extract content to `*PageContent`, wrap with ErrorBoundary.

---

## Settings Pages

### UserSettings.tsx

**Location:** `src/features/settings/pages/UserSettings.tsx`

**At top of file add imports:**
```typescript
import ErrorBoundary from '@shared/components/ErrorBoundary';
```

**Around line 74, rename export:**
```typescript
// OLD:
const SettingsPage: React.FC = () => {

// NEW:
const SettingsPageContent: React.FC = () => {
```

**At end of file, before export default, add:**
```typescript
// Wrap with ErrorBoundary
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="SettingsPage"
      fallback={
        <div className="flex h-screen items-center justify-center bg-background p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Settings Error</CardTitle>
              <CardDescription>
                Unable to load your settings. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload Settings
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      showReportDialog={true}
    >
      <SettingsPageContent />
    </ErrorBoundary>
  );
};

export default SettingsPage;
```

### AIConfiguration.tsx

Same pattern as UserSettings.tsx above.

---

## Commerce Pages

### Pricing.tsx

**Location:** `src/pages/Pricing.tsx`

**At top, add import:**
```typescript
import ErrorBoundary from '@shared/components/ErrorBoundary';
```

**Around line 118, modify:**
```typescript
// OLD:
const PricingPage: React.FC = () => {

// NEW:
const PricingPageContent: React.FC = () => {
```

**At end of file, before export default:**
```typescript
const PricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="PricingPage"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Pricing Loading Error</CardTitle>
              <CardDescription>
                We couldn't load our pricing information. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate('/contact-sales')}>
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      showReportDialog={true}
    >
      <PricingPageContent />
    </ErrorBoundary>
  );
};

export default PricingPage;
```

### PublicMarketplace.tsx

Same pattern as Pricing.tsx above.

---

## Dashboard Pages

### DashboardHome.tsx

**Location:** `src/pages/DashboardHome.tsx`

**At top, add import:**
```typescript
import ErrorBoundary from '@shared/components/ErrorBoundary';
```

**Around line 80, modify:**
```typescript
// OLD:
export const DashboardHomePage: React.FC<DashboardHomePageProps> = ({
  className,
}) => {

// NEW:
export const DashboardHomePageContent: React.FC<DashboardHomePageProps> = ({
  className,
}) => {
```

**Before final export, add:**
```typescript
export const DashboardHomePage: React.FC<DashboardHomePageProps> = (props) => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="DashboardHome"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Dashboard Error</CardTitle>
              <CardDescription>
                Unable to load your dashboard. Please try refreshing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Dashboard
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/chat')}
              >
                Go to Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      showReportDialog={true}
    >
      <DashboardHomePageContent {...props} />
    </ErrorBoundary>
  );
};
```

**Update export:**
```typescript
export default DashboardHomePage;
```

---

## Data & Feature Pages

### BlogList.tsx & BlogPost.tsx

```typescript
import ErrorBoundary from '@shared/components/ErrorBoundary';

// Rename existing component
const BlogListPageContent: React.FC = () => {
  // ... existing code ...
};

// Add wrapper
const BlogListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      componentName="BlogListPage"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Blog Loading Error</CardTitle>
              <CardDescription>
                Unable to load blog posts. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Reload Blog
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <BlogListPageContent />
    </ErrorBoundary>
  );
};

export default BlogListPage;
```

### ArtifactGallery.tsx

Same pattern as above.

---

## Static Pages (Minimal Protection)

For pages with NO async operations (Landing, About, Terms, Privacy, etc.):

```typescript
import ErrorBoundary from '@shared/components/ErrorBoundary';

const PageContent: React.FC = () => {
  // ... existing code ...
};

const Page: React.FC = () => {
  return (
    <ErrorBoundary
      componentName="PageName"
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      }
    >
      <PageContent />
    </ErrorBoundary>
  );
};

export default Page;
```

**Apply this pattern to:**
- pages/About.tsx
- pages/AIChatInterface.tsx
- pages/AIDashboards.tsx
- pages/ApiReference.tsx
- pages/AIProjectManager.tsx
- pages/Careers.tsx
- pages/ContactSales.tsx
- pages/Documentation.tsx
- pages/HelpCenter.tsx
- pages/Landing.tsx
- pages/NotFound.tsx
- pages/Resources.tsx
- pages/Security.tsx
- pages/SupportCenter.tsx
- pages/legal/* (all files)
- pages/use-cases/* (all files)

---

## Enhance Async Error Handling

### Pattern 1: Promise.allSettled for Independent Operations

**Use when:** Loading multiple independent data sources

```typescript
// ❌ OLD: Chain fails if any promise fails
Promise.all([
  fetchData1(),
  fetchData2(),
  fetchData3(),
]).then(([data1, data2, data3]) => {
  setData1(data1);
  setData2(data2);
  setData3(data3);
});

// ✅ NEW: Each can succeed/fail independently
Promise.allSettled([
  fetchData1(),
  fetchData2(),
  fetchData3(),
]).then((results) => {
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (index === 0) setData1(result.value);
      if (index === 1) setData2(result.value);
      if (index === 2) setData3(result.value);
    } else {
      console.error(`Failed to fetch data ${index + 1}:`, result.reason);
      toast.error(`Failed to load data ${index + 1}`);
    }
  });
});
```

### Pattern 2: Improved Async Operation Cleanup

```typescript
// ✅ GOOD: Proper cleanup and error handling
useEffect(() => {
  let isMounted = true;
  let timeoutId: NodeJS.Timeout;

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchData();

      // Check if component is still mounted before updating state
      if (!isMounted) return;

      setData(data);
      setError(null);
    } catch (err) {
      if (!isMounted) return;

      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');

      // Show toast notification to user
      toast.error('Failed to load data. Please try again.');
    } finally {
      if (!isMounted) return;
      setIsLoading(false);
    }
  };

  // Add timeout protection
  timeoutId = setTimeout(() => {
    if (isMounted) {
      setError('Request timed out. Please try again.');
      setIsLoading(false);
    }
  }, 10000);

  loadData();

  return () => {
    isMounted = false;
    clearTimeout(timeoutId);
  };
}, []);
```

---

## Verification Checklist

After implementing ErrorBoundary fixes, verify:

### Code Quality
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No lint issues: `npm run lint`
- [ ] Proper imports of ErrorBoundary
- [ ] Fallback UI has navigation options

### Functionality
- [ ] Page loads normally without errors
- [ ] Intentional errors trigger fallback UI
- [ ] "Try Again" / "Refresh" buttons work
- [ ] Sentry captures errors (check dashboard)
- [ ] User feedback dialog appears (if enabled)

### Error Recovery
- [ ] Can recover after clicking "Refresh"
- [ ] Can navigate back using "Go Back" button
- [ ] Can navigate to dashboard using fallback UI
- [ ] Loading state properly shown during recovery

### Testing Commands
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build to verify no errors
npm run build

# Run tests
npm run test:run

# E2E tests (optional)
npm run e2e
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: ErrorBoundary in Same Component as Error Source
```typescript
// WRONG - ErrorBoundary can't catch errors in the component rendering it
const Page = () => {
  return (
    <ErrorBoundary>
      {doSomethingThatThrows()}  // ErrorBoundary can't catch this
    </ErrorBoundary>
  );
};
```

### ✅ Correct Approach
```typescript
// RIGHT - Separate component containing error-prone code
const PageContent = () => {
  return doSomethingThatThrows();  // ErrorBoundary wraps this
};

const Page = () => {
  return (
    <ErrorBoundary>
      <PageContent />
    </ErrorBoundary>
  );
};
```

### ❌ Mistake 2: No try-catch in Event Handlers
```typescript
// WRONG - ErrorBoundary won't catch async errors
const handleClick = async () => {
  const data = await fetchData();  // Error not caught by ErrorBoundary
  setData(data);
};

// RIGHT - Add try-catch for async operations
const handleClick = async () => {
  try {
    const data = await fetchData();
    setData(data);
  } catch (err) {
    console.error('Failed:', err);
    toast.error('Operation failed');
  }
};
```

### ❌ Mistake 3: Generic Fallback Without Navigation
```typescript
// WRONG - User is stuck
const Page = () => (
  <ErrorBoundary fallback={<div>Error!</div>}>
    <PageContent />
  </ErrorBoundary>
);

// RIGHT - Provide recovery options
const Page = () => (
  <ErrorBoundary
    fallback={
      <div>
        <p>Error occurred</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
        <Button onClick={() => navigate('/')}>Home</Button>
      </div>
    }
  >
    <PageContent />
  </ErrorBoundary>
);
```

---

## Quick Reference Summary

| Page | File | Priority | Status |
|------|------|----------|--------|
| Login | `src/features/auth/pages/Login.tsx` | CRITICAL | Needs EB |
| Register | `src/features/auth/pages/Register.tsx` | CRITICAL | Needs EB |
| ForgotPassword | `src/features/auth/pages/ForgotPassword.tsx` | CRITICAL | Needs EB |
| ResetPassword | `src/features/auth/pages/ResetPassword.tsx` | CRITICAL | Needs EB |
| UserSettings | `src/features/settings/pages/UserSettings.tsx` | HIGH | Needs EB |
| AIConfiguration | `src/features/settings/pages/AIConfiguration.tsx` | HIGH | Needs EB |
| Pricing | `src/pages/Pricing.tsx` | HIGH | Needs EB |
| PublicMarketplace | `src/pages/PublicMarketplace.tsx` | HIGH | Needs EB |
| DashboardHome | `src/pages/DashboardHome.tsx` | MEDIUM | Needs EB |
| BlogList | `src/pages/BlogList.tsx` | MEDIUM | Needs EB |
| BlogPost | `src/pages/BlogPost.tsx` | MEDIUM | Needs EB |
| ArtifactGallery | `src/pages/ArtifactGallery.tsx` | MEDIUM | Needs EB |
| Chat | `src/features/chat/pages/ChatInterface.tsx` | N/A | ✅ Has EB |
| Billing | `src/features/billing/pages/BillingDashboard.tsx` | N/A | ✅ Has EB |
| Marketplace | `src/features/marketplace/pages/EmployeeMarketplace.tsx` | N/A | ✅ Has EB |
| Workforce | `src/features/workforce/pages/EmployeeManagement.tsx` | N/A | ✅ Has EB |
| MissionControl | `src/features/mission-control/pages/MissionControlDashboard.tsx` | N/A | ✅ Has EB |
| Vibe | `src/features/vibe/pages/VibeDashboard.tsx` | N/A | ✅ Has EB |

---

**Total Pages Needing Updates: 25**
**Estimated Implementation Time: 2-3 hours**
**Estimated Testing Time: 2-3 hours**

---

End of Quick Reference
