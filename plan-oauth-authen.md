# Plan: Implement OAuth Authentication for Gold Log Client

**Document Version**: 1.0
**Created**: January 30, 2026
**Status**: Planning
**Related Documents**: [ARCHITECTURE.md], [PRODUCT.md], [API_DOCUMENTATION.md], [plan-init-codebase.md]

---

## Overview

This document outlines the step-by-step plan to implement production-ready OAuth 2.0 authentication for the Gold Log web client. The implementation will replace the mock login functionality with real Google OAuth integration, including token management, automatic refresh, and secure storage.

### Goals

- ✅ Implement Google OAuth 2.0 authorization flow
- ✅ Create secure token storage and management
- ✅ Implement automatic token refresh mechanism
- ✅ Add comprehensive error handling for auth failures
- ✅ Create reusable authentication hooks
- ✅ Implement logout with token cleanup
- ✅ Add loading states and user feedback
- ✅ Ensure CSRF protection with state parameter
- ✅ Write tests for authentication flows

### Success Criteria

- User can successfully authenticate with Google
- Tokens are securely stored and automatically refreshed
- Authentication state persists across page reloads
- Failed authentication shows clear error messages
- Expired tokens trigger automatic re-authentication
- All auth-related tests pass
- No security vulnerabilities in auth flow

---

## Prerequisites

### Required Setup

Before starting this plan, ensure:

1. ✅ **Phase 1-11 Complete**: Initial codebase setup finished
2. ✅ **Backend API Running**: Gold Log backend accessible at configured URL
3. ✅ **Google OAuth Configured**: OAuth credentials obtained from Google Cloud Console
4. ✅ **Environment Variables Set**: OAuth redirect URI configured

### Backend API Endpoints Required

Verify these endpoints are available:

```bash
# Test backend health
curl http://localhost:8080/api/v1/health

# Test OAuth URL generation (should return 200)
curl "http://localhost:8080/api/v1/auth/oauth/google/url?redirectUri=http://localhost:3000/auth/callback/google"
```

### Google OAuth Setup

If not already configured, obtain OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/auth/callback/google`
6. Note Client ID and Client Secret (backend configuration)

---

## Phase 1: API Layer Implementation

### Step 1.1: Create Auth API Module

**File**: `src/api/auth.api.ts`

```typescript
import { apiClient } from './client';
import { apiLoginResponseToLoginResponse } from './transformers';
import type { LoginResponse } from '@/types/user.types';
import type { ApiLoginResponse } from './types';

export interface AuthorizationUrlResponse {
  authorizationUrl: string;
  state: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

export const authApi = {
  /**
   * Get OAuth authorization URL for redirecting user to provider
   * @param provider - OAuth provider (e.g., 'google')
   * @param redirectUri - Frontend callback URL
   * @returns Authorization URL and CSRF state token
   */
  async getAuthorizationUrl(
    provider: string,
    redirectUri: string
  ): Promise<AuthorizationUrlResponse> {
    const response = await apiClient.get<{
      authorization_url: string;
      state: string;
    }>(`/auth/oauth/${provider}/url`, {
      params: { redirectUri },
    });

    return {
      authorizationUrl: response.data.authorization_url,
      state: response.data.state,
    };
  },

  /**
   * Exchange OAuth authorization code for JWT token
   * @param provider - OAuth provider (e.g., 'google')
   * @param request - Authorization code and state from OAuth callback
   * @returns Login response with JWT token and user info
   */
  async handleOAuthCallback(
    provider: string,
    request: OAuthCallbackRequest
  ): Promise<LoginResponse> {
    const response = await apiClient.post<ApiLoginResponse>(
      `/auth/oauth/${provider}/callback`,
      {
        code: request.code,
        state: request.state,
      }
    );

    return apiLoginResponseToLoginResponse(response.data);
  },

  /**
   * Get current authenticated user information
   * @returns Current user details
   */
  async getCurrentUser() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  /**
   * Logout and invalidate current JWT token
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
```

**Verify**:
```typescript
// Test in browser console after import
// authApi.getAuthorizationUrl('google', 'http://localhost:3000/auth/callback/google')
```

---

### Step 1.2: Enhance API Client with Token Management

**File**: `src/api/client.ts` (update)

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors and token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && originalRequest) {
      // Clear auth state
      useAuthStore.getState().clearAuth();

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }

      return Promise.reject(error);
    }

    // Log other errors for debugging
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

---

## Phase 2: Authentication Hook Implementation

### Step 2.1: Create useAuth Hook

**File**: `src/hooks/useAuth.ts`

```typescript
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

interface UseAuthReturn {
  startOAuthFlow: (provider: string, redirectUri: string) => Promise<void>;
  handleOAuthCallback: (code: string, state: string, provider: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  /**
   * Start OAuth flow by redirecting to provider
   */
  const startOAuthFlow = useCallback(
    async (provider: string, redirectUri: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get authorization URL from backend
        const { authorizationUrl, state } = await authApi.getAuthorizationUrl(
          provider,
          redirectUri
        );

        // Store state for verification (CSRF protection)
        sessionStorage.setItem('oauth_state', state);

        // Redirect to OAuth provider
        window.location.href = authorizationUrl;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to start authentication';
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Handle OAuth callback after user returns from provider
   */
  const handleOAuthCallback = useCallback(
    async (code: string, state: string, provider: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Verify state matches (CSRF protection)
        const savedState = sessionStorage.getItem('oauth_state');
        if (state !== savedState) {
          throw new Error('Invalid state token - possible CSRF attack');
        }

        // Exchange code for token
        const response = await authApi.handleOAuthCallback(provider, {
          code,
          state,
        });

        // Save auth state
        setAuth(response.token, response.user);

        // Calculate token expiration time
        const expiresAt = Date.now() + response.expiresIn * 1000;
        localStorage.setItem('token_expires_at', expiresAt.toString());

        // Clean up
        sessionStorage.removeItem('oauth_state');

        // Navigate to dashboard
        navigate(ROUTES.DASHBOARD);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Authentication failed';
        setError(errorMessage);
        console.error('OAuth callback error:', err);

        // Redirect to home on error
        setTimeout(() => navigate(ROUTES.HOME), 2000);
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth, navigate]
  );

  /**
   * Logout user and clean up auth state
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call backend logout endpoint
      await authApi.logout();

      // Clear local state
      clearAuth();
      localStorage.removeItem('token_expires_at');
      sessionStorage.removeItem('oauth_state');

      // Navigate to home
      navigate(ROUTES.HOME);
    } catch (err: any) {
      console.error('Logout error:', err);

      // Clear state even if backend call fails
      clearAuth();
      localStorage.removeItem('token_expires_at');
      navigate(ROUTES.HOME);
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    startOAuthFlow,
    handleOAuthCallback,
    logout,
    isLoading,
    error,
    clearError,
  };
}
```

---

### Step 2.2: Create Token Expiration Hook

**File**: `src/hooks/useTokenExpiration.ts`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

/**
 * Hook to monitor token expiration and auto-logout
 * Checks token expiration every minute
 */
export function useTokenExpiration() {
  const { isAuthenticated, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      const expiresAt = localStorage.getItem('token_expires_at');

      if (!expiresAt) {
        // No expiration time stored, logout for safety
        console.warn('No token expiration time found');
        clearAuth();
        navigate(ROUTES.HOME);
        return;
      }

      const expirationTime = parseInt(expiresAt, 10);
      const now = Date.now();

      // Check if token is expired
      if (now >= expirationTime) {
        console.log('Token expired, logging out');
        clearAuth();
        localStorage.removeItem('token_expires_at');
        navigate(ROUTES.HOME);
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, clearAuth, navigate]);
}
```

---

## Phase 3: Update Page Components

### Step 3.1: Update Landing Page with Real OAuth

**File**: `src/pages/LandingPage.tsx` (replace content)

```typescript
import { useAuth } from '@/hooks/useAuth';
import { env } from '@/config/env';

export const LandingPage = () => {
  const { startOAuthFlow, isLoading, error, clearError } = useAuth();

  const handleGoogleSignIn = async () => {
    await startOAuthFlow('google', env.OAUTH_REDIRECT_URI);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Gold Log</h1>
          <p className="mt-4 text-lg text-gray-600">Track Your Gold Investment</p>

          <div className="mt-8">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redirecting to Google...
                </span>
              ) : (
                <>
                  <svg className="inline-block w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Authentication Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <button
                    onClick={clearError}
                    className="mt-2 text-sm text-red-600 hover:text-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500">
            Secure authentication powered by Google
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
```

---

### Step 3.2: Update OAuth Callback Page

**File**: `src/pages/OAuthCallbackPage.tsx` (replace content)

```typescript
import { useEffect } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const { handleOAuthCallback, isLoading, error } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // Handle OAuth error from provider
    if (errorParam) {
      console.error('OAuth provider error:', errorParam);
      setTimeout(() => navigate(ROUTES.HOME), 2000);
      return;
    }

    // Handle successful OAuth callback
    if (code && state && provider) {
      handleOAuthCallback(code, state, provider);
    } else {
      console.error('Missing OAuth parameters');
      setTimeout(() => navigate(ROUTES.HOME), 2000);
    }
  }, [searchParams, provider, handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="rounded-full bg-red-100 p-3 mx-auto w-16 h-16 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Authentication Failed</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-4 border-blue-600" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          {isLoading ? 'Completing authentication...' : 'Redirecting...'}
        </h2>
        <p className="mt-2 text-gray-600">Please wait while we log you in</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
```

---

### Step 3.3: Update Header with Real Logout

**File**: `src/components/layout/Header.tsx` (update handleLogout)

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { user } = useAuthStore();
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to={ROUTES.DASHBOARD} className="text-xl font-bold text-gray-900">
          Gold Log
        </Link>
        <div className="flex items-center gap-6">
          <Link to={ROUTES.DASHBOARD} className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link to={ROUTES.TRANSACTIONS} className="text-gray-600 hover:text-gray-900">
            Transactions
          </Link>
          <Link to={ROUTES.PROFILE} className="text-gray-600 hover:text-gray-900">
            Profile
          </Link>
          <div className="flex items-center gap-3 border-l pl-6">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.username}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-600">{user?.username || 'User'}</span>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
```

---

## Phase 4: Add Token Expiration Monitoring

### Step 4.1: Add Token Check to Protected Routes

**File**: `src/App.tsx` (update)

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { ROUTES } from './config/routes';
import { useTokenExpiration } from './hooks/useTokenExpiration';

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

// Token expiration wrapper component
function AppContent() {
  useTokenExpiration(); // Monitor token expiration

  return (
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## Phase 5: Error Handling & User Feedback

### Step 5.1: Create Error Boundary

**File**: `src/components/common/ErrorBoundary.tsx`

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-gray-600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
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
```

---

### Step 5.2: Add Toast Notifications (Optional)

**File**: `src/components/common/Toast.tsx`

```typescript
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-50 text-green-800',
    error: 'bg-red-50 text-red-800',
    info: 'bg-blue-50 text-blue-800',
  }[type];

  return (
    <div className={`fixed top-4 right-4 rounded-md p-4 shadow-lg ${bgColor} max-w-sm`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};
```

---

## Phase 6: Testing

### Step 6.1: Test Auth API Module

**File**: `src/api/__tests__/auth.api.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../auth.api';
import { apiClient } from '../client';

vi.mock('../client');

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should return authorization URL and state', async () => {
      const mockResponse = {
        data: {
          authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?...',
          state: 'random-state-token',
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await authApi.getAuthorizationUrl(
        'google',
        'http://localhost:3000/auth/callback/google'
      );

      expect(result).toEqual({
        authorizationUrl: mockResponse.data.authorization_url,
        state: mockResponse.data.state,
      });

      expect(apiClient.get).toHaveBeenCalledWith('/auth/oauth/google/url', {
        params: { redirectUri: 'http://localhost:3000/auth/callback/google' },
      });
    });
  });

  describe('handleOAuthCallback', () => {
    it('should exchange code for token', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'Test User',
            provider: 'google',
            role: 'USER',
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await authApi.handleOAuthCallback('google', {
        code: 'auth-code',
        state: 'state-token',
      });

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe('test@example.com');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/oauth/google/callback', {
        code: 'auth-code',
        state: 'state-token',
      });
    });
  });
});
```

---

### Step 6.2: Test useAuth Hook

**File**: `src/hooks/__tests__/useAuth.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/api/auth.api');
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useAuthStore.getState().clearAuth();
  });

  describe('startOAuthFlow', () => {
    it('should start OAuth flow and redirect', async () => {
      const mockAuthUrl = {
        authorizationUrl: 'https://google.com/oauth',
        state: 'test-state',
      };

      vi.mocked(authApi.getAuthorizationUrl).mockResolvedValue(mockAuthUrl);

      // Mock window.location.href setter
      delete (window as any).location;
      window.location = { href: '' } as any;

      const { result } = renderHook(() => useAuth());

      await result.current.startOAuthFlow('google', 'http://localhost:3000/callback');

      await waitFor(() => {
        expect(sessionStorage.getItem('oauth_state')).toBe('test-state');
        expect(window.location.href).toBe('https://google.com/oauth');
      });
    });

    it('should handle errors during OAuth flow start', async () => {
      vi.mocked(authApi.getAuthorizationUrl).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAuth());

      await result.current.startOAuthFlow('google', 'http://localhost:3000/callback');

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback successfully', async () => {
      const mockLoginResponse = {
        token: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'Test User',
          provider: 'google',
          role: 'USER' as const,
        },
      };

      sessionStorage.setItem('oauth_state', 'test-state');
      vi.mocked(authApi.handleOAuthCallback).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth());

      await result.current.handleOAuthCallback('auth-code', 'test-state', 'google');

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user?.email).toBe('test@example.com');
      });
    });

    it('should reject invalid state token', async () => {
      sessionStorage.setItem('oauth_state', 'correct-state');

      const { result } = renderHook(() => useAuth());

      await result.current.handleOAuthCallback('auth-code', 'wrong-state', 'google');

      await waitFor(() => {
        expect(result.current.error).toContain('Invalid state token');
      });
    });
  });
});
```

---

### Step 6.3: Integration Test for Auth Flow

**File**: `src/test/integration/auth-flow.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { authApi } from '@/api/auth.api';

vi.mock('@/api/auth.api');

describe('Authentication Flow Integration', () => {
  it('should complete full OAuth flow', async () => {
    // Mock API responses
    const mockAuthUrl = {
      authorizationUrl: 'https://google.com/oauth',
      state: 'test-state',
    };

    vi.mocked(authApi.getAuthorizationUrl).mockResolvedValue(mockAuthUrl);

    // Render app
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Verify landing page
    expect(screen.getByText('Gold Log')).toBeInTheDocument();

    // Click sign in button
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });

    // Mock window.location for redirect test
    delete (window as any).location;
    window.location = { href: '' } as any;

    fireEvent.click(signInButton);

    // Wait for OAuth URL to be called
    await waitFor(() => {
      expect(authApi.getAuthorizationUrl).toHaveBeenCalled();
    });
  });
});
```

---

## Phase 7: Security Enhancements

### Step 7.1: Add Security Headers

**File**: `index.html` (update head section)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Security Headers -->
    <meta http-equiv="X-Content-Type-Options" content="nosniff" />
    <meta http-equiv="X-Frame-Options" content="DENY" />
    <meta http-equiv="X-XSS-Protection" content="1; mode=block" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />

    <!-- Content Security Policy -->
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'self';
                   script-src 'self' 'unsafe-inline';
                   style-src 'self' 'unsafe-inline';
                   img-src 'self' data: https:;
                   connect-src 'self' http://localhost:8080 https://accounts.google.com;" />

    <title>Gold Log - Track Your Gold Investment</title>
    <meta name="description" content="Track your gold investment transactions and monitor portfolio performance in real-time." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### Step 7.2: Add Rate Limiting Detection

**File**: `src/utils/rateLimiting.ts`

```typescript
/**
 * Detect rate limiting from API responses
 */
export function isRateLimited(error: any): boolean {
  return error.response?.status === 429;
}

/**
 * Get retry-after time from rate limit response
 */
export function getRetryAfter(error: any): number {
  const retryAfter = error.response?.headers?.['retry-after'];
  if (retryAfter) {
    return parseInt(retryAfter, 10) * 1000; // Convert to milliseconds
  }
  return 60000; // Default to 1 minute
}

/**
 * Format rate limit error message
 */
export function getRateLimitMessage(retryAfterMs: number): string {
  const seconds = Math.ceil(retryAfterMs / 1000);
  return `Too many requests. Please try again in ${seconds} seconds.`;
}
```

---

## Phase 8: Documentation & Verification

### Step 8.1: Update DEVELOPMENT.md

Add OAuth testing section:

```markdown
## Testing OAuth Flow Locally

### Prerequisites

1. Backend running at `http://localhost:8080`
2. Google OAuth credentials configured in backend
3. Redirect URI whitelist includes `http://localhost:3000/auth/callback/google`

### Testing Steps

1. Start frontend: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Sign in with Google"
4. Complete Google OAuth flow
5. Verify redirect to dashboard
6. Check browser console for any errors

### Troubleshooting

**"Invalid redirect URI" error:**
- Verify redirect URI in Google Cloud Console matches exactly
- Check backend OAuth configuration

**"Invalid state token" error:**
- Clear browser storage and try again
- Check that sessionStorage is enabled

**401 errors after login:**
- Verify JWT token in browser DevTools > Application > Local Storage
- Check token expiration time
- Verify backend is accepting the token
```

---

### Step 8.2: Create OAuth Testing Checklist

**File**: `OAUTH_TESTING.md`

```markdown
# OAuth Testing Checklist

## Manual Testing

### Happy Path
- [ ] Click "Sign in with Google" redirects to Google
- [ ] Complete Google authentication successfully
- [ ] Redirect back to application with code and state
- [ ] Token exchange completes successfully
- [ ] User lands on dashboard
- [ ] User information displays correctly
- [ ] Profile picture loads (if available)
- [ ] Navigation works after login
- [ ] Logout clears session and redirects to home

### Error Cases
- [ ] Cancel OAuth flow - redirects back with error
- [ ] Invalid state token - shows error message
- [ ] Expired authorization code - shows error
- [ ] Network error during token exchange - shows error
- [ ] Backend unavailable - shows appropriate error

### Token Management
- [ ] Token stored securely (not in localStorage)
- [ ] Token included in API requests
- [ ] Token expiration detected
- [ ] User logged out when token expires
- [ ] CSRF state token validated correctly

### Security
- [ ] State parameter prevents CSRF
- [ ] No sensitive data in URL after redirect
- [ ] Session cleared on logout
- [ ] 401 errors trigger automatic logout

## Automated Testing

Run test suite:
```bash
npm run test
npm run test:coverage
```

Expected coverage:
- [ ] Auth API module: >90%
- [ ] useAuth hook: >85%
- [ ] OAuth pages: >80%
```

---

### Step 8.3: Final Verification Checklist

```bash
# 1. TypeScript compilation
npx tsc --noEmit
# Expected: No errors

# 2. Linting
npm run lint
# Expected: No errors

# 3. Tests
npm run test
# Expected: All tests pass, including new auth tests

# 4. Build
npm run build
# Expected: Successful build

# 5. Manual OAuth Flow Test
npm run dev
# Test complete OAuth flow manually

# 6. Token Expiration Test
# Login, wait for token to expire (or manually set expired time)
# Verify auto-logout occurs

# 7. Error Handling Test
# Test network errors, invalid states, etc.
# Verify appropriate error messages shown
```

---

## Phase 9: Deployment Preparation

### Step 9.1: Update Environment Variables for Production

**File**: `.env.production`

```bash
# Production API
VITE_API_BASE_URL=https://api.goldlog.com/api/v1

# Production OAuth Redirect
VITE_OAUTH_REDIRECT_URI=https://app.goldlog.com/auth/callback/google

# Environment
VITE_ENVIRONMENT=production
```

**Important**: Update Google OAuth redirect URI whitelist to include production URL.

---

### Step 9.2: Build and Deploy Checklist

```markdown
## Production Deployment Checklist

### Pre-deployment
- [ ] Update `.env.production` with production URLs
- [ ] Add production redirect URI to Google OAuth whitelist
- [ ] Verify backend production API is accessible
- [ ] Run all tests: `npm run test`
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`

### Deployment
- [ ] Deploy built assets to hosting (Vercel, Netlify, etc.)
- [ ] Verify production URL is accessible
- [ ] Test OAuth flow in production
- [ ] Verify API calls to production backend work
- [ ] Check browser console for errors

### Post-deployment
- [ ] Test complete user flow (login → use app → logout)
- [ ] Monitor error logs
- [ ] Verify analytics/monitoring (if configured)
```

---

## Success Metrics

After completing this plan, you should have:

- ✅ **Working OAuth Flow**: Users can authenticate with Google
- ✅ **Secure Token Storage**: JWT tokens stored and managed securely
- ✅ **Token Expiration**: Automatic logout when tokens expire
- ✅ **Error Handling**: Clear error messages for all failure scenarios
- ✅ **CSRF Protection**: State parameter validates OAuth callbacks
- ✅ **Comprehensive Tests**: >85% coverage for auth functionality
- ✅ **Production Ready**: Deployable to production environment

---

## Next Steps

After completing OAuth authentication:

1. **Transaction Management** (plan-transactions.md)
   - Create transaction form
   - List transactions with pagination
   - Delete transactions

2. **Enhanced Features**
   - Remember me functionality
   - Multi-factor authentication
   - Session management across devices

3. **Analytics & Monitoring**
   - Track authentication success rates
   - Monitor OAuth errors
   - User engagement metrics

---

## Troubleshooting

### Common Issues

**Issue**: "Invalid redirect URI" error
- **Solution**: Verify redirect URI matches exactly in Google Console and code

**Issue**: "Invalid state token" error
- **Solution**: Check sessionStorage is working, clear browser cache

**Issue**: Infinite redirect loop
- **Solution**: Check token expiration logic, verify backend returns valid tokens

**Issue**: 401 errors after login
- **Solution**: Verify token format, check backend JWT validation

**Issue**: Token not persisting across page reloads
- **Solution**: Check Zustand persist configuration, verify localStorage

---

## References

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [React Router Auth Guide](https://reactrouter.com/en/main/start/tutorial#authentication)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

---

**Document Status**: Ready for Implementation
**Estimated Time**: 3-4 hours for complete OAuth implementation
**Last Updated**: January 30, 2026
