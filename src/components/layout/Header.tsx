import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';

export const Header = () => {
  const { user } = useAuthStore();
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to={ROUTES.DASHBOARD} className="text-xl font-bold text-gray-900">
          Gold Log
        </Link>
        <div className="flex items-center gap-6">
          <Link to={ROUTES.DASHBOARD} className="text-gray-600 hover:text-gray-900">
            Dashboard
          </Link>
          <Link to={ROUTES.TRANSACTIONS} className="text-gray-600 hover:text-gray-900">
            Transactions
          </Link>
          <Link to={ROUTES.GOLD_PRICES} className="text-gray-600 hover:text-gray-900">
            Gold Prices
          </Link>
          <Link to={ROUTES.PROFILE} className="text-gray-600 hover:text-gray-900">
            Profile
          </Link>
          <div className="flex items-center gap-3 border-l pl-6">
            <span className="text-sm text-gray-600">{user?.username || 'User'}</span>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};
