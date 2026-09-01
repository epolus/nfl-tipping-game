import { useEffect, useState } from 'react';
import { api, LeaderboardEntry } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [season, setSeason] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getLeaderboard()
      .then(({ season, leaderboard }) => {
        setSeason(season);
        setEntries(leaderboard);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        {season != null && <p className="text-gray-500 mt-1">{season} Season</p>}
      </div>

      {entries.length === 0 ? (
        <p className="text-gray-500">No results yet — tips will appear once games finish.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3 font-medium w-12">#</th>
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 font-medium text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const isMe = entry.userId === user?.id;
                return (
                  <tr
                    key={entry.userId}
                    className={isMe ? 'bg-nfl-navy/5 font-medium' : ''}
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      {entry.displayName}
                      {isMe && <span className="ml-2 text-xs text-nfl-navy">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-nfl-navy">
                      {entry.totalPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
