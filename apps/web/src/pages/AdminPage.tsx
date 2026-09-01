import { useEffect, useState, FormEvent } from 'react';
import { api, User, ApiError } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [syncing, setSyncing] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const loadUsers = () =>
    api
      .getUsers()
      .then(({ users }) => setUsers(users))
      .catch((e) => setError(e.message));

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');
    try {
      await api.createUser(email, displayName, password);
      setEmail('');
      setDisplayName('');
      setPassword('');
      setMessage('User created successfully');
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    await api.updateUser(user.id, { isActive: !user.isActive });
    await loadUsers();
  };

  const handleToggleAdmin = async (user: User) => {
    await api.updateUser(user.id, { isAdmin: !user.isAdmin });
    await loadUsers();
  };

  const handleResetPassword = async (user: User) => {
    const newPassword = prompt(`New password for ${user.displayName}:`);
    if (!newPassword) return;
    await api.updateUser(user.id, { password: newPassword });
    setMessage(`Password reset for ${user.displayName}`);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const result = await api.syncGames();
      const weeks = result.weeksSynced != null ? ` across ${result.weeksSynced} weeks` : '';
      setMessage(`Synced ${result.gamesUpserted} games${weeks} (${result.season ?? ''} season)`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-nfl-navy text-white rounded-lg text-sm font-medium hover:bg-nfl-navy/90 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync NFL Games'}
        </button>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg">{message}</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Create User</h2>
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-none"
          />
          <input
            type="text"
            required
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-none"
          />
          <input
            type="password"
            required
            placeholder="Temporary password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nfl-navy outline-none sm:col-span-2"
          />
          <button
            type="submit"
            disabled={creating}
            className="sm:col-span-2 py-2 bg-nfl-navy text-white rounded-lg font-medium hover:bg-nfl-navy/90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Users ({users.length})</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    {user.displayName}
                    {user.isAdmin && (
                      <span className="ml-1 text-xs bg-nfl-navy/10 text-nfl-navy px-1.5 py-0.5 rounded">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className="text-xs text-gray-600 hover:text-nfl-navy underline"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user)}
                        className="text-xs text-gray-600 hover:text-nfl-navy underline"
                      >
                        {user.isAdmin ? 'Demote' : 'Promote'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-xs text-gray-600 hover:text-nfl-navy underline"
                      >
                        Reset pwd
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
