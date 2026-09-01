import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, Game, Tip } from '../lib/api';

interface WeekMeta {
  season: number;
  weeks: number[];
  currentWeek: number;
}

export function useWeekGames() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [weekMeta, setWeekMeta] = useState<WeekMeta | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWeekData = useCallback(async (targetWeek: number, targetSeason: number) => {
    const [gamesRes, tipsRes] = await Promise.all([
      api.getGames(targetWeek, targetSeason),
      api.getMyTips(targetWeek, targetSeason),
    ]);
    setGames(gamesRes.games);
    setTips(tipsRes.tips);
    setWeek(gamesRes.week);
    setSeason(gamesRes.season);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meta = await api.getGameWeeks();
        if (cancelled) return;
        setWeekMeta(meta);

        const weekParam = searchParams.get('week');
        const initialWeek =
          weekParam && meta.weeks.includes(parseInt(weekParam, 10))
            ? parseInt(weekParam, 10)
            : meta.currentWeek;

        await loadWeekData(initialWeek, meta.season);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load games');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only load on mount
  }, [loadWeekData]);

  const goToWeek = useCallback(
    async (targetWeek: number) => {
      if (!weekMeta || !season) return;
      setSearchParams({ week: String(targetWeek) }, { replace: true });
      setLoading(true);
      setError('');
      try {
        await loadWeekData(targetWeek, season);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load week');
      } finally {
        setLoading(false);
      }
    },
    [weekMeta, season, loadWeekData, setSearchParams]
  );

  const goPrev = () => {
    if (!weekMeta || week == null) return;
    const idx = weekMeta.weeks.indexOf(week);
    if (idx > 0) goToWeek(weekMeta.weeks[idx - 1]);
  };

  const goNext = () => {
    if (!weekMeta || week == null) return;
    const idx = weekMeta.weeks.indexOf(week);
    if (idx >= 0 && idx < weekMeta.weeks.length - 1) goToWeek(weekMeta.weeks[idx + 1]);
  };

  const goToCurrent = () => {
    if (!weekMeta) return;
    goToWeek(weekMeta.currentWeek);
  };

  const canGoPrev = weekMeta && week != null && weekMeta.weeks.indexOf(week) > 0;
  const canGoNext =
    weekMeta &&
    week != null &&
    weekMeta.weeks.indexOf(week) >= 0 &&
    weekMeta.weeks.indexOf(week) < weekMeta.weeks.length - 1;
  const isCurrentWeek = weekMeta != null && week === weekMeta.currentWeek;

  const refreshTips = useCallback(async () => {
    if (week == null || season == null) return;
    const { tips: fresh } = await api.getMyTips(week, season);
    setTips(fresh);
  }, [week, season]);

  return {
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
    refreshTips,
  };
}
