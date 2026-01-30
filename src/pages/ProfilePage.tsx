import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/config/routes';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      clearAuth();
      navigate(ROUTES.HOME);
    }
  };

  const handleSaveSettings = () => {
    alert('Save Settings feature will be implemented in a future phase!');
  };

  const handleChangePassword = () => {
    alert('Change Password feature will be implemented in a future phase!');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">Manage your account settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={user?.username || 'Test User'}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email || 'test@example.com'}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Provider</label>
                <input
                  type="text"
                  value={user?.provider || 'google'}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={user?.role || 'USER'}
                  disabled
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSaveSettings}
                className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={handleChangePassword}
                className="rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900">Account</h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={handleLogout}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Logout
              </button>
              <button
                onClick={() => alert('Delete Account will be in a future phase')}
                className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Delete Account
              </button>
            </div>
          </div>

          <div className="rounded-lg border bg-blue-50 p-6">
            <h3 className="font-semibold text-blue-900">ℹ️ Note</h3>
            <p className="mt-2 text-sm text-blue-700">
              You're using a mock account for testing. Real OAuth and profile editing will be
              implemented in future phases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
