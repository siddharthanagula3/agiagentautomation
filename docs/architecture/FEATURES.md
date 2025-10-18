# Feature Modules

**Location:** `src/features/`

This directory contains all feature modules. Each module is self-contained with its own components, pages, services, and hooks.

## Architecture Rules

### ✅ Features CAN:

- Import from `@shared/*` (shared utilities)
- Import from `@_core/*` (infrastructure services)
- Import from their own module

### ❌ Features CANNOT:

- Import from other feature modules (breaks encapsulation)
- Be imported by `@_core/*` (prevents circular dependencies)

## Available Features

### 1. Authentication (`auth/`)

**Purpose:** User authentication, registration, password reset, route protection

**Files:**

- `components/LoginForm.tsx` - Login UI
- `components/RegisterForm.tsx` - Registration UI
- `components/ProtectedRoute.tsx` - **Route guard** (use this!)
- `components/AdminRoute.tsx` - Admin-only routes
- `pages/LoginPage.tsx` - Login page
- `pages/RegisterPage.tsx` - Registration page
- `pages/ForgotPasswordPage.tsx` - Password reset request
- `pages/ResetPasswordPage.tsx` - Password reset form

**Usage:**

```typescript
// Protect routes
import { ProtectedRoute } from '@features/auth/components/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardLayout />
  </ProtectedRoute>
} />
```

**State:** Uses `unified-auth-store.ts` from `@shared/stores`

### 2. Mission Control (`mission-control/`)

**Purpose:** AI Workforce Mission Control - Deploy and monitor AI employees in real-time

**Files (5 core components):**

- `components/MissionLog.tsx` - Real-time mission activity log
- `components/AgentStatusPanel.tsx` - Live agent status monitoring
- `components/ChatMessage.tsx`, `ChatInput.tsx`, `ChatMessageList.tsx` - Core UI
- `pages/MissionControlPage.tsx` - **Main command center**
- `pages/ChatPage.tsx` - Individual AI employee chat
- `services/background-chat-service.ts` - Background chat processing
- `services/supabase-chat.ts` - Chat persistence

**Usage:**

```typescript
// Mission Control interface
import { MissionLog } from '@features/mission-control/components/MissionLog';

<MissionLog />
```

**State:** Uses `company-hub-store.ts` and `chat-store.ts` from `@shared/stores`

### 3. Workforce (`workforce/`)

**Purpose:** AI employee management, marketplace integration

**Files:**

- `components/AIEmployeeCard.tsx` - Employee card UI
- `components/AIEmployeeChat.tsx` - Employee-specific chat
- `components/WorkforceTable.tsx` - Table view of workforce
- `pages/WorkforcePage.tsx` - **Main workforce page**
- `services/supabase-workforce-service.ts` - Workforce DB operations
- `hooks/useWorkforce.ts` - Workforce state hook

**Usage:**

```typescript
import { WorkforcePage } from '@features/workforce/pages/WorkforcePage';

// Workforce management
const { employees, hireEmployee, fireEmployee } = useWorkforce();
```

**State:** Uses `workforce-store.ts` from `@shared/stores`

### 4. Marketplace (`marketplace/`)

**Purpose:** Public marketplace for hiring AI employees

**Files:**

- `components/EmployeeCard.tsx` - Marketplace card
- `components/HireButton.tsx` - Hire action button
- `pages/MarketplacePage.tsx` - Main marketplace

**Usage:**

```typescript
// Browse and hire employees
const { availableEmployees, hireEmployee } = useMarketplace();
```

### 5. Billing (`billing/`)

**Purpose:** Stripe integration, subscription management, usage tracking

**Files:**

- `pages/BillingPage.tsx` - Billing dashboard
- `services/stripe-service.ts` - Stripe integration
- `services/usage-tracker.ts` - Token/usage tracking
- `components/SubscriptionCard.tsx` - Subscription status

**Usage:**

```typescript
import { stripeService } from '@features/billing/services/stripe-service';

await stripeService.createCheckoutSession('pro');
```

**Backend:** Netlify Functions in `netlify/functions/`

- `create-pro-subscription.ts`
- `stripe-webhook.ts`

### 6. Settings (`settings/`)

**Purpose:** User settings, AI configuration, preferences

**Files:**

- `pages/SettingsPage.tsx` - Main settings page
- `pages/AIConfigurationPage.tsx` - AI provider settings
- `components/ProfileSettings.tsx` - User profile
- `services/settings-service.ts` - Settings persistence

**Usage:**

```typescript
// Update user settings
const { updateSettings, settings } = useSettings();
```

## Adding New Features

1. **Create directory:** `src/features/my-feature/`
2. **Add structure:**
   ```
   my-feature/
   ├── components/
   ├── pages/
   ├── services/
   └── hooks/
   ```
3. **Export via index:** `src/features/my-feature/index.ts`
4. **Follow rules:** Only import from `@shared/*` and `@_core/*`

## Common Patterns

### Feature Hook

```typescript
// features/my-feature/hooks/useMyFeature.ts
export const useMyFeature = () => {
  const store = useMyFeatureStore();

  return {
    data: store.data,
    actions: store.actions,
  };
};
```

### Feature Service

```typescript
// features/my-feature/services/my-service.ts
import { supabase } from '@shared/lib/supabase-client';

export const myService = {
  async getData() {
    const { data, error } = await supabase.from('my_table').select('*');

    if (error) throw error;
    return data;
  },
};
```

### Feature Page

```typescript
// features/my-feature/pages/MyPage.tsx
import { useMyFeature } from '../hooks/useMyFeature';

export const MyPage = () => {
  const { data, actions } = useMyFeature();

  return <div>{/* UI */}</div>;
};
```

## Testing Features

Each feature should have:

- Unit tests for services: `tests/unit/features/my-feature/`
- E2E tests for pages: `tests/e2e/playwright/my-feature.spec.ts`
