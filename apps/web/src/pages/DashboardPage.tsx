import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GameCard } from '../components/GameCard';
import { WeekNavigator } from '../components/WeekNavigator';
import { useWeekGames } from '../hooks/useWeekGames';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const {
    week,
    season,
    games,
    tips,
    weekMeta,
    loading,
    error,
    goPrev,
    goNext,
    goToWeek,
    goToCurrent,
    canGoPrev,
    canGoNext,
    isCurrentWeek,
  } = useWeekGames();

  if (!weekMeta && loading) return <LoadingSpinner />;
  if (error && !week) return <div className="text-red-600">{error}</div>;
  if (week == null || season == null) return <LoadingSpinner />;

  const tippedCount = tips.length;
  const totalGames = games.length;
  const weekPoints = tips.filter((t) => t.isCorrect).length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <WeekNavigator
          week={week}
          season={season}
          weeks={weekMeta?.weeks ?? [week]}
          currentWeek={weekMeta?.currentWeek ?? week}
          canGoPrev={!!canGoPrev}
          canGoNext={!!canGoNext}
          isCurrentWeek={!!isCurrentWeek}
          onPrev={goPrev}
          onNext={goNext}
          onSelectWeek={goToWeek}
          onGoToCurrent={goToCurrent}
          loading={loading}
        />
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Games This Week" value={String(totalGames)} />
          <StatCard label="Tips Submitted" value={`${tippedCount}/${totalGames}`} />
          <StatCard label="Points This Week" value={String(weekPoints)} />
        </div>
      )}

      {!isAdmin && tippedCount < totalGames && totalGames > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
          You have {totalGames - tippedCount} game{totalGames - tippedCount !== 1 ? 's' : ''} left
          to tip.{' '}
          <Link to={`/tips?week=${week}`} className="font-semibold underline">
            Submit your picks →
          </Link>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Week {week} Games</h2>
        {loading ? (
          <LoadingSpinner label="Loading games..." />
        ) : games.length === 0 ? (
          <p className="text-gray-500">No games for this week. Try another week or ask an admin to sync NFL data.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {(isAdmin ? games : games.slice(0, 4)).map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  tip={isAdmin ? undefined : tips.find((t) => t.gameId === game.id)}
                  onPick={() => {}}
                />
              ))}
            </div>
            {!isAdmin && games.length > 4 && (
              <Link to={`/tips?week=${week}`} className="inline-block mt-4 text-nfl-navy font-medium hover:underline">
                View all {games.length} games →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-nfl-navy mt-1">{value}</div>
    </div>
  );
}
