import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { ROUTES } from './config/routes';
import { useTokenExpiration } from './hooks/useTokenExpiration';
import { useProactiveTokenRefresh } from './hooks/useProactiveTokenRefresh';
import { setupRefreshTokenInterceptor } from './api/refresh-interceptor';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import GoldPricesPage from './pages/GoldPricesPage';
import ProfilePage from './pages/ProfilePage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { TokenRefreshIndicator } from './hooks/useTokenRefreshStatus';

// App content component to use hooks inside Router context
function AppContent() {
  // Monitor token expiration and auto-logout
  useTokenExpiration();

  // Proactively refresh token before expiration
  useProactiveTokenRefresh();

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
        path={ROUTES.GOLD_PRICES}
        element={
          <MainLayout>
            <GoldPricesPage />
          </MainLayout>
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
  // Setup automatic token refresh on 401 errors (runs once on app load)
  setupRefreshTokenInterceptor();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <TokenRefreshIndicator />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
