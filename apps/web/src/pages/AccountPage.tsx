import { FormEvent, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ThemeMode, useTheme } from '../context/ThemeContext';

const MIN_PASSWORD_LENGTH = 8;

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; hint: string }> = [
  { value: 'light', label: 'Light', hint: 'Always light' },
  { value: 'dark', label: 'Dark', hint: 'Always dark' },
  { value: 'system', label: 'System', hint: 'Match device' },
];

export function AccountPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
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
        <p className="text-gray-500 mt-1 dark:text-gray-400">
          {user?.displayName}
          {user?.email ? ` · ${user.email}` : ''}
        </p>
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`px-3 py-3 rounded-lg border text-center transition-colors ${
                  selected
                    ? 'border-nfl-navy bg-nfl-navy/5 text-nfl-navy dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-300'
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                }`}
              >
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{option.hint}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs dark:bg-gray-900 dark:border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Change password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg dark:bg-green-950/50 dark:text-green-300">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-hidden dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-600"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-hidden dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-600"
            />
            <p className="text-xs text-gray-400 mt-1">At least {MIN_PASSWORD_LENGTH} characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-hidden dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-sky-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-nfl-navy text-white font-medium rounded-lg hover:bg-nfl-navy/90 disabled:opacity-50 transition-colors dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            {submitting ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
