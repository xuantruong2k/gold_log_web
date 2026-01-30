# Gold Log Client - Architecture Specification

## Architecture Overview

The Gold Log Client is a modern Single Page Application (SPA) built with React and TypeScript, following industry best practices for maintainability, scalability, and performance. The architecture emphasizes type safety, clean code organization, and efficient state management.

---

## Technology Stack

### Core Technologies

#### Frontend Framework & Language

- **React 18+**: Component-based UI library with Concurrent Features
- **TypeScript 5+**: Strict type checking for enhanced code quality and developer experience
- **Vite**: Next-generation build tool for fast development and optimized production builds

#### Styling

- **TailwindCSS 3+**: Utility-first CSS framework for rapid UI development
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: SVG icon library

#### State Management

- **Zustand**: Lightweight state management (for global state)
- **React Query (TanStack Query)**: Server state management and caching
- **React Context**: For theme and authentication context

#### Routing

- **React Router v6**: Declarative routing for React applications

#### Form Management

- **React Hook Form**: Performant form handling with validation
- **Zod**: TypeScript-first schema validation

#### API Client

- **Axios**: Promise-based HTTP client with interceptors
- **Custom API layer**: Typed API client wrapper

#### Development Tools

- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **TypeScript**: Static type checking

#### Testing

- **Vitest**: Fast unit test runner (Vite-powered)
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW (Mock Service Worker)**: API mocking for tests

---

## Project Structure

```
gold-log-client/
├── public/                          # Static assets
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── api/                         # API layer
│   │   ├── client.ts                # Axios instance configuration
│   │   ├── auth.api.ts              # Auth API endpoints
│   │   ├── transaction.api.ts       # Transaction API endpoints
│   │   └── types.ts                 # API request/response types
│   ├── components/                  # Reusable components
│   │   ├── common/                  # Common UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Loading.tsx
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   └── features/                # Feature-specific components
│   │       ├── auth/
│   │       │   ├── LoginButton.tsx
│   │       │   └── UserMenu.tsx
│   │       └── transactions/
│   │           ├── TransactionForm.tsx
│   │           ├── TransactionList.tsx
│   │           ├── TransactionTable.tsx
│   │           └── TransactionFilters.tsx
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Authentication hook
│   │   ├── useTransactions.ts       # Transaction data hook
│   │   ├── usePagination.ts         # Pagination hook
│   │   └── useToast.ts              # Toast notification hook
│   ├── pages/                       # Page components (routes)
│   │   ├── LandingPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── OAuthCallbackPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── stores/                      # Zustand stores
│   │   ├── authStore.ts             # Authentication state
│   │   ├── transactionStore.ts      # Transaction state
│   │   └── uiStore.ts               # UI state (theme, modals)
│   ├── types/                       # TypeScript type definitions
│   │   ├── transaction.types.ts     # Transaction domain types
│   │   ├── user.types.ts            # User domain types
│   │   └── common.types.ts          # Common types
│   ├── utils/                       # Utility functions
│   │   ├── format.ts                # Formatting utilities
│   │   ├── validation.ts            # Validation helpers
│   │   ├── date.ts                  # Date utilities
│   │   └── constants.ts             # Application constants
│   ├── schemas/                     # Zod validation schemas
│   │   ├── transaction.schema.ts
│   │   └── auth.schema.ts
│   ├── config/                      # Configuration
│   │   ├── env.ts                   # Environment variables
│   │   └── routes.ts                # Route definitions
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Entry point
│   └── vite-env.d.ts                # Vite type definitions
├── tests/                           # Test files
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # E2E tests (Playwright)
├── .env.development                 # Development environment variables
├── .env.production                  # Production environment variables
├── .eslintrc.json                   # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.js               # Tailwind configuration
├── package.json
└── README.md
```

---

## Architecture Patterns

### 1. Component Architecture

#### Component Hierarchy

```
App
  ├── Router
  │   ├── Public Routes
  │   │   ├── LandingPage
  │   │   └── OAuthCallbackPage
  │   └── Protected Routes (AuthGuard)
  │       ├── MainLayout
  │       │   ├── Header
  │       │   ├── DashboardPage
  │       │   ├── TransactionsPage
  │       │   ├── ProfilePage
  │       │   └── Footer
  │       └── NotFoundPage
```

#### Component Types

**1. Page Components** (Pages/)

- Route-level components
- Compose feature components
- Handle page-level state and logic
- One per route

**2. Feature Components** (components/features/)

- Domain-specific components
- Contains business logic
- Example: TransactionForm, TransactionList

**3. Common Components** (components/common/)

- Reusable UI components
- No business logic
- Example: Button, Input, Modal

**4. Layout Components** (components/layout/)

- Structure page layout
- Example: Header, Footer, MainLayout

#### Component Design Principles

**Single Responsibility Principle**

```typescript
// ✅ Good: Component does one thing
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions
}) => {
  return (
    <div>
      {transactions.map(transaction => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
};

// ❌ Bad: Component does too many things
export const TransactionListWithFilteringAndSorting: React.FC = () => {
  // Handles data fetching, filtering, sorting, rendering...
};
```

**Composition Over Inheritance**

```typescript
// ✅ Good: Compose smaller components
export const TransactionForm: React.FC = () => {
  return (
    <Form>
      <TransactionTypeSelector />
      <QuantityInput />
      <PriceInput />
      <ProviderSelect />
      <NotesTextarea />
      <FormActions />
    </Form>
  );
};
```

---

### 2. Type Safety with TypeScript

#### Strict Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Type Definitions

**Domain Types** (types/transaction.types.ts)

```typescript
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Transaction {
  id: string;
  userId: string;
  idempotencyKey: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  currency: string;
  totalAmount: number;
  provider?: string;
  transactionDate: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  idempotencyKey: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  currency?: string;
  provider?: string;
  transactionDate?: string;
  notes?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  provider?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

**API Types** (api/types.ts)

```typescript
// Exact match with backend snake_case
export interface ApiTransaction {
  id: string;
  user_id: string;
  idempotency_key: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_unit: number;
  currency: string;
  total_amount: number;
  provider?: string;
  transaction_date: string;
  notes?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiCreateTransactionRequest {
  idempotency_key: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_unit: number;
  currency?: string;
  provider?: string;
  transaction_date?: string;
  notes?: string;
}

// Type transformers between API and domain types
export function apiTransactionToTransaction(apiTransaction: ApiTransaction): Transaction {
  return {
    id: apiTransaction.id,
    userId: apiTransaction.user_id,
    idempotencyKey: apiTransaction.idempotency_key,
    type: apiTransaction.type as TransactionType,
    quantity: apiTransaction.quantity,
    pricePerUnit: apiTransaction.price_per_unit,
    currency: apiTransaction.currency,
    totalAmount: apiTransaction.total_amount,
    provider: apiTransaction.provider,
    transactionDate: apiTransaction.transaction_date,
    notes: apiTransaction.notes,
    isDeleted: apiTransaction.is_deleted,
    createdAt: apiTransaction.created_at,
    updatedAt: apiTransaction.updated_at,
  };
}
```

---

### 3. State Management Strategy

#### State Categories

**1. Server State** (React Query)

- Transaction data
- User profile
- Any data from backend APIs
- Cached with automatic revalidation

**2. Global Client State** (Zustand)

- Authentication state (token, user)
- UI preferences (theme, language)
- Modal/drawer open state

**3. Local Component State** (useState)

- Form input values
- Toggle states
- Temporary UI state

**4. URL State** (React Router)

- Current route
- Query parameters (filters, pagination)

#### React Query Configuration

```typescript
// api/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Custom Hooks for Data Fetching

```typescript
// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/api/transaction.api';
import type {
  Transaction,
  CreateTransactionRequest,
  TransactionFilters,
  PaginationParams,
} from '@/types/transaction.types';

const QUERY_KEYS = {
  transactions: (filters?: TransactionFilters, pagination?: PaginationParams) => [
    'transactions',
    filters,
    pagination,
  ],
  transaction: (id: string) => ['transaction', id],
};

export function useTransactions(
  filters?: TransactionFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(filters, pagination),
    queryFn: () => transactionApi.getTransactions(filters, pagination),
    keepPreviousData: true, // Keep showing old data while fetching new page
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.transaction(id),
    queryFn: () => transactionApi.getTransaction(id),
    enabled: !!id, // Only fetch if id exists
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionApi.createTransaction(data),
    onSuccess: () => {
      // Invalidate and refetch transaction list
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
```

#### Zustand Store for Authentication

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user.types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // Key in storage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }), // Only persist these fields
    }
  )
);
```

---

### 4. API Layer Architecture

#### Axios Instance with Interceptors

```typescript
// api/client.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      useAuthStore.getState().clearAuth();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

#### Typed API Endpoints

```typescript
// api/transaction.api.ts
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from './client';
import { apiTransactionToTransaction, transactionToApiRequest } from './transformers';
import type {
  Transaction,
  CreateTransactionRequest,
  TransactionFilters,
  PaginationParams,
  PagedResponse,
} from '@/types/transaction.types';
import type { ApiTransaction, ApiPagedResponse } from './types';

export const transactionApi = {
  /**
   * Get paginated list of transactions with optional filters
   */
  async getTransactions(
    filters?: TransactionFilters,
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PagedResponse<Transaction>> {
    const params = new URLSearchParams();
    params.append('page', pagination.page.toString());
    params.append('pageSize', pagination.pageSize.toString());

    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.provider) params.append('provider', filters.provider);

    const response = await apiClient.get<ApiPagedResponse<ApiTransaction>>(
      `/transactions?${params.toString()}`
    );

    return {
      data: response.data.data.map(apiTransactionToTransaction),
      pagination: {
        currentPage: response.data.pagination.current_page,
        pageSize: response.data.pagination.page_size,
        totalItems: response.data.pagination.total_items,
        totalPages: response.data.pagination.total_pages,
        hasNext: response.data.pagination.has_next,
        hasPrevious: response.data.pagination.has_previous,
      },
    };
  },

  /**
   * Get single transaction by ID
   */
  async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<ApiTransaction>(`/transactions/${id}`);
    return apiTransactionToTransaction(response.data);
  },

  /**
   * Create new transaction with automatic idempotency key generation
   */
  async createTransaction(
    data: Omit<CreateTransactionRequest, 'idempotencyKey'>
  ): Promise<Transaction> {
    const requestData: CreateTransactionRequest = {
      ...data,
      idempotencyKey: uuidv4(), // Generate fresh UUID for each request
    };

    const apiRequest = transactionToApiRequest(requestData);
    const response = await apiClient.post<ApiTransaction>('/transactions', apiRequest);

    return apiTransactionToTransaction(response.data);
  },

  /**
   * Delete transaction (soft delete)
   */
  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },
};
```

---

### 5. Form Management with React Hook Form & Zod

#### Zod Schema for Validation

```typescript
// schemas/transaction.schema.ts
import { z } from 'zod';
import { TransactionType } from '@/types/transaction.types';

export const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    required_error: 'Transaction type is required',
  }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than 0')
    .max(9999999999, 'Quantity is too large'),
  pricePerUnit: z
    .number({
      required_error: 'Price per unit is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be greater than 0')
    .max(999999999999999, 'Price is too large'),
  currency: z.enum(['VND', 'USD']).default('VND'),
  provider: z.string().max(100, 'Provider name is too long').optional(),
  transactionDate: z.string().datetime().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
```

#### Form Component with Validation

```typescript
// components/features/transactions/TransactionForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionFormData } from '@/schemas/transaction.schema';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useToast } from '@/hooks/useToast';

export const TransactionForm: React.FC = () => {
  const { mutate: createTransaction, isLoading } = useCreateTransaction();
  const { showSuccess, showError } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: TransactionType.BUY,
      currency: 'VND',
      transactionDate: new Date().toISOString(),
    },
  });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');
  const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;

  const onSubmit = (data: TransactionFormData) => {
    createTransaction(data, {
      onSuccess: () => {
        showSuccess('Transaction created successfully');
        reset();
      },
      onError: (error: any) => {
        if (error.response?.status === 409) {
          showError('This transaction already exists');
        } else {
          showError('Failed to create transaction. Please try again.');
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Transaction Type *
        </label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...register('type')}
              value={TransactionType.BUY}
              className="form-radio"
            />
            <span className="ml-2">BUY</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...register('type')}
              value={TransactionType.SELL}
              className="form-radio"
            />
            <span className="ml-2">SELL</span>
          </label>
        </div>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Quantity (chỉ) *
        </label>
        <input
          type="number"
          step="0.01"
          {...register('quantity', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      {/* Price per Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Price per Unit (VND) *
        </label>
        <input
          type="number"
          {...register('pricePerUnit', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.pricePerUnit && (
          <p className="mt-1 text-sm text-red-600">{errors.pricePerUnit.message}</p>
        )}
      </div>

      {/* Total Amount Display */}
      <div className="rounded-md bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Total Amount</p>
        <p className="text-2xl font-bold text-gray-900">
          {totalAmount.toLocaleString('vi-VN')} VND
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Transaction'}
      </button>
    </form>
  );
};
```

---

### 6. Routing & Navigation

#### Route Configuration

```typescript
// config/routes.ts
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  PROFILE: '/profile',
  OAUTH_CALLBACK: '/auth/callback/:provider',
  NOT_FOUND: '*',
} as const;
```

#### Router Setup with Protected Routes

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/client';
import { useAuthStore } from './stores/authStore';
import { ROUTES } from './config/routes';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import MainLayout from './components/layout/MainLayout';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallbackPage />} />

          {/* Protected Routes */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.TRANSACTIONS}
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TransactionsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

### 7. OAuth Authentication Flow

#### OAuth Hook

```typescript
// hooks/useAuth.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const startOAuthFlow = async (redirectUri: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { authorizationUrl, state } = await authApi.getAuthorizationUrl('google', redirectUri);

      // Store state for verification
      sessionStorage.setItem('oauth_state', state);

      // Redirect to Google OAuth
      window.location.href = authorizationUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth flow');
      setIsLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify state matches
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid state token - possible CSRF attack');
      }

      // Exchange code for token
      const response = await authApi.handleOAuthCallback('google', code, state);

      // Save auth state
      setAuth(response.token, response.user);

      // Clean up
      sessionStorage.removeItem('oauth_state');

      // Navigate to dashboard
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    navigate(ROUTES.HOME);
  };

  return {
    startOAuthFlow,
    handleOAuthCallback,
    logout,
    isLoading,
    error,
  };
}
```

#### OAuth Callback Page

```typescript
// pages/OAuthCallbackPage.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback, isLoading, error } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams, handleOAuthCallback]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Failed</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <a href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
```

---

## Best Practices

### 1. TypeScript Best Practices

#### Use Strict Mode

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

#### Avoid `any` Type

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
interface Data {
  value: string;
}
function processData(data: Data) {
  return data.value;
}
```

#### Use Type Guards

```typescript
function isTransaction(obj: unknown): obj is Transaction {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'type' in obj;
}
```

---

### 2. Component Best Practices

#### Use Functional Components with Hooks

```typescript
// ✅ Good: Functional component
export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    // Component JSX
  );
};
```

#### Memoization for Performance

```typescript
import { memo, useMemo } from 'react';

export const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);

  return <div>{/* Render processedData */}</div>;
});
```

#### Custom Hooks for Reusability

```typescript
// Extract common logic into custom hooks
function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = () => setPage((p) => p + 1);
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const resetPage = () => setPage(1);

  return { page, pageSize, nextPage, prevPage, resetPage, setPageSize };
}
```

---

### 3. Performance Optimization

#### Code Splitting

```typescript
// Lazy load routes
import { lazy, Suspense } from 'react';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
      </Routes>
    </Suspense>
  );
}
```

#### Virtualization for Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualizedTransactionList: React.FC<Props> = ({ transactions }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Estimated row height
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <TransactionRow
            key={transactions[virtualRow.index].id}
            transaction={transactions[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

---

### 4. Testing Strategy

#### Unit Tests with Vitest

```typescript
// __tests__/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '@/utils/format';

describe('formatCurrency', () => {
  it('should format VND currency correctly', () => {
    expect(formatCurrency(75000000, 'VND')).toBe('75,000,000 VND');
  });

  it('should handle zero values', () => {
    expect(formatCurrency(0, 'VND')).toBe('0 VND');
  });
});
```

#### Component Tests with React Testing Library

```typescript
// __tests__/components/TransactionForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';

describe('TransactionForm', () => {
  it('should validate required fields', async () => {
    render(<TransactionForm />);

    const submitButton = screen.getByText('Save Transaction');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Quantity is required')).toBeInTheDocument();
    });
  });

  it('should calculate total amount correctly', () => {
    render(<TransactionForm />);

    const quantityInput = screen.getByLabelText(/quantity/i);
    const priceInput = screen.getByLabelText(/price per unit/i);

    fireEvent.change(quantityInput, { target: { value: '10' } });
    fireEvent.change(priceInput, { target: { value: '75000000' } });

    expect(screen.getByText(/750,000,000 VND/i)).toBeInTheDocument();
  });
});
```

---

## Environment Configuration

### Environment Variables

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback/google
VITE_ENVIRONMENT=development

# .env.production
VITE_API_BASE_URL=https://api.goldlog.com/api/v1
VITE_OAUTH_REDIRECT_URI=https://app.goldlog.com/auth/callback/google
VITE_ENVIRONMENT=production
```

### Type-safe Environment Variables

```typescript
// config/env.ts
interface Env {
  API_BASE_URL: string;
  OAUTH_REDIRECT_URI: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

function getEnv(): Env {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const oauthRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
  const environment = import.meta.env.VITE_ENVIRONMENT;

  if (!apiBaseUrl || !oauthRedirectUri) {
    throw new Error('Missing required environment variables');
  }

  return {
    API_BASE_URL: apiBaseUrl,
    OAUTH_REDIRECT_URI: oauthRedirectUri,
    ENVIRONMENT: environment || 'development',
  };
}

export const env = getEnv();
```

---

## Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

---

## Version History

- **v1.0.0** (2026-01-30): Initial architecture specification for web client
