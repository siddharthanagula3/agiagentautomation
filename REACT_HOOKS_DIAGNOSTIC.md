# React Hooks Diagnostic Checklist

This checklist will help you identify and prevent infinite loop issues in React applications.

## Quick Diagnostic Commands

### 1. Find all useEffect hooks with array dependencies
```bash
# Search for useEffect with dependencies
grep -r "useEffect" src/ | grep "\], \[" | wc -l
```

### 2. Check for potential infinite loops
```bash
# Find useEffect hooks that might cause issues
grep -r "useEffect.*setState\|setMessages\|setData" src/
```

### 3. Find useCallback with many dependencies
```bash
# Find callbacks with 3+ dependencies
grep -r "useCallback" src/ | grep -E "\[.*,.*,.*\]"
```

## Manual Inspection Checklist

### ✅ useEffect Hooks
For each `useEffect` in your codebase, verify:

- [ ] Dependencies array is not missing (avoid infinite loops)
- [ ] Does not depend on objects/arrays that change every render
- [ ] State updates inside useEffect don't trigger the same effect again
- [ ] Expensive operations are debounced or memoized
- [ ] Has proper cleanup functions for timers/subscriptions

### ✅ useCallback Hooks
For each `useCallback` in your codebase, verify:

- [ ] Dependencies are minimal and necessary
- [ ] Async callbacks capture values at function start
- [ ] Does not create circular dependency chains
- [ ] State setters use functional updates when possible

### ✅ useState Hooks
For each `useState` in your codebase, verify:

- [ ] Initial state is not computed on every render
- [ ] State updates don't cause cascading re-renders
- [ ] Complex state is split into smaller pieces when appropriate
- [ ] Uses refs for values that don't need to trigger re-renders

## Common Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: useEffect with Object Dependency
```typescript
useEffect(() => {
  doSomething(config);
}, [config]); // config is an object that changes every render
```

**Fix:**
```typescript
useEffect(() => {
  doSomething(config);
}, [config.key1, config.key2]); // Depend on specific values
```

### ❌ Anti-Pattern 2: setState in useEffect Without Guard
```typescript
useEffect(() => {
  setState(value); // Always runs, causes infinite loop
}, [value]);
```

**Fix:**
```typescript
const prevValueRef = useRef();
useEffect(() => {
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    setState(value);
  }
}, [value]);
```

### ❌ Anti-Pattern 3: useCallback with Unstable Dependencies
```typescript
const handleClick = useCallback(() => {
  doSomething(data.items);
}, [data]); // data object changes every render
```

**Fix:**
```typescript
const handleClick = useCallback(() => {
  doSomething(data.items);
}, [data.items]);
```

### ❌ Anti-Pattern 4: Cascading State Updates
```typescript
useEffect(() => {
  setStateA(valueA);
}, [valueA]);

useEffect(() => {
  setStateB(stateA);
}, [stateA]); // Cascading updates
```

**Fix:**
```typescript
useEffect(() => {
  setStateA(valueA);
  setStateB(computeB(valueA));
}, [valueA]);
```

## Files to Check in Your Project

Based on your project structure, focus on:

### High Priority
- [x] `src/components/chat/MultiTabChatInterface.tsx` - **FIXED**
- [ ] `src/pages/chat/ChatPage.tsx`
- [ ] `src/pages/chat/ChatPageEnhanced.tsx`
- [ ] `src/hooks/useChat.ts`

### Medium Priority
- [ ] `src/hooks/useAccessibility.ts`
- [ ] `src/components/auth/ProtectedRoute.tsx`
- [ ] Any component using `useQuery` from react-query

### Low Priority (but still check)
- [ ] Dashboard pages with data loading
- [ ] Pages with real-time updates
- [ ] Components with complex state management

## Testing Strategy

### 1. Smoke Test
```typescript
// Add this to your components temporarily
useEffect(() => {
  console.log('Component rendered', { timestamp: Date.now() });
});
```

If you see rapid console logs, you have a re-render issue.

### 2. React DevTools Profiler
1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with your app
5. Stop recording
6. Look for components that render excessively

### 3. Performance Monitor
```typescript
// Add to problematic components
useEffect(() => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    if (end - start < 100) {
      console.warn('Component re-rendering too fast!');
    }
  };
});
```

## Automated Testing

### Create a Custom ESLint Rule
Add to your `.eslintrc.js`:

```javascript
rules: {
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/rules-of-hooks': 'error',
}
```

### Use React Hooks Testing Library
```bash
npm install --save-dev @testing-library/react-hooks
```

Example test:
```typescript
import { renderHook } from '@testing-library/react-hooks';

test('should not cause infinite renders', () => {
  const { result, rerender } = renderHook(() => useYourHook());
  
  const renderCount = result.all.length;
  rerender();
  
  expect(result.all.length - renderCount).toBeLessThan(3);
});
```

## Monitoring in Production

### Add Error Boundary
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    if (error.message.includes('Maximum call stack')) {
      // Log to your monitoring service
      console.error('Infinite loop detected!', errorInfo);
    }
  }
}
```

### Track Re-renders
```typescript
// In development mode
if (process.env.NODE_ENV === 'development') {
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    if (renderCount.current > 50) {
      console.error('Component rendered more than 50 times!');
    }
  });
}
```

## Quick Reference: React Hooks Best Practices

### useEffect
- ✅ Use for side effects
- ✅ Include all dependencies
- ✅ Return cleanup functions
- ❌ Don't use for data transformation
- ❌ Don't have missing dependencies

### useCallback
- ✅ Use for stable function references
- ✅ Pass to optimized child components
- ✅ Minimize dependencies
- ❌ Don't overuse (adds complexity)
- ❌ Don't use without memoization benefit

### useMemo
- ✅ Use for expensive computations
- ✅ Use for referential equality
- ✅ Use with object/array creation
- ❌ Don't use for simple values
- ❌ Don't use prematurely

### useRef
- ✅ Use for mutable values
- ✅ Use for DOM references
- ✅ Use for previous values
- ❌ Don't use for render-triggering state
- ❌ Don't use for simple state

## Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [React Hooks FAQ](https://react.dev/learn)
- [Kent C. Dodds - Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-hooks)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)

## Support

If issues persist after following this checklist:
1. Review the STACK_OVERFLOW_FIX.md document
2. Check browser console for specific error messages
3. Use React DevTools to trace the issue
4. Consider simplifying component state management
5. Look for circular dependencies in your module imports
