# Contributing to Gold Log Client

Thank you for your interest in contributing to Gold Log! This guide will help you understand our development workflow, coding standards, and best practices.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Style Guide](#code-style-guide)
4. [TypeScript Guidelines](#typescript-guidelines)
5. [React Best Practices](#react-best-practices)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Testing Requirements](#testing-requirements)
9. [Commit Guidelines](#commit-guidelines)
10. [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

### Local Setup

```bash
# Clone the repository
git clone https://github.com/yourorg/gold-log-client.git
cd gold-log-client

# Install dependencies
npm install

# Set up environment variables
cp .env.development.example .env.development

# Start development server
npm run dev
```

### Project Structure

Familiarize yourself with the project structure:

```
src/
├── api/           # API client and endpoint definitions
├── components/    # React components (common, layout, features)
├── hooks/         # Custom React hooks
├── pages/         # Page components (routes)
├── stores/        # Zustand state stores
├── types/         # TypeScript type definitions
├── schemas/       # Zod validation schemas
├── utils/         # Utility functions
└── config/        # Configuration files
```

---

## Development Workflow

### 1. Branch Naming Convention

Follow this pattern: `<type>/<short-description>`

**Types:**

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions or fixes
- `chore/` - Maintenance tasks

**Examples:**

```bash
feature/transaction-filters
fix/oauth-redirect-loop
refactor/api-client-error-handling
docs/update-readme
test/transaction-form-validation
chore/update-dependencies
```

### 2. Development Process

1. Create a new branch from `main`
2. Make your changes following the code style guide
3. Write or update tests
4. Run linting and tests locally
5. Commit your changes with descriptive messages
6. Push to your branch and create a pull request

### 3. Before Committing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run tests
npm run test

# Run all checks
npm run validate
```

---

## Code Style Guide

### General Principles

1. **Clarity over Cleverness**: Write code that is easy to understand
2. **Consistency**: Follow existing patterns in the codebase
3. **Simplicity**: Keep functions and components small and focused
4. **DRY**: Don't Repeat Yourself - extract common logic
5. **KISS**: Keep It Simple, Stupid

### File Naming Conventions

- **Components**: PascalCase (e.g., `TransactionForm.tsx`, `Button.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `useTransactions.ts`)
- **Utils**: camelCase (e.g., `format.ts`, `validation.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `transaction.types.ts`)
- **Stores**: camelCase with `Store` suffix (e.g., `authStore.ts`)
- **Schemas**: camelCase with `.schema.ts` suffix (e.g., `transaction.schema.ts`)

### Code Formatting

We use **Prettier** for automatic formatting. Configuration:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### ESLint Rules

Key rules we enforce:

- No unused variables
- No console.log in production code (use `console.error` or remove)
- Prefer `const` over `let`
- Explicit return types for exported functions
- No `any` types (use `unknown` or proper types)

---

## TypeScript Guidelines

### 1. Strict Type Safety

**Always use strict mode** - no implicit `any`, no unchecked nulls.

```typescript
// ✅ Good: Explicit types
interface TransactionFormData {
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
}

function processTransaction(data: TransactionFormData): Transaction {
  return {
    ...data,
    totalAmount: data.quantity * data.pricePerUnit,
  };
}

// ❌ Bad: Implicit any
function processTransaction(data) {
  return data;
}
```

### 2. Use Type Aliases and Interfaces Appropriately

- **Interfaces** for object shapes and component props
- **Type aliases** for unions, intersections, and utility types

```typescript
// Interfaces for objects
interface User {
  id: string;
  email: string;
  username: string;
}

// Type aliases for unions
type TransactionType = 'BUY' | 'SELL';
type Status = 'idle' | 'loading' | 'success' | 'error';
```

### 3. Avoid `any` - Use `unknown` Instead

```typescript
// ✅ Good: Use unknown and type guards
function parseApiResponse(data: unknown): Transaction {
  if (isTransaction(data)) {
    return data;
  }
  throw new Error('Invalid transaction data');
}

function isTransaction(obj: unknown): obj is Transaction {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'type' in obj;
}

// ❌ Bad: Using any
function parseApiResponse(data: any) {
  return data as Transaction;
}
```

### 4. Use Enums for Constants

```typescript
// ✅ Good: Use enum
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

// Usage
const type = TransactionType.BUY;

// ❌ Bad: Magic strings
const type = 'BUY';
```

### 5. Generic Types for Reusability

```typescript
// ✅ Good: Generic types
interface PagedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Usage
type TransactionPage = PagedResponse<Transaction>;
type UserPage = PagedResponse<User>;
```

### 6. Type Transformers Between API and Domain

```typescript
// API types (snake_case - matches backend)
interface ApiTransaction {
  transaction_date: string;
  price_per_unit: number;
  user_id: string;
}

// Domain types (camelCase - used in frontend)
interface Transaction {
  transactionDate: string;
  pricePerUnit: number;
  userId: string;
}

// Transformer function
export function apiToTransaction(api: ApiTransaction): Transaction {
  return {
    transactionDate: api.transaction_date,
    pricePerUnit: api.price_per_unit,
    userId: api.user_id,
  };
}
```

---

## React Best Practices

### 1. Component Structure

**Functional components only** - no class components.

```typescript
// ✅ Good: Functional component with proper typing
interface TransactionListProps {
  transactions: Transaction[];
  onSelect?: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onSelect,
}) => {
  return (
    <div>
      {transactions.map((tx) => (
        <TransactionRow
          key={tx.id}
          transaction={tx}
          onClick={() => onSelect?.(tx.id)}
        />
      ))}
    </div>
  );
};

// ❌ Bad: Class component
class TransactionList extends React.Component {
  render() {
    return <div>...</div>;
  }
}
```

### 2. Component Naming

```typescript
// ✅ Good: Descriptive component names
export const TransactionForm: React.FC = () => { ... }
export const UserProfileCard: React.FC = () => { ... }

// ❌ Bad: Generic names
export const Form: React.FC = () => { ... }
export const Card: React.FC = () => { ... }
```

### 3. Props Destructuring

```typescript
// ✅ Good: Destructure props
export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onClick,
  isSelected = false,
}) => {
  return <div onClick={onClick}>{transaction.type}</div>;
};

// ❌ Bad: Using props object
export const TransactionRow: React.FC<TransactionRowProps> = (props) => {
  return <div onClick={props.onClick}>{props.transaction.type}</div>;
};
```

### 4. Conditional Rendering

```typescript
// ✅ Good: Early returns for loading/error states
export const TransactionList: React.FC = () => {
  const { data, isLoading, error } = useTransactions();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;

  return (
    <div>
      {data.map((tx) => (
        <TransactionRow key={tx.id} transaction={tx} />
      ))}
    </div>
  );
};

// ❌ Bad: Nested ternaries
export const TransactionList: React.FC = () => {
  const { data, isLoading, error } = useTransactions();

  return (
    <div>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage />
      ) : data?.length ? (
        data.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
```

### 5. Event Handlers

```typescript
// ✅ Good: Prefix with "handle"
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // ...
};

const handleQuantityChange = (value: number) => {
  setQuantity(value);
};

// ❌ Bad: Generic names
const submit = () => { ... }
const onChange = () => { ... }
```

### 6. Performance Optimization

Use `memo`, `useMemo`, and `useCallback` when appropriate:

```typescript
// ✅ Good: Memoize expensive components
export const TransactionList = memo<TransactionListProps>(({ transactions }) => {
  return <div>{/* ... */}</div>;
});

// ✅ Good: Memoize expensive calculations
const totalAmount = useMemo(() => {
  return transactions.reduce((sum, tx) => sum + tx.totalAmount, 0);
}, [transactions]);

// ✅ Good: Memoize callbacks passed to child components
const handleDelete = useCallback((id: string) => {
  deleteTransaction(id);
}, [deleteTransaction]);
```

**Warning:** Don't over-optimize. Only use memoization when:

- Component renders frequently with same props
- Calculation is computationally expensive
- Callback causes unnecessary re-renders in child components

### 7. Custom Hooks

Extract reusable logic into custom hooks:

```typescript
// ✅ Good: Custom hook for form logic
export function useTransactionForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');
  const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;

  return {
    register,
    handleSubmit,
    errors,
    totalAmount,
  };
}
```

---

## State Management

### 1. State Categories

Choose the right state management tool:

- **Local component state** (`useState`): UI state, form inputs, toggles
- **Server state** (React Query): API data, caching, background refetching
- **Global client state** (Zustand): Auth state, theme, UI preferences
- **URL state** (React Router): Filters, pagination, current route

### 2. React Query for Server State

```typescript
// ✅ Good: Use React Query for API data
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionApi.getTransactions(filters),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Usage in component
const { data, isLoading, error } = useTransactions({ type: 'BUY' });

// ❌ Bad: Manual state management for API data
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/transactions')
    .then((res) => res.json())
    .then((data) => setTransactions(data))
    .finally(() => setLoading(false));
}, []);
```

### 3. Zustand for Global Client State

```typescript
// ✅ Good: Use Zustand for global state
interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  clearAuth: () => set({ token: null, user: null }),
}));

// Usage
const { user, setAuth } = useAuthStore();
```

### 4. Avoid Prop Drilling

```typescript
// ✅ Good: Use context or global state for deeply nested data
const ThemeContext = createContext<Theme | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ❌ Bad: Prop drilling through many levels
<App theme={theme}>
  <Layout theme={theme}>
    <Content theme={theme}>
      <Button theme={theme} />
    </Content>
  </Layout>
</App>
```

---

## API Integration

### 1. API Naming Convention

- **API types**: `snake_case` (matches backend response)
- **Domain types**: `camelCase` (used throughout frontend)
- **Transform at the boundary**: Convert between conventions in API layer

```typescript
// api/types.ts - API layer (snake_case)
export interface ApiTransaction {
  user_id: string;
  price_per_unit: number;
  transaction_date: string;
}

// types/transaction.types.ts - Domain layer (camelCase)
export interface Transaction {
  userId: string;
  pricePerUnit: number;
  transactionDate: string;
}

// api/transformers.ts - Transformation
export function apiToTransaction(api: ApiTransaction): Transaction {
  return {
    userId: api.user_id,
    pricePerUnit: api.price_per_unit,
    transactionDate: api.transaction_date,
  };
}
```

### 2. Centralized API Client

```typescript
// ✅ Good: Centralized axios instance with interceptors
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

### 3. Type-safe API Endpoints

```typescript
// ✅ Good: Fully typed API functions
export const transactionApi = {
  async getTransactions(
    filters?: TransactionFilters,
    pagination?: PaginationParams
  ): Promise<PagedResponse<Transaction>> {
    const response = await apiClient.get<ApiPagedResponse<ApiTransaction>>('/transactions', {
      params: { ...filters, ...pagination },
    });

    return {
      data: response.data.data.map(apiToTransaction),
      pagination: transformPagination(response.data.pagination),
    };
  },

  async createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
    const response = await apiClient.post<ApiTransaction>(
      '/transactions',
      transactionToApiRequest(data)
    );
    return apiToTransaction(response.data);
  },
};
```

### 4. Idempotency Keys

Always generate fresh UUID v4 for transaction creation:

```typescript
// ✅ Good: Fresh UUID for each request
import { v4 as uuidv4 } from 'uuid';

export function useCreateTransaction() {
  return useMutation({
    mutationFn: (data: Omit<CreateTransactionRequest, 'idempotencyKey'>) =>
      transactionApi.createTransaction({
        ...data,
        idempotencyKey: uuidv4(), // Fresh UUID
      }),
  });
}

// ❌ Bad: Reusing same UUID
const idempotencyKey = uuidv4();
await createTransaction({ ...data, idempotencyKey }); // OK
await createTransaction({ ...data, idempotencyKey }); // FAILS (409)
```

### 5. Error Handling

```typescript
// ✅ Good: Specific error handling
try {
  const transaction = await createTransaction(data);
  showSuccess('Transaction created');
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) {
      showError('This transaction already exists');
    } else if (error.response?.status === 400) {
      showError('Invalid data: ' + error.response.data.message);
    } else {
      showError('Failed to create transaction');
    }
  } else {
    showError('Unexpected error occurred');
  }
}
```

---

## Testing Requirements

### 1. Test Coverage Goals

- **Critical paths**: 90%+ coverage (auth, transaction creation, deletion)
- **UI components**: 70%+ coverage
- **Utility functions**: 100% coverage
- **Overall**: Minimum 75% coverage

### 2. Unit Tests (Vitest)

Test utility functions and hooks:

```typescript
// __tests__/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/utils/format';

describe('formatCurrency', () => {
  it('formats VND currency correctly', () => {
    expect(formatCurrency(75000000, 'VND')).toBe('75,000,000 VND');
  });

  it('handles zero values', () => {
    expect(formatCurrency(0, 'VND')).toBe('0 VND');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-1000, 'VND')).toBe('-1,000 VND');
  });
});
```

### 3. Component Tests (React Testing Library)

Test user interactions, not implementation details:

```typescript
// __tests__/components/TransactionForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';

describe('TransactionForm', () => {
  it('validates required fields', async () => {
    render(<TransactionForm />);

    const submitButton = screen.getByText('Save Transaction');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Quantity is required')).toBeInTheDocument();
      expect(screen.getByText('Price per unit is required')).toBeInTheDocument();
    });
  });

  it('calculates total amount correctly', () => {
    render(<TransactionForm />);

    const quantityInput = screen.getByLabelText(/quantity/i);
    const priceInput = screen.getByLabelText(/price per unit/i);

    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.change(priceInput, { target: { value: '75000000' } });

    expect(screen.getByText(/750,000,000 VND/i)).toBeInTheDocument();
  });
});
```

### 4. API Mocking with MSW

```typescript
// __tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/v1/transactions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          {
            id: '1',
            type: 'BUY',
            quantity: 10,
            price_per_unit: 75000000,
          },
        ],
        pagination: {
          current_page: 1,
          page_size: 20,
          total_items: 1,
        },
      })
    );
  }),
];
```

### 5. E2E Tests (Playwright)

Test complete user workflows:

```typescript
// e2e/transaction-flow.spec.ts
import { test, expect } from '@playwright/test';

test('user can create and view transaction', async ({ page }) => {
  // Login
  await page.goto('/');
  await page.click('text=Sign in with Google');
  // ... OAuth flow ...

  // Navigate to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Create transaction
  await page.click('text=Add Transaction');
  await page.fill('input[name="quantity"]', '10');
  await page.fill('input[name="pricePerUnit"]', '75000000');
  await page.click('button:has-text("Save Transaction")');

  // Verify success
  await expect(page.locator('text=Transaction created successfully')).toBeVisible();
});
```

---

## Commit Guidelines

### 1. Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)
- `perf`: Performance improvements

**Examples:**

```bash
feat(transaction): add date range filter to transaction list

Implement date range picker component and integrate with transaction
list filtering. Users can now filter transactions by custom date ranges.

Closes #45

---

fix(auth): prevent infinite redirect loop on token expiration

Add token expiration check before redirecting to OAuth flow.
Store last attempted route to restore after login.

Fixes #67

---

refactor(api): extract type transformers to separate module

Move snake_case to camelCase transformation logic from API functions
to dedicated transformers module for better reusability.

---

docs(readme): update development setup instructions

Add missing environment variable configuration step and
clarify Node.js version requirement.

---

test(transaction-form): add validation tests

Add comprehensive tests for form validation including
required fields, numeric constraints, and error messages.
```

### 2. Commit Best Practices

- **Small, focused commits**: Each commit should represent one logical change
- **Clear messages**: Write descriptive commit messages explaining "why" not just "what"
- **Reference issues**: Include issue numbers in commit messages or footer
- **Test before committing**: Ensure tests pass before committing

```bash
# ✅ Good: Small, focused commits
git commit -m "feat(transaction): add quantity input validation"
git commit -m "feat(transaction): add price input validation"
git commit -m "test(transaction): add form validation tests"

# ❌ Bad: Large, unfocused commit
git commit -m "update transaction form and add tests and fix bugs"
```

---

## Pull Request Process

### 1. Before Creating PR

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm run test`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] Added/updated tests for changes
- [ ] Updated documentation if needed

### 2. PR Template

Use this template for pull request descriptions:

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues

Closes #123
Related to #456

## Changes Made

- List key changes made
- Be specific about what was added/modified/removed

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### 3. PR Review Process

1. **Create PR**: Push branch and create PR using template
2. **Automated checks**: CI/CD runs linting, type checking, and tests
3. **Code review**: At least 1 approval required from team member
4. **Address feedback**: Make requested changes and push updates
5. **Final approval**: Reviewer approves PR
6. **Merge**: Squash and merge to main branch

### 4. Code Review Guidelines

**As a Reviewer:**

- Be constructive and respectful
- Explain why you're suggesting changes
- Approve when code meets standards
- Focus on logic, not style (style is automated)

**As a PR Author:**

- Respond to all comments
- Ask for clarification if needed
- Be open to feedback
- Make requested changes promptly

---

## Additional Resources

### Documentation

- [PRODUCT.md](./PRODUCT.md) - Product vision and features
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

### External Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zod Documentation](https://zod.dev/)

### Code Examples

Refer to existing implementations:

- Transaction form: [src/components/features/transactions/TransactionForm.tsx](./src/components/features/transactions/TransactionForm.tsx)
- API client: [src/api/client.ts](./src/api/client.ts)
- Custom hook: [src/hooks/useTransactions.ts](./src/hooks/useTransactions.ts)
- Zustand store: [src/stores/authStore.ts](./src/stores/authStore.ts)

---

## Questions or Issues?

If you have questions about contributing:

- Check existing documentation
- Search existing issues on GitHub
- Ask in team chat or create a discussion
- Contact maintainers

---

Thank you for contributing to Gold Log! 🎉
