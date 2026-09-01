interface WeekNavigatorProps {
  week: number;
  season: number;
  weeks: number[];
  currentWeek: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectWeek: (week: number) => void;
  onGoToCurrent: () => void;
  loading?: boolean;
}

export function WeekNavigator({
  week,
  season,
  weeks,
  currentWeek,
  canGoPrev,
  canGoNext,
  isCurrentWeek,
  onPrev,
  onNext,
  onSelectWeek,
  onGoToCurrent,
  loading,
}: WeekNavigatorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev || loading}
          aria-label="Previous week"
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <label htmlFor="week-select" className="sr-only">
            Select week
          </label>
          <select
            id="week-select"
            value={week}
            disabled={loading}
            onChange={(e) => onSelectWeek(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-semibold text-nfl-navy focus:ring-2 focus:ring-nfl-navy outline-none"
          >
            {weeks.map((w) => (
              <option key={w} value={w}>
                Week {w}
                {w === currentWeek ? ' (current)' : ''}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500 whitespace-nowrap">{season} Season</span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || loading}
          aria-label="Next week"
          className="p-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>

      {!isCurrentWeek && (
        <button
          type="button"
          onClick={onGoToCurrent}
          disabled={loading}
          className="text-sm text-nfl-navy font-medium hover:underline disabled:opacity-50 self-start sm:self-auto"
        >
          Jump to current week (Week {currentWeek})
        </button>
      )}
    </div>
  );
}
