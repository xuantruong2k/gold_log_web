import { apiClient } from './client';
import { useAuthStore } from '@/stores/authStore';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

/**
 * Add refresh token interceptor to automatically refresh expired tokens
 * Call this in your main.tsx or App.tsx
 */
export function setupRefreshTokenInterceptor() {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        // Emit event for UI indicator
        window.dispatchEvent(new CustomEvent('token-refresh-start'));

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          // No refresh token, logout
          useAuthStore.getState().clearAuth();
          window.location.href = '/';
          return Promise.reject(error);
        }

        try {
          // Call refresh endpoint with snake_case payload (matches backend)
          const response = await apiClient.post('/auth/refresh', {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken, access_token_expires_in: expiresIn } = response.data;

          // Update tokens
          useAuthStore.getState().setAuth(access_token, useAuthStore.getState().user!);

          // Update expiration time
          const expiresAt = Date.now() + expiresIn * 1000;
          localStorage.setItem('token_expires_at', expiresAt.toString());

          // Update refresh token (always provided by backend)
          localStorage.setItem('refresh_token', newRefreshToken);

          // Update original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          // Process queued requests
          processQueue(null, access_token);

          console.log('✅ Token auto-refreshed successfully');

          // Emit event for UI indicator
          window.dispatchEvent(new CustomEvent('token-refresh-end'));

          // Retry original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token auto-refresh failed:', refreshError);

          // Emit event for UI indicator
          window.dispatchEvent(new CustomEvent('token-refresh-end'));

          // Refresh failed, logout
          processQueue(refreshError, null);
          useAuthStore.getState().clearAuth();
          localStorage.removeItem('token_expires_at');
          localStorage.removeItem('refresh_token');
          window.location.href = '/';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}
