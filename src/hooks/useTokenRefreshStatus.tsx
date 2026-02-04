import { useEffect, useState } from 'react';

/**
 * Hook to track token refresh status
 * Shows a subtle notification when token is being refreshed
 */
export function useTokenRefreshStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  useEffect(() => {
    // Listen for custom events from refresh interceptor
    const handleRefreshStart = () => {
      setIsRefreshing(true);
    };

    const handleRefreshEnd = () => {
      setIsRefreshing(false);
      setLastRefreshTime(new Date());
    };

    window.addEventListener('token-refresh-start', handleRefreshStart);
    window.addEventListener('token-refresh-end', handleRefreshEnd);

    return () => {
      window.removeEventListener('token-refresh-start', handleRefreshStart);
      window.removeEventListener('token-refresh-end', handleRefreshEnd);
    };
  }, []);

  return { isRefreshing, lastRefreshTime };
}

/**
 * Visual indicator for token refresh status
 * Shows a small badge when token is being refreshed
 */
export function TokenRefreshIndicator() {
  const { isRefreshing, lastRefreshTime } = useTokenRefreshStatus();

  if (!isRefreshing && !lastRefreshTime) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isRefreshing ? (
        <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>Refreshing session...</span>
        </div>
      ) : lastRefreshTime && Date.now() - lastRefreshTime.getTime() < 3000 ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow-lg animate-fade-in">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Session refreshed</span>
        </div>
      ) : null}
    </div>
  );
}
