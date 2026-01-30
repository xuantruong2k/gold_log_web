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
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
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
