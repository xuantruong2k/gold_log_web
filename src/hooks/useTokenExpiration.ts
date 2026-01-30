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
