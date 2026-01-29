# RLS Policy Testing Guide
## AGI Agent Automation Platform

**Purpose:** Comprehensive testing strategy for Row Level Security (RLS) policies
**Audience:** QA Engineers, Security Engineers, Backend Developers
**Date:** January 29, 2026

---

## Table of Contents
1. [Testing Framework Setup](#testing-framework-setup)
2. [Unit Test Patterns](#unit-test-patterns)
3. [Integration Tests](#integration-tests)
4. [Security Tests](#security-tests)
5. [Performance Tests](#performance-tests)
6. [Manual Testing Procedures](#manual-testing-procedures)
7. [CI/CD Integration](#cicd-integration)

---

## Testing Framework Setup

### Prerequisites
```bash
# Node.js/npm environment
node --version  # v18+
npm --version   # v9+

# Supabase local development
supabase --version  # v1.50+

# Install test dependencies
npm install --save-dev vitest @supabase/supabase-js
```

### Test File Structure
```
tests/
├── security/
│   ├── rls/
│   │   ├── automation_nodes.test.ts
│   │   ├── automation_connections.test.ts
│   │   ├── api_rate_limits.test.ts
│   │   ├── vibe_agent_actions.test.ts
│   │   ├── message_reactions.test.ts
│   │   ├── scheduled_tasks.test.ts
│   │   └── resource_downloads.test.ts
│   ├── helpers/
│   │   ├── test-users.ts
│   │   ├── rls-assertions.ts
│   │   └── fixtures.ts
│   └── rls.test.ts  (Integration)
```

---

## Unit Test Patterns

### Test User Setup Helper
```typescript
// tests/security/helpers/test-users.ts
import { createClient } from '@supabase/supabase-js';

interface TestUser {
  id: string;
  email: string;
  token: string;
  client: ReturnType<typeof createClient>;
}

export async function createTestUsers(): Promise<{
  userA: TestUser;
  userB: TestUser;
  serviceRole: TestUser;
}> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create test users
  const userAEmail = `test-a-${Date.now()}@example.com`;
  const userBEmail = `test-b-${Date.now()}@example.com`;

  const { data: authA } = await supabase.auth.admin.createUser({
    email: userAEmail,
    password: 'TestPassword123!',
    email_confirm: true,
  });

  const { data: authB } = await supabase.auth.admin.createUser({
    email: userBEmail,
    password: 'TestPassword123!',
    email_confirm: true,
  });

  // Create authenticated clients
  const clientA = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { data: sessionA } = await clientA.auth.signInWithPassword({
    email: userAEmail,
    password: 'TestPassword123!',
  });

  const clientB = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  const { data: sessionB } = await clientB.auth.signInWithPassword({
    email: userBEmail,
    password: 'TestPassword123!',
  });

  const serviceRole = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return {
    userA: {
      id: authA!.user!.id,
      email: userAEmail,
      token: sessionA!.session!.access_token,
      client: clientA,
    },
    userB: {
      id: authB!.user!.id,
      email: userBEmail,
      token: sessionB!.session!.access_token,
      client: clientB,
    },
    serviceRole: {
      id: 'service_role',
      email: 'service@example.com',
      token: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      client: serviceRole,
    },
  };
}

export async function deleteTestUsers(userIds: string[]) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const userId of userIds) {
    await supabase.auth.admin.deleteUser(userId);
  }
}
```

### RLS Assertion Helpers
```typescript
// tests/security/helpers/rls-assertions.ts
import { PostgrestError } from '@supabase/supabase-js';

export function expectRLSBlocked(
  error: PostgrestError | null,
  operationType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
) {
  expect(error).toBeDefined();
  expect(error?.code).toBe('PGRST116'); // Default RLS error code
  expect(error?.message).toContain('permission denied');
}

export function expectDataEmpty(data: any[], tableName: string) {
  expect(data).toBeDefined();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBe(0);
}

export async function assertUserCannotAccessOtherUserData(
  userBClient: any,
  userAId: string,
  tableName: string,
  filterField: string = 'user_id'
) {
  const { data, error } = await userBClient
    .from(tableName)
    .select()
    .eq(filterField, userAId);

  expectDataEmpty(data, tableName);
}

export async function assertUserCanAccessOwnData(
  userClient: any,
  userId: string,
  tableName: string,
  filterField: string = 'user_id'
) {
  const { data, error } = await userClient
    .from(tableName)
    .select()
    .eq(filterField, userId);

  expect(error).toBeNull();
  expect(data?.length).toBeGreaterThan(0);
}
```

### Example: automation_nodes RLS Test
```typescript
// tests/security/rls/automation_nodes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestUsers,
  deleteTestUsers,
} from '../helpers/test-users';
import {
  expectRLSBlocked,
  expectDataEmpty,
} from '../helpers/rls-assertions';

describe('automation_nodes RLS Security', () => {
  let users: any;

  beforeAll(async () => {
    users = await createTestUsers();
  });

  afterAll(async () => {
    await deleteTestUsers([users.userA.id, users.userB.id]);
  });

  describe('SELECT Policy', () => {
    it('users should not see nodes from other users workflows', async () => {
      // User A creates workflow
      const { data: workflowA } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'User A Workflow',
          description: 'Workflow for User A',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
        })
        .select()
        .single();

      // User A creates nodes in workflow
      const { data: nodeA } = await users.userA.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflowA.id,
          node_id: 'node-1',
          node_type: 'trigger',
          node_config: { type: 'manual_trigger' },
        })
        .select()
        .single();

      // User B tries to access User A's nodes
      const { data, error } = await users.userB.client
        .from('automation_nodes')
        .select()
        .eq('workflow_id', workflowA.id);

      expectDataEmpty(data, 'automation_nodes');
      expect(error).toBeNull(); // RLS silently filters, doesn't error
    });

    it('users can see their own workflow nodes', async () => {
      // Create workflow
      const { data: workflow } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'User A Workflow 2',
          description: 'Test',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
        })
        .select()
        .single();

      // Create node
      const { data: node } = await users.userA.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflow.id,
          node_id: 'node-2',
          node_type: 'action',
          node_config: {},
        })
        .select()
        .single();

      // User A can see their own nodes
      const { data, error } = await users.userA.client
        .from('automation_nodes')
        .select()
        .eq('workflow_id', workflow.id);

      expect(error).toBeNull();
      expect(data?.length).toEqual(1);
      expect(data?.[0].id).toBe(node.id);
    });
  });

  describe('INSERT Policy', () => {
    it('users cannot create nodes in other users workflows', async () => {
      // User A creates workflow
      const { data: workflowA } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'Protected Workflow',
          description: 'Test',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
        })
        .select()
        .single();

      // User B tries to create node in User A's workflow
      const { error } = await users.userB.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflowA.id,
          node_id: 'malicious-node',
          node_type: 'action',
          node_config: {},
        });

      expectRLSBlocked(error, 'INSERT');
    });
  });

  describe('UPDATE Policy', () => {
    it('users cannot modify other users workflow nodes', async () => {
      // User A creates workflow and node
      const { data: workflow } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'Update Test Workflow',
          description: 'Test',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
        })
        .select()
        .single();

      const { data: node } = await users.userA.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflow.id,
          node_id: 'node-update-test',
          node_type: 'action',
          node_config: { version: 1 },
        })
        .select()
        .single();

      // User B tries to update User A's node
      const { error } = await users.userB.client
        .from('automation_nodes')
        .update({
          node_config: { version: 2, hacked: true },
        })
        .eq('id', node.id);

      expectRLSBlocked(error, 'UPDATE');
    });
  });

  describe('DELETE Policy', () => {
    it('users cannot delete other users workflow nodes', async () => {
      // User A creates workflow and node
      const { data: workflow } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'Delete Test Workflow',
          description: 'Test',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
        })
        .select()
        .single();

      const { data: node } = await users.userA.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflow.id,
          node_id: 'node-delete-test',
          node_type: 'action',
          node_config: {},
        })
        .select()
        .single();

      // User B tries to delete User A's node
      const { error } = await users.userB.client
        .from('automation_nodes')
        .delete()
        .eq('id', node.id);

      expectRLSBlocked(error, 'DELETE');
    });

    it('service role can delete any nodes', async () => {
      // User A creates workflow and node
      const { data: workflow } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'Service Role Delete Test',
          description: 'Test',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
        })
        .select()
        .single();

      const { data: node } = await users.userA.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflow.id,
          node_id: 'node-service-delete',
          node_type: 'action',
          node_config: {},
        })
        .select()
        .single();

      // Service role can delete the node
      const { error } = await users.serviceRole.client
        .from('automation_nodes')
        .delete()
        .eq('id', node.id);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await users.serviceRole.client
        .from('automation_nodes')
        .select()
        .eq('id', node.id);

      expect(data?.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle NULL user_id gracefully', async () => {
      // Try accessing with invalid user context
      const { data, error } = await users.userA.client
        .from('automation_nodes')
        .select()
        .is('workflow_id', null);

      expect(error).toBeNull(); // Should not error, just no results
      expect(data?.length).toBe(0);
    });

    it('should work with archived workflows', async () => {
      const { data: workflow } = await users.userA.client
        .from('automation_workflows')
        .insert({
          user_id: users.userA.id,
          name: 'Archived Workflow',
          description: 'Test',
          category: 'test',
          trigger_type: 'manual',
          workflow_config: {},
          is_active: false,
        })
        .select()
        .single();

      const { data: node } = await users.userA.client
        .from('automation_nodes')
        .insert({
          workflow_id: workflow.id,
          node_id: 'archived-node',
          node_type: 'action',
          node_config: {},
        })
        .select()
        .single();

      const { data } = await users.userA.client
        .from('automation_nodes')
        .select()
        .eq('workflow_id', workflow.id);

      expect(data?.length).toBe(1);
    });
  });
});
```

---

## Integration Tests

### Cross-Table RLS Test
```typescript
// tests/security/rls/cross-table-access.test.ts
describe('Cross-Table RLS Integration', () => {
  it('users cannot access automation_connections if they cannot access the workflow', async () => {
    // User A creates workflow
    const { data: workflow } = await users.userA.client
      .from('automation_workflows')
      .insert({
        user_id: users.userA.id,
        name: 'Connection Test',
        description: 'Test',
        category: 'test',
        trigger_type: 'manual',
        workflow_config: {},
      })
      .select()
      .single();

    // User A creates nodes
    const { data: node1 } = await users.userA.client
      .from('automation_nodes')
      .insert({
        workflow_id: workflow.id,
        node_id: 'node-1',
        node_type: 'trigger',
        node_config: {},
      })
      .select()
      .single();

    const { data: node2 } = await users.userA.client
      .from('automation_nodes')
      .insert({
        workflow_id: workflow.id,
        node_id: 'node-2',
        node_type: 'action',
        node_config: {},
      })
      .select()
      .single();

    // User A creates connection
    const { data: connection } = await users.userA.client
      .from('automation_connections')
      .insert({
        workflow_id: workflow.id,
        source_node_id: node1.node_id,
        target_node_id: node2.node_id,
        connection_type: 'flow',
      })
      .select()
      .single();

    // User B cannot see the connection
    const { data } = await users.userB.client
      .from('automation_connections')
      .select()
      .eq('workflow_id', workflow.id);

    expectDataEmpty(data, 'automation_connections');
  });
});
```

---

## Security Tests

### Policy Bypass Attempts
```typescript
// tests/security/rls/policy-bypass.test.ts
describe('RLS Policy Bypass Protection', () => {
  it('should prevent direct UPDATE with OR conditions', async () => {
    // Create data for both users
    const { data: workflowA } = await users.userA.client
      .from('automation_workflows')
      .insert({
        user_id: users.userA.id,
        name: 'Bypass Test A',
        description: 'Test',
        category: 'test',
        trigger_type: 'manual',
        workflow_config: {},
      })
      .select()
      .single();

    // User B tries to update with OR bypass
    // (This should NOT work due to RLS checking both USING and WITH CHECK)
    const { error } = await users.userB.client
      .from('automation_workflows')
      .update({ name: 'Hacked' })
      .or(`id.eq.${workflowA.id},user_id.eq.${users.userB.id}`);

    expectRLSBlocked(error, 'UPDATE');
  });

  it('should prevent column-level privilege escalation', async () => {
    // Users cannot UPDATE their user_id to someone else's
    const { data: workflow } = await users.userA.client
      .from('automation_workflows')
      .insert({
        user_id: users.userA.id,
        name: 'Privilege Escalation Test',
        description: 'Test',
        category: 'test',
        trigger_type: 'manual',
        workflow_config: {},
      })
      .select()
      .single();

    // Try to change ownership
    const { error } = await users.userA.client
      .from('automation_workflows')
      .update({ user_id: users.userB.id })
      .eq('id', workflow.id);

    // This should either error or silently fail depending on WITH CHECK
    expect(error).toBeDefined();
  });
});
```

---

## Performance Tests

### RLS Query Performance
```typescript
// tests/performance/rls-performance.test.ts
import { performance } from 'perf_hooks';

describe('RLS Performance', () => {
  it('RLS queries should complete within acceptable time', async () => {
    const startTime = performance.now();

    const { data } = await users.userA.client
      .from('automation_workflows')
      .select()
      .limit(100);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(1000); // Should complete in < 1 second
  });

  it('Bulk operations with RLS should not exceed timeout', async () => {
    const startTime = performance.now();

    // Insert 50 workflows
    const workflows = [];
    for (let i = 0; i < 50; i++) {
      workflows.push({
        user_id: users.userA.id,
        name: `Perf Test ${i}`,
        description: 'Test',
        category: 'test',
        trigger_type: 'manual',
        workflow_config: {},
      });
    }

    await users.userA.client
      .from('automation_workflows')
      .insert(workflows);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
  });
});
```

---

## Manual Testing Procedures

### Test Scenario 1: Workflow Isolation
**Objective:** Verify users cannot access other users' workflows

**Steps:**
1. Login as User A
2. Create workflow "Secret Workflow"
3. Add nodes and connections
4. Logout
5. Login as User B
6. Attempt to access User A's workflows
7. Verify User B cannot see "Secret Workflow"
8. Verify User B cannot modify it
9. Logout and login as Admin
10. Verify Admin/Service Role can see all workflows

**Expected Results:**
- User B sees empty workflow list
- No errors when querying (RLS silently filters)
- Admin sees all workflows

---

### Test Scenario 2: API Rate Limit Isolation
**Objective:** Verify rate limit data is not visible across users

**Steps:**
1. Generate API calls as User A
2. Check User A's rate limit records
3. Generate API calls as User B
4. Verify User B cannot see User A's records
5. Verify each user only sees their own rate limits

---

### Test Scenario 3: Agent Action Logging
**Objective:** Verify agent actions are session-isolated

**Steps:**
1. Create two VIBE sessions (User A and User B)
2. User A logs an agent action in their session
3. Attempt to access as User B
4. Verify User B cannot see User A's agent actions
5. Verify attempts to log actions in User B's session require proper session ownership

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/rls-tests.yml
name: RLS Security Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'supabase/migrations/**'
      - 'tests/security/rls/**'
  pull_request:
    branches: [main, develop]

jobs:
  rls-tests:
    runs-on: ubuntu-latest

    services:
      supabase:
        image: supabase/supabase:latest
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd="pg_isready -U postgres"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Start Supabase
        run: |
          supabase start
          supabase db reset

      - name: Run RLS Tests
        env:
          VITE_SUPABASE_URL: http://localhost:54321
          VITE_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
          SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
        run: npm run test:rls

      - name: Generate Coverage Report
        run: npm run test:rls:coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: rls-tests

      - name: Check RLS Policy Count
        run: |
          POLICY_COUNT=$(npm run test:rls:count)
          if [ $POLICY_COUNT -lt 50 ]; then
            echo "ERROR: RLS policy count below threshold"
            exit 1
          fi

      - name: Stop Supabase
        if: always()
        run: supabase stop
```

### Test Scripts for package.json
```json
{
  "scripts": {
    "test:rls": "vitest run tests/security/rls --coverage",
    "test:rls:coverage": "vitest run tests/security/rls --coverage --reporter=json",
    "test:rls:count": "supabase db execute \"SELECT COUNT(*) FROM pg_policies WHERE schemaname='public'\"",
    "test:rls:watch": "vitest watch tests/security/rls",
    "test:security": "vitest run tests/security",
    "test:all": "vitest run"
  }
}
```

---

## Test Results Reporting

### Success Criteria
- [ ] All unit tests pass (100% coverage on RLS policies)
- [ ] Integration tests pass
- [ ] Performance tests show < 5% RLS overhead
- [ ] Security bypass tests fail (as expected)
- [ ] No cross-user data leakage detected
- [ ] All CRUD operations properly isolated

### Failed Test Response
1. **Identify** which policy failed
2. **Reproduce** the issue in isolation
3. **Analyze** the RLS condition logic
4. **Fix** the policy and test again
5. **Document** the issue and fix in PR

---

## Conclusion

Comprehensive RLS testing ensures:
- ✓ No information disclosure between users
- ✓ Service role can perform admin functions
- ✓ Performance is not degraded
- ✓ Edge cases are handled
- ✓ Future changes don't bypass security

**Run tests before every deployment.**

---

**Generated:** 2026-01-29
**Tested By:** Security Engineering Team
