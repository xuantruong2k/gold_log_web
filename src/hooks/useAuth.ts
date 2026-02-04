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
  const startOAuthFlow = useCallback(async (provider: string, redirectUri: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get authorization URL from backend
      const { authorizationUrl, state } = await authApi.getAuthorizationUrl(provider, redirectUri);

      // Store state for verification (CSRF protection)
      sessionStorage.setItem('oauth_state', state);

      // Redirect to OAuth provider
      window.location.href = authorizationUrl;
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to start authentication';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

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
        console.log('🔄 Exchanging OAuth code for tokens...');
        const response = await authApi.handleOAuthCallback(provider, {
          code,
          state,
        });
        console.log('✅ OAuth callback successful');

        // Save auth state
        setAuth(response.accessToken, response.user);

        // Calculate token expiration time
        const expiresAt = Date.now() + response.accessTokenExpiresIn * 1000;
        localStorage.setItem('token_expires_at', expiresAt.toString());

        // Save refresh token (always provided by backend)
        localStorage.setItem('refresh_token', response.refreshToken);

        // Save refresh token expiration
        const refreshExpiresAt = Date.now() + response.refreshTokenExpiresIn * 1000;
        localStorage.setItem('refresh_token_expires_at', refreshExpiresAt.toString());

        // Clean up
        sessionStorage.removeItem('oauth_state');

        console.log('✅ Auth state saved, redirecting to dashboard...');

        // Small delay to ensure all state is persisted
        await new Promise(resolve => setTimeout(resolve, 100));

        // Navigate to dashboard
        navigate(ROUTES.DASHBOARD);
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Authentication failed';
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

      const refreshToken = localStorage.getItem('refresh_token');

      // Call backend logout endpoint with refresh token
      await authApi.logout(refreshToken || undefined);

      // Clear local state
      clearAuth();
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('refresh_token_expires_at');
      sessionStorage.removeItem('oauth_state');

      // Navigate to home
      navigate(ROUTES.HOME);
    } catch (err: unknown) {
      console.error('Logout error:', err);

      // Clear state even if backend call fails
      clearAuth();
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('refresh_token_expires_at');
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
