# Code Review - Potential Issues Report

**Date**: January 31, 2026
**Reviewer**: GitHub Copilot
**Project**: Gold Log Web Client

---

## 🔴 Critical Issues

### 1. TypeScript Configuration Conflicts (Type Errors in Production)

**Location**: Multiple files
**Severity**: HIGH - Breaks production build

**Problem**:
The `tsconfig.app.json` has incompatible flags:
- `erasableSyntaxOnly: true` - Prevents using enums
- `verbatimModuleSyntax: true` - Requires type-only imports

**Affected Files**:
```typescript
// src/types/transaction.types.ts (Line 1)
export enum TransactionType {  // ❌ Error: enums not allowed with erasableSyntaxOnly
  BUY = 'BUY',
  SELL = 'SELL',
}

// src/test/utils.tsx (Lines 1-2)
import { ReactElement } from 'react';  // ❌ Must use 'import type'
import { render, RenderOptions } from '@testing-library/react';  // ❌ Must use 'import type'
```

**Impact**:
- Production builds may fail
- Type checking errors in CI/CD
- IDE shows errors constantly

**Solution**:
```json
// tsconfig.app.json - Option 1: Remove incompatible flags
{
  "compilerOptions": {
    "erasableSyntaxOnly": false,  // Allow enums
    "verbatimModuleSyntax": false  // Allow mixed imports
  }
}

// OR Option 2: Convert enum to const + type
// src/types/transaction.types.ts
export const TransactionType = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
```

---

### 2. React Query v5 API Incompatibility

**Location**: `src/hooks/useTransactions.ts` (Line 29), `src/pages/TransactionsPage.tsx` (Line 25)
**Severity**: HIGH - Runtime errors

**Problem**:
Using React Query v4 API in React Query v5 project:

```typescript
// useTransactions.ts - Line 29
keepPreviousData: true,  // ❌ Deprecated in v5, use placeholderData instead

// TransactionsPage.tsx - Line 25
const { mutate, isLoading } = useDeleteTransaction();  // ❌ isLoading renamed to isPending
```

**Type Errors**:
```
Property 'isLoading' does not exist on type 'UseMutationResult<void, Error, string, unknown>'
Property 'data' does not exist on type '{}'
```

**Solution**:
```typescript
// useTransactions.ts
export function useTransactions(
  filters?: TransactionFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(filters, pagination),
    queryFn: () => transactionApi.getTransactions(filters, pagination),
    placeholderData: (previousData) => previousData, // ✅ v5 API
    staleTime: 30 * 1000,
  });
}

// TransactionsPage.tsx
const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction(); // ✅ isPending
```

---

### 3. Test Setup Missing Jest-DOM Matchers

**Location**: `src/test/App.test.tsx` (Line 8)
**Severity**: MEDIUM - Tests fail

**Problem**:
```typescript
expect(screen.getByText('Gold Log')).toBeInTheDocument();
// ❌ Error: Property 'toBeInTheDocument' does not exist on type 'Assertion<HTMLElement>'
```

**Cause**: Missing jest-dom setup in test files

**Solution**:
```typescript
// vitest.config.ts - Add setupFiles
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',  // ✅ Add this
  },
});

// src/test/setup.ts (NEW FILE)
import '@testing-library/jest-dom';
```

---

## 🟡 High Priority Issues

### 4. Unused Variables (ESLint Errors)

**Location**: Multiple files
**Severity**: MEDIUM - Code quality

**Problems**:
```typescript
// src/pages/DashboardPage.tsx (Line 7)
const user = useAuthStore((state) => state.user);  // ❌ Never used

// src/pages/TransactionsPage.tsx (Line 23)
const { page, pageSize, nextPage, prevPage, resetPage } = usePagination();  // ❌ resetPage unused

// src/utils/exportUtils.test.ts (Line 107)
const lines = csv.split('\n');  // ❌ Never used

// src/utils/filterUtils.test.ts (Line 10)
import type { TransactionFilters, DatePreset } from '@/types/filter.types';  // ❌ DatePreset unused
```

**Solution**:
```typescript
// Remove unused variables or prefix with underscore
const _user = useAuthStore((state) => state.user);
const { page, pageSize, nextPage, prevPage } = usePagination();

// Or use it
<p>Welcome, {user?.username}</p>
```

---

### 5. React Hooks Violation - setState in useEffect

**Location**: `src/components/features/transactions/filters/ProviderFilter.tsx` (Line 18)
**Severity**: MEDIUM - Performance issue

**Problem**:
```typescript
useEffect(() => {
  if (data?.data) {
    const uniqueProviders = Array.from(
      new Set(data.data.map((tx) => tx.provider).filter((p): p is string => !!p))
    ).sort();
    setProviders(uniqueProviders);  // ❌ setState in effect causes cascading renders
  }
}, [data]);
```

**Impact**:
- Unnecessary re-renders
- ESLint error: `react-hooks/set-state-in-effect`

**Solution**:
```typescript
// Use useMemo instead
const providers = useMemo(() => {
  if (!data?.data) return [];

  return Array.from(
    new Set(data.data.map((tx) => tx.provider).filter((p): p is string => !!p))
  ).sort();
}, [data?.data]);

// Remove useState and useEffect completely
```

---

### 6. Number Precision Loss in Validation Schema

**Location**: `src/schemas/transaction.schema.ts` (Lines 14, 21)
**Severity**: MEDIUM - Data integrity

**Problem**:
```typescript
.max(9999999999.999999, 'Quantity is too large'),    // ❌ Loses precision at runtime
.max(999999999999999.99, 'Price is too large'),      // ❌ Loses precision at runtime
```

**Explanation**:
JavaScript numbers are 64-bit floats with ~15-17 significant digits. These literals lose precision.

**Solution**:
```typescript
// Use safe integer limits or strings
export const transactionSchema = z.object({
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(1e10, 'Quantity is too large'),  // ✅ Scientific notation
  pricePerUnit: z
    .number()
    .positive('Price must be greater than 0')
    .max(1e15, 'Price is too large'),  // ✅ Scientific notation
});

// OR use refinement with string comparison
.refine(val => val <= 9999999999.999999, 'Too large')
```

---

### 7. useMemo Dependency Warning

**Location**: `src/pages/TransactionsPage.tsx` (Lines 28-30)
**Severity**: MEDIUM - May cause bugs

**Problem**:
```typescript
const sortedData = useMemo(() => {
  return data?.data ? sortTransactions(data.data, sortConfig) : [];
}, [data?.data, sortConfig]);  // ❌ React Compiler warning
```

**React Compiler Message**:
> Inferred dependencies did not match manually specified dependencies.
> Inferred: `data`, but source: `[data?.data, sortConfig]`

**Solution**:
```typescript
// Option 1: Use the inferred dependency
const sortedData = useMemo(() => {
  return data?.data ? sortTransactions(data.data, sortConfig) : [];
}, [data, sortConfig]);  // ✅ Use data instead of data?.data

// Option 2: Add proper null check
const sortedData = useMemo(() => {
  if (!data) return [];
  return sortTransactions(data.data, sortConfig);
}, [data, sortConfig]);
```

---

## 🟠 Medium Priority Issues

### 8. Extensive Use of `any` Type (36 Errors)

**Location**: Test files
**Severity**: MEDIUM - Type safety

**Problems**:
```typescript
// useDashboardSummary.test.tsx - 24 instances
pagination: {} as any,
} as any);

// exportUtils.test.ts - 7 instances
headers: {} as any,
pagination: {} as any,

// filterUtils.test.ts - 2 instances
const filters = params as any;
```

**Impact**:
- Bypasses type checking
- Potential runtime errors
- Hard to maintain

**Solution**:
```typescript
// Create proper mock types
const createMockPagination = (): PaginationMetadata => ({
  currentPage: 1,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
});

const createMockPagedResponse = <T,>(data: T[]): PagedResponse<T> => ({
  data,
  pagination: createMockPagination(),
});

// Use in tests
vi.mocked(useTransactions).mockReturnValue({
  data: createMockPagedResponse([]),  // ✅ Properly typed
  isLoading: false,
  error: null,
  // ... other required fields
});
```

---

### 9. Console Statements in Production Code

**Location**: Multiple files
**Severity**: LOW - Code cleanliness

**Found 6 instances**:
```typescript
// src/pages/OAuthCallbackPage.tsx
console.error('OAuth provider error:', errorParam);  // Line 19
console.error('Missing OAuth parameters');  // Line 28

// src/hooks/useTokenExpiration.ts
console.warn('No token expiration time found');  // Line 22
console.log('Token expired, logging out');  // Line 33

// src/hooks/useAuth.ts
console.error('OAuth callback error:', err);  // Line 85
console.error('Logout error:', err);  // Line 115
```

**Solution**:
```typescript
// Option 1: Remove console.log, keep console.error
// console.log('Token expired, logging out');  // ❌ Remove

// Option 2: Use proper error reporting service (recommended)
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.captureException(err);
} else {
  console.error('OAuth callback error:', err);
}

// Option 3: Create logger utility
const logger = {
  error: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  }
};
```

---

### 10. Missing Error Boundaries

**Location**: Application-wide
**Severity**: MEDIUM - User experience

**Problem**:
No error boundaries to catch React render errors. If any component throws, the entire app crashes.

**Solution**:
```typescript
// src/components/common/ErrorBoundary.tsx (NEW FILE)
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="mt-2 text-gray-600">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/App.tsx - Wrap application
<ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <Router>
      <Routes>...</Routes>
    </Router>
  </QueryClientProvider>
</ErrorBoundary>
```

---

## 🔵 Low Priority Issues

### 11. Hardcoded Alert() Dialogs

**Location**: Multiple files
**Severity**: LOW - UX

**Problems**:
```typescript
// TransactionsPage.tsx
alert('Transaction deleted successfully');
alert('Failed to delete transaction');

// TransactionForm.tsx
alert('This transaction already exists');
alert('Failed to create transaction');
```

**Recommendation**:
Use proper toast notification system (already planned but not implemented).

---

### 12. Potential Memory Leak in ProviderFilter

**Location**: `src/components/features/transactions/filters/ProviderFilter.tsx`
**Severity**: LOW - Performance

**Problem**:
Fetches ALL transactions (pageSize: 1000) just to get provider list. Could be expensive with many transactions.

**Solution**:
```typescript
// Backend should provide a dedicated endpoint
// GET /api/v1/transactions/providers
// Returns: { providers: string[] }

// Or add limit to query
const { data } = useTransactions(undefined, { page: 1, pageSize: 100 });
```

---

### 13. Missing Loading States

**Location**: `src/components/features/transactions/ProviderFilter.tsx`
**Severity**: LOW - UX

**Problem**:
No loading indicator while fetching providers list.

**Solution**:
```typescript
const { data, isLoading } = useTransactions(...);

if (isLoading) {
  return (
    <div>
      <label>Provider:</label>
      <select disabled>
        <option>Loading providers...</option>
      </select>
    </div>
  );
}
```

---

### 14. No Input Debouncing in Search

**Location**: Filter components
**Severity**: LOW - Performance

**Status**: Actually implemented correctly in `useFilters.ts` with 500ms debounce. ✅ Not an issue.

---

### 15. Missing Environment Variable Validation

**Location**: `src/config/env.ts`
**Severity**: LOW - Developer experience

**Problem**:
Generic error message when env vars missing:
```typescript
throw new Error('Missing required environment variables');  // ❌ Doesn't say which ones
```

**Solution**:
```typescript
function validateEnv(): Env {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const oauthRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  const missing: string[] = [];
  if (!apiBaseUrl) missing.push('VITE_API_BASE_URL');
  if (!oauthRedirectUri) missing.push('VITE_OAUTH_REDIRECT_URI');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}`  // ✅ Clear message
    );
  }

  return {
    API_BASE_URL: apiBaseUrl,
    OAUTH_REDIRECT_URI: oauthRedirectUri,
    ENVIRONMENT: environment as Env['ENVIRONMENT'],
  };
}
```

---

## 📊 Summary

### By Severity

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Must fix before production |
| 🟡 High | 4 | Should fix soon |
| 🟠 Medium | 3 | Fix when possible |
| 🔵 Low | 5 | Nice to have |
| **Total** | **15** | |

### By Category

| Category | Issues |
|----------|--------|
| TypeScript/Type Safety | 5 |
| React/React Query | 3 |
| Code Quality | 3 |
| Performance | 2 |
| Error Handling | 1 |
| UX/UI | 1 |

---

## 🎯 Recommended Action Plan

### Phase 1: Critical Fixes (1-2 hours)
1. ✅ Fix TypeScript configuration conflicts (Issue #1)
2. ✅ Update React Query v5 API usage (Issue #2)
3. ✅ Add jest-dom test setup (Issue #3)

### Phase 2: High Priority (2-3 hours)
4. ✅ Remove unused variables (Issue #4)
5. ✅ Fix ProviderFilter hook violation (Issue #5)
6. ✅ Fix number precision in schema (Issue #6)
7. ✅ Fix useMemo dependency warning (Issue #7)

### Phase 3: Medium Priority (3-4 hours)
8. ✅ Replace `any` types in tests with proper mocks (Issue #8)
9. ✅ Remove/refactor console statements (Issue #9)
10. ✅ Add Error Boundaries (Issue #10)

### Phase 4: Low Priority (Optional)
11. Replace alert() with toast notifications
12. Optimize provider filter query
13. Add loading states
14. Improve env validation messages

---

## 🚀 Next Steps

1. **Immediate**: Fix critical TypeScript and React Query issues
2. **Short-term**: Address ESLint errors and code quality
3. **Long-term**: Improve error handling and UX
4. **Future**: Consider implementing charts (plan-chart.md)

---

**Generated**: January 31, 2026
**Last Updated**: January 31, 2026
