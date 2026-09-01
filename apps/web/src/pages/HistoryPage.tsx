import { useEffect, useState } from 'react';
import { api, Tip } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatKickoff } from '../lib/api';

export function HistoryPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getMyTips()
      .then(({ tips }) => setTips(tips))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">{error}</div>;

  const byWeek = tips.reduce<Record<string, Tip[]>>((acc, tip) => {
    const key = `Week ${tip.game.week} (${tip.game.season})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tip);
    return acc;
  }, {});

  const totalPoints = tips.reduce((sum, t) => sum + (t.pointsEarned ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">My Tip History</h1>
        <div className="text-lg font-semibold text-nfl-navy">{totalPoints} total points</div>
      </div>

      {tips.length === 0 ? (
        <p className="text-gray-500">No tips submitted yet.</p>
      ) : (
        Object.entries(byWeek).map(([weekLabel, weekTips]) => {
          const weekPoints = weekTips.reduce((s, t) => s + (t.pointsEarned ?? 0), 0);
          return (
            <div key={weekLabel} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{weekLabel}</h2>
                <span className="text-sm text-gray-500">{weekPoints} pts</span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {weekTips.map((tip) => (
                  <div key={tip.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        {tip.game.awayTeam.nflAbbreviation} @ {tip.game.homeTeam.nflAbbreviation}
                      </div>
                      <div className="text-xs text-gray-500">{formatKickoff(tip.game.kickoff)}</div>
                    </div>
                    <div className="text-sm">
                      Picked: <span className="font-medium">{tip.pickedTeam.nflAbbreviation}</span>
                    </div>
                    {tip.game.status === 'FINAL' ? (
                      <span
                        className={`text-sm font-medium px-2 py-0.5 rounded ${
                          tip.isCorrect
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tip.isCorrect ? '+1 pt' : 'Miss'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">{tip.game.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
