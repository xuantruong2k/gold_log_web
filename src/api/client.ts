import axios, { AxiosError } from 'axios';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';

export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds to handle slow OAuth responses
  withCredentials: false, // Ensure cookies are not sent unless needed
});

// Request interceptor - Add auth token to requests
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

// Note: 401 handling is done in refresh-interceptor.ts
// Do NOT add 401 interceptor here as it will conflict with auto-refresh logic
