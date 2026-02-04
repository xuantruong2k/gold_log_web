import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/api/client';

/**
 * Proactively refresh token before it expires
 * Checks every 5 minutes and refreshes if token will expire in next 10 minutes
 */
export function useProactiveTokenRefresh() {
  const { token, user, setAuth, clearAuth } = useAuthStore();

  const refreshToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token');

    if (!storedRefreshToken) {
      console.log('⚠️ No refresh token available');
      return false;
    }

    try {
      console.log('🔄 Proactively refreshing token...');

      const response = await apiClient.post('/auth/refresh', {
        refresh_token: storedRefreshToken,
      });

      const { access_token: newToken, refresh_token: newRefreshToken, access_token_expires_in: expiresIn } = response.data;

      // Update auth state
      if (user) {
        setAuth(newToken, user);
      }

      // Update expiration time
      const expiresAt = Date.now() + expiresIn * 1000;
      localStorage.setItem('token_expires_at', expiresAt.toString());

      // Update refresh token (always provided by backend)
      localStorage.setItem('refresh_token', newRefreshToken);

      console.log('✅ Token refreshed successfully (proactive)');
      return true;
    } catch (error) {
      console.error('❌ Proactive token refresh failed:', error);

      // If refresh fails, clear auth and redirect to login
      clearAuth();
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('refresh_token');
      window.location.href = '/';
      return false;
    }
  }, [user, setAuth, clearAuth]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const checkAndRefresh = async () => {
      const expiresAtStr = localStorage.getItem('token_expires_at');

      if (!expiresAtStr) {
        return;
      }

      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      const timeRemaining = expiresAt - now;

      // Refresh if token expires in less than 10 minutes (600,000 ms)
      const REFRESH_THRESHOLD = 10 * 60 * 1000;

      if (timeRemaining > 0 && timeRemaining < REFRESH_THRESHOLD) {
        const minutesRemaining = Math.floor(timeRemaining / 60000);
        console.log(
          `⏰ Token expires in ${minutesRemaining} minutes, refreshing proactively...`
        );
        await refreshToken();
      }
    };

    // Check immediately
    checkAndRefresh();

    // Then check every 5 minutes
    const intervalId = setInterval(checkAndRefresh, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [token, refreshToken]);
}
