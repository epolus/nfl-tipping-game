import { FormEvent, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export function AccountPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      setError('New password must be different from the current password');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-gray-500 mt-1">
          {user?.displayName}
          {user?.email ? ` · ${user.email}` : ''}
        </p>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Change password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">{success}</div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-none"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">At least {MIN_PASSWORD_LENGTH} characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-nfl-navy text-white font-medium rounded-lg hover:bg-nfl-navy/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
