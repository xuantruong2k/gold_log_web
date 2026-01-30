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
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8080/api/v1'),
    'import.meta.env.VITE_OAUTH_REDIRECT_URI': JSON.stringify(
      'http://localhost:3000/auth/callback/google'
    ),
    'import.meta.env.VITE_ENVIRONMENT': JSON.stringify('test'),
  },
});
