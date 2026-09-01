import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GameCard } from '../components/GameCard';
import { WeekNavigator } from '../components/WeekNavigator';
import { useWeekGames } from '../hooks/useWeekGames';

export function TippingPage() {
  const {
    week,
    season,
    games,
    tips,
    setTips,
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

  const [savingGameId, setSavingGameId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const handlePick = async (gameId: string, teamId: string) => {
    setSaveError('');
    setSavingGameId(gameId);
    try {
      const existing = tips.find((t) => t.gameId === gameId);
      if (existing) {
        const { tip } = await api.updateTip(existing.id, teamId);
        setTips((prev) => prev.map((t) => (t.id === existing.id ? tip : t)));
      } else {
        const { tip } = await api.createTip(gameId, teamId);
        setTips((prev) => [...prev, tip]);
      }
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save tip');
    } finally {
      setSavingGameId(null);
    }
  };

  if (!weekMeta && loading) return <LoadingSpinner />;
  if (error && !week) return <div className="text-red-600">{error}</div>;
  if (week == null || season == null) return <LoadingSpinner />;

  const tippedCount = tips.length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tips</h1>
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
        <p className="text-gray-500 text-sm">
          {tippedCount}/{games.length} picks made
        </p>
      </div>

      {saveError && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">{saveError}</div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading games..." />
      ) : games.length === 0 ? (
        <p className="text-gray-500">No games for this week. Try another week or ask an admin to sync NFL data.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              tip={tips.find((t) => t.gameId === game.id)}
              onPick={handlePick}
              saving={savingGameId === game.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
