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
        // No expiration time stored - this might be an old session
        // For safety, we'll logout, but you could also just skip the check
        console.warn('No token expiration time found, logging out for safety');
        clearAuth();
        localStorage.removeItem('token_expires_at');
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
      } else {
        // Token is still valid
        const remainingTime = Math.floor((expirationTime - now) / 1000 / 60);
        console.log(`Token valid for ${remainingTime} more minutes`);
      }
    };

    // Check immediately on mount
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, clearAuth, navigate]);
}
