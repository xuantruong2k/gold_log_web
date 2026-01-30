import { useAuth } from '@/hooks/useAuth';
import { env } from '@/config/env';

export const LandingPage = () => {
  const { startOAuthFlow, isLoading, error, clearError } = useAuth();

  const handleGoogleSignIn = async () => {
    await startOAuthFlow('google', env.OAUTH_REDIRECT_URI);
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Gold Log</h1>
        <p className="mt-4 text-lg text-gray-600">Track Your Gold Investment</p>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mt-8 rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full max-w-xs"
        >
          {isLoading ? 'Redirecting to Google...' : 'Sign in with Google'}
        </button>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 max-w-md mx-auto">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <p className="mt-6 text-sm text-gray-500">Secure authentication powered by Google</p>
      </div>
    </div>
  );
};

export default LandingPage;
