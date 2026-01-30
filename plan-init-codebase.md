# Plan: Initialize Gold Log Web Client Codebase

**Document Version**: 1.0
**Created**: January 30, 2026
**Status**: Planning
**Related Documents**: [ARCHITECTURE.md], [PRODUCT.md], [API_DOCUMENTATION.md]

---

## Overview

This document outlines the step-by-step plan to initialize the Gold Log web client codebase. The client will be a modern Single Page Application (SPA) built with React 18+, TypeScript 5+, and Vite, following industry best practices for code quality, performance, and maintainability.

### Goals

- ✅ Set up modern React + TypeScript development environment
- ✅ Configure comprehensive tooling (linting, formatting, testing)
- ✅ Establish clean project structure following architecture guidelines
- ✅ Implement type-safe API client layer
- ✅ Set up state management (Zustand + React Query)
- ✅ Configure routing with protected routes
- ✅ Implement authentication flow foundation
- ✅ Establish testing infrastructure
- ✅ Document setup and development workflow

### Success Criteria

- Project builds successfully with zero errors
- All linting and formatting rules pass
- Type checking passes with strict mode enabled
- Basic routing structure works
- Development server runs smoothly
- Test infrastructure is functional
- Git hooks enforce code quality

---

## Prerequisites

### Required Tools

```bash
# Node.js (LTS version)
node --version  # Should be v18+ or v20+

# npm (comes with Node.js)
npm --version   # Should be v9+ or v10+

# Git
git --version
```

### Recommended VS Code Extensions

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **TypeScript** (built-in)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **Path Intellisense** (christian-kohler.path-intellisense)
- **Auto Rename Tag** (formulahendry.auto-rename-tag)

---

## Phase 1: Project Initialization

### Step 1.1: Create Vite + React + TypeScript Project

```bash
# Create project with Vite template
npm create vite@latest gold-log-client -- --template react-ts

# Navigate to project
cd gold-log-client

# Install dependencies
npm install
```

**Expected Structure**:

```
gold-log-client/
├── node_modules/
├── public/
├── src/
│   ├── assets/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

**Verify**:

```bash
npm run dev  # Should start dev server at http://localhost:5173
```

---

### Step 1.2: Configure TypeScript (Strict Mode)

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting - STRICT MODE */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "alwaysStrict": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Verify**:

```bash
npx tsc --noEmit  # Should pass with no errors
```

---

### Step 1.3: Install Core Dependencies

```bash
# React Router for routing
npm install react-router-dom

# State Management
npm install zustand @tanstack/react-query

# HTTP Client
npm install axios

# Form Management
npm install react-hook-form @hookform/resolvers zod

# UUID Generation (for idempotency keys)
npm install uuid
npm install -D @types/uuid

# Date utilities
npm install date-fns

# UI Components & Styling
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react @heroicons/react

# Utility libraries
npm install clsx
```

**Verify**:

```bash
npm list --depth=0  # Check all packages installed
```

---

### Step 1.4: Configure TailwindCSS

```bash
# Initialize Tailwind
npx tailwindcss init -p
```

**File**: `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
```

**File**: `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
@layer base {
  body {
    @apply bg-gray-50 text-gray-900;
  }
}
```

**Verify**:

```bash
npm run dev  # TailwindCSS should be working
```

---

## Phase 2: Development Tools Setup

### Step 2.1: Configure ESLint

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react eslint-plugin-react-hooks
npm install -D eslint-plugin-react-refresh
```

**File**: `.eslintrc.json`

```json
{
  "root": true,
  "env": {
    "browser": true,
    "es2020": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended"
  ],
  "ignorePatterns": ["dist", ".eslintrc.json"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": ["./tsconfig.json", "./tsconfig.node.json"],
    "tsconfigRootDir": "."
  },
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "react/prop-types": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

**Add script to package.json**:

```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

**Verify**:

```bash
npm run lint  # Should pass with no errors
```

---

### Step 2.2: Configure Prettier

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

**File**: `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**File**: `.prettierignore`

```
dist
node_modules
coverage
*.log
.DS_Store
```

**Update .eslintrc.json** (add to extends array):

```json
{
  "extends": [
    // ... existing extends
    "plugin:prettier/recommended"
  ]
}
```

**Add script to package.json**:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\""
  }
}
```

**Verify**:

```bash
npm run format       # Formats all files
npm run format:check # Checks formatting
```

---

### Step 2.3: Configure Git Hooks (Husky)

```bash
npm install -D husky lint-staged

# Initialize husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

**File**: `package.json` (add lint-staged configuration)

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

**Add script to package.json**:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

**Verify**:

```bash
# Make a test commit - hooks should run automatically
git add .
git commit -m "test: verify git hooks"
```

---

### Step 2.4: Configure Vite with Path Aliases

**File**: `vite.config.ts`

```typescript
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
  server: {
    port: 3000,
    open: true,
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

**Verify path alias works**:
Create test file `src/utils/test.ts` with export, then import using `@/utils/test` in App.tsx.

---

## Phase 3: Project Structure Setup

### Step 3.1: Create Directory Structure

```bash
mkdir -p src/{api,components/{common,layout,features/{auth,transactions}},hooks,pages,stores,types,utils,schemas,config,styles}
```

**Expected structure**:

```
src/
├── api/                         # API layer
│   ├── client.ts
│   ├── auth.api.ts
│   ├── transaction.api.ts
│   └── types.ts
├── components/
│   ├── common/                  # Reusable UI components
│   ├── layout/                  # Layout components
│   └── features/                # Feature-specific components
│       ├── auth/
│       └── transactions/
├── hooks/                       # Custom React hooks
├── pages/                       # Page components
├── stores/                      # Zustand stores
├── types/                       # TypeScript types
├── utils/                       # Utility functions
├── schemas/                     # Zod validation schemas
├── config/                      # Configuration
└── styles/                      # Global styles
```

---

### Step 3.2: Create Base Configuration Files

**File**: `src/config/env.ts`

```typescript
interface Env {
  API_BASE_URL: string;
  OAUTH_REDIRECT_URI: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

function validateEnv(): Env {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const oauthRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  if (!apiBaseUrl || !oauthRedirectUri) {
    throw new Error('Missing required environment variables');
  }

  return {
    API_BASE_URL: apiBaseUrl,
    OAUTH_REDIRECT_URI: oauthRedirectUri,
    ENVIRONMENT: environment as Env['ENVIRONMENT'],
  };
}

export const env = validateEnv();
```

**File**: `src/config/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  PROFILE: '/profile',
  OAUTH_CALLBACK: '/auth/callback/:provider',
  NOT_FOUND: '*',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
```

**File**: `src/utils/constants.ts`

```typescript
export const APP_NAME = 'Gold Log';
export const APP_VERSION = '1.0.0';

export const API_TIMEOUT = 10000; // 10 seconds

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const CURRENCY = {
  VND: 'VND',
  USD: 'USD',
} as const;

export const TRANSACTION_TYPE = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;
```

---

### Step 3.3: Create Environment Files

**File**: `.env.development`

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback/google
VITE_ENVIRONMENT=development
```

**File**: `.env.production`

```bash
VITE_API_BASE_URL=https://api.goldlog.com/api/v1
VITE_OAUTH_REDIRECT_URI=https://app.goldlog.com/auth/callback/google
VITE_ENVIRONMENT=production
```

**File**: `.env.example` (for documentation)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api/v1

# OAuth Configuration
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback/google

# Environment
VITE_ENVIRONMENT=development
```

---

## Phase 4: Type Definitions

### Step 4.1: Define Domain Types

**File**: `src/types/common.types.ts`

```typescript
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}
```

**File**: `src/types/user.types.ts`

```typescript
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  username: string;
  profilePictureUrl?: string;
  provider: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
```

**File**: `src/types/transaction.types.ts`

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
```

---

### Step 4.2: Define API Types (snake_case)

**File**: `src/api/types.ts`

```typescript
// API types match backend snake_case convention
export interface ApiUser {
  id: string;
  email: string;
  username: string;
  profile_picture_url?: string;
  provider: string;
  role: string;
}

export interface ApiLoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: ApiUser;
}

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

export interface ApiPaginationMetadata {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiPagedResponse<T> {
  data: T[];
  pagination: ApiPaginationMetadata;
}
```

---

## Phase 5: API Layer Implementation

### Step 5.1: Create Axios Client

**File**: `src/api/client.ts`

```typescript
import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - will be enhanced with auth later
apiClient.interceptors.request.use(
  (config) => {
    // Token will be added here once auth is implemented
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Global error handling will be added here
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

---

### Step 5.2: Create Type Transformers

**File**: `src/api/transformers.ts`

```typescript
import type { User, LoginResponse, Transaction } from '@/types';
import type { ApiUser, ApiLoginResponse, ApiTransaction } from './types';
import { UserRole, TransactionType } from '@/types';

export function apiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    username: apiUser.username,
    profilePictureUrl: apiUser.profile_picture_url,
    provider: apiUser.provider,
    role: apiUser.role as UserRole,
  };
}

export function apiLoginResponseToLoginResponse(apiResponse: ApiLoginResponse): LoginResponse {
  return {
    token: apiResponse.token,
    tokenType: apiResponse.token_type,
    expiresIn: apiResponse.expires_in,
    user: apiUserToUser(apiResponse.user),
  };
}

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

### Step 5.3: Create React Query Client

**File**: `src/api/queryClient.ts`

```typescript
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

---

## Phase 6: State Management

### Step 6.1: Create Auth Store (Zustand)

**File**: `src/stores/authStore.ts`

```typescript
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
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

**Verify store works**:
Create test component that uses the store and displays auth state.

---

## Phase 7: Routing Setup

### Step 7.1: Create Page Components (Placeholders)

**File**: `src/pages/LandingPage.tsx`

```typescript
export const LandingPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Gold Log</h1>
        <p className="mt-4 text-lg text-gray-600">Track Your Gold Investment</p>
        <button className="mt-8 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
```

**File**: `src/pages/DashboardPage.tsx`

```typescript
export const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to Gold Log</p>
    </div>
  );
};

export default DashboardPage;
```

**File**: `src/pages/TransactionsPage.tsx`

```typescript
export const TransactionsPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Transactions</h1>
      <p className="mt-2 text-gray-600">Your gold transaction history</p>
    </div>
  );
};

export default TransactionsPage;
```

**File**: `src/pages/ProfilePage.tsx`

```typescript
export const ProfilePage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-2 text-gray-600">Manage your account</p>
    </div>
  );
};

export default ProfilePage;
```

**File**: `src/pages/OAuthCallbackPage.tsx`

```typescript
export const OAuthCallbackPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
```

**File**: `src/pages/NotFoundPage.tsx`

```typescript
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Page not found</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
```

---

### Step 7.2: Create Layout Components

**File**: `src/components/layout/Header.tsx`

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

export const Header = () => {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to={ROUTES.DASHBOARD} className="text-xl font-bold text-gray-900">
          Gold Log
        </Link>
        <div className="flex gap-6">
          <Link to={ROUTES.DASHBOARD} className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link to={ROUTES.TRANSACTIONS} className="text-gray-600 hover:text-gray-900">
            Transactions
          </Link>
          <Link to={ROUTES.PROFILE} className="text-gray-600 hover:text-gray-900">
            Profile
          </Link>
        </div>
      </nav>
    </header>
  );
};
```

**File**: `src/components/layout/Footer.tsx`

```typescript
export const Footer = () => {
  return (
    <footer className="border-t bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600">
        <p>&copy; 2026 Gold Log. All rights reserved.</p>
      </div>
    </footer>
  );
};
```

**File**: `src/components/layout/MainLayout.tsx`

```typescript
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
};
```

---

### Step 7.3: Create Protected Route Component

**File**: `src/components/common/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
};
```

---

### Step 7.4: Setup Router in App.tsx

**File**: `src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { ROUTES } from './config/routes';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

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

          {/* 404 */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

**Verify routing**:

```bash
npm run dev
# Navigate to different routes and verify they work
```

---

## Phase 8: Testing Infrastructure

### Step 8.1: Install Testing Dependencies

```bash
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
npm install -D @types/testing-library__jest-dom
```

---

### Step 8.2: Configure Vitest

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File**: `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

---

### Step 8.3: Create Test Utilities

**File**: `src/test/utils.tsx`

```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

---

### Step 8.4: Write Sample Tests

**File**: `src/test/App.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from './utils';
import App from '../App';

describe('App', () => {
  it('should render landing page by default', () => {
    render(<App />);
    expect(screen.getByText('Gold Log')).toBeInTheDocument();
  });
});
```

**File**: `src/utils/__tests__/constants.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { APP_NAME, PAGINATION } from '../constants';

describe('constants', () => {
  it('should have correct app name', () => {
    expect(APP_NAME).toBe('Gold Log');
  });

  it('should have correct pagination defaults', () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
  });
});
```

**Add scripts to package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Verify tests**:

```bash
npm run test      # Run tests in watch mode
npm run test:ui   # Open Vitest UI
```

---

## Phase 9: Documentation

### Step 9.1: Update README.md

**File**: `README.md`

```markdown
# Gold Log Client

Web client for Gold Log - Track your gold investment transactions and performance.

## Tech Stack

- **React 18+** - UI framework
- **TypeScript 5+** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Routing
- **React Query** - Server state management
- **Zustand** - Global state management
- **React Hook Form + Zod** - Form validation
- **Vitest** - Testing

## Prerequisites

- Node.js 18+ or 20+
- npm 9+

## Getting Started

### Installation

\`\`\`bash

# Install dependencies

npm install

# Copy environment file

cp .env.example .env.development

# Start development server

npm run dev
\`\`\`

The app will be available at `http://localhost:3000`

### Environment Variables

Create `.env.development` file:

\`\`\`bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback/google
VITE_ENVIRONMENT=development
\`\`\`

## Development

### Available Scripts

\`\`\`bash
npm run dev # Start dev server
npm run build # Build for production
npm run preview # Preview production build
npm run lint # Run ESLint
npm run format # Format code with Prettier
npm run test # Run tests
npm run test:ui # Open Vitest UI
npm run type-check # Run TypeScript type checking
\`\`\`

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforces code quality rules
- **Prettier**: Auto-formats code
- **Husky**: Pre-commit hooks run linting and formatting
- **Vitest**: Unit and integration tests

### Project Structure

\`\`\`
src/
├── api/ # API client and endpoints
├── components/ # React components
│ ├── common/ # Reusable components
│ ├── layout/ # Layout components
│ └── features/ # Feature-specific components
├── hooks/ # Custom React hooks
├── pages/ # Page components (routes)
├── stores/ # Zustand stores
├── types/ # TypeScript types
├── utils/ # Utility functions
├── schemas/ # Zod validation schemas
├── config/ # Configuration
└── test/ # Test utilities
\`\`\`

## Testing

\`\`\`bash

# Run all tests

npm run test

# Run with UI

npm run test:ui

# Run with coverage

npm run test:coverage
\`\`\`

## Building for Production

\`\`\`bash

# Build production bundle

npm run build

# Preview production build

npm run preview
\`\`\`

## License

MIT
```

---

### Step 9.2: Create Development Guide

**File**: `DEVELOPMENT.md`

```markdown
# Development Guide

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.development`
3. Start dev server: `npm run dev`

## Coding Standards

### TypeScript

- Use strict mode (already configured)
- Avoid `any` type - use proper types or `unknown`
- Use type inference where possible
- Define explicit return types for exported functions

### Components

- Use functional components with hooks
- Keep components small and focused (Single Responsibility)
- Extract reusable logic into custom hooks
- Use proper TypeScript props interfaces

### State Management

- Use React Query for server state
- Use Zustand for global client state
- Use useState for local component state
- Use URL state for filters and pagination

### Testing

- Write tests for all utility functions
- Write tests for custom hooks
- Write tests for complex components
- Maintain >80% code coverage

## Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add my feature"`
3. Push and create PR: `git push origin feature/my-feature`

### Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `docs:` - Documentation updates
- `chore:` - Build process or auxiliary tool changes

## API Integration

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for backend API details.

### Making API Calls

1. Define types in `src/api/types.ts` (snake_case)
2. Create transformer in `src/api/transformers.ts`
3. Define domain types in `src/types/` (camelCase)
4. Create API function in `src/api/*.api.ts`
5. Create custom hook in `src/hooks/`

## Troubleshooting

### Port Already in Use

Change port in `vite.config.ts`:
\`\`\`typescript
server: { port: 3001 }
\`\`\`

### Type Errors

Run type check: `npm run type-check`

### Linting Errors

Auto-fix: `npm run lint -- --fix`
```

---

## Phase 10: Final Verification

### Step 10.1: Verification Checklist

Run through this checklist to verify everything works:

```bash
# 1. TypeScript compilation
npx tsc --noEmit
# Expected: No errors

# 2. Linting
npm run lint
# Expected: No errors

# 3. Formatting check
npm run format:check
# Expected: All files formatted

# 4. Tests
npm run test
# Expected: All tests pass

# 5. Build
npm run build
# Expected: Successful build in dist/

# 6. Development server
npm run dev
# Expected: Server starts, can navigate all routes

# 7. Git hooks
git add .
git commit -m "test: verify setup"
# Expected: Pre-commit hooks run successfully
```

---

### Step 10.2: Update package.json Scripts

**File**: `package.json` (add all scripts)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "prepare": "husky install"
  }
}
```

---

## Phase 11: Initial Commit

### Step 11.1: Setup Git Repository

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "chore: initialize Gold Log client codebase

- Setup Vite + React + TypeScript
- Configure strict TypeScript
- Add TailwindCSS for styling
- Configure ESLint and Prettier
- Setup Husky git hooks
- Install core dependencies (React Router, React Query, Zustand)
- Create project structure
- Setup API layer foundation
- Configure testing with Vitest
- Add documentation (README, DEVELOPMENT)
"

# Create main branch (if needed)
git branch -M main
```

---

## Success Metrics

After completing this plan, you should have:

- ✅ Clean, type-safe TypeScript codebase
- ✅ All development tools configured and working
- ✅ Clear project structure following best practices
- ✅ Working routing with protected routes
- ✅ API client foundation ready for integration
- ✅ State management setup (Zustand + React Query)
- ✅ Testing infrastructure in place
- ✅ Git hooks enforcing code quality
- ✅ Comprehensive documentation

---

## Next Steps

After completing this plan:

1. **Implement Authentication Flow** (plan-auth-oauth-jwt-client.md)
   - OAuth integration
   - Token management
   - Auth context and hooks

2. **Implement Transaction Features** (plan-transactions-client.md)
   - Transaction form with validation
   - Transaction list with pagination
   - Transaction details modal
   - Delete functionality

3. **Implement Dashboard** (plan-dashboard-client.md)
   - Portfolio summary cards
   - Recent transactions widget
   - Quick actions

4. **Polish & Deploy** (plan-deployment-client.md)
   - Performance optimization
   - Accessibility improvements
   - Production build and deployment

---

## References

- [ARCHITECTURE_CLIENT.md](ARCHITECTURE_CLIENT.md) - Architecture guidelines
- [PRODUCT_CLIENT.md](PRODUCT_CLIENT.md) - Product requirements
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Backend API documentation
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

---

**Document Status**: Ready for Implementation
**Estimated Time**: 4-6 hours for initial setup
**Last Updated**: January 30, 2026
