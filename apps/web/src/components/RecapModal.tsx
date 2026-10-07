import { useEffect, useMemo, useState } from 'react';
import { api, GameRecap, GameRecapVideo, ApiError } from '../lib/api';
import { LoadingSpinner } from './LoadingSpinner';

interface RecapModalProps {
  gameId: string;
  title: string;
  onClose: () => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function RecapModal({ gameId, title, onClose }: RecapModalProps) {
  const [recap, setRecap] = useState<GameRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setActiveId(null);
    api
      .getGameRecap(gameId)
      .then(({ recap }) => {
        if (cancelled) return;
        setRecap(recap);
        setActiveId(recap.video?.id ?? recap.plays[0]?.id ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Failed to load recap');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const playlist = useMemo(() => {
    if (!recap) return [] as GameRecapVideo[];
    const items: GameRecapVideo[] = [];
    if (recap.video) items.push(recap.video);
    for (const play of recap.plays) {
      if (!items.some((v) => v.id === play.id)) items.push(play);
    }
    return items.filter((v) => v.videoUrl);
  }, [recap]);

  const active = playlist.find((v) => v.id === activeId) ?? playlist[0] ?? null;
  const hasHighlights = Boolean(
    recap?.video &&
      (recap.video.coverageType?.toLowerCase().includes('highlight') ||
        recap.plays.length === 0)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Highlights: ${title}`}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Game Highlights</div>
            <h2 className="font-semibold text-gray-900 truncate">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          {loading && <LoadingSpinner label="Loading highlights..." />}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {!loading && !error && recap && (
            <>
              {active?.videoUrl ? (
                <div className="space-y-2">
                  <video
                    key={active.videoUrl}
                    controls
                    playsInline
                    autoPlay
                    poster={active.thumbnailUrl ?? undefined}
                    className="w-full rounded-lg bg-black aspect-video"
                    src={active.videoUrl}
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {active.headline}
                      {active.durationSeconds != null && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          {formatDuration(active.durationSeconds)}
                        </span>
                      )}
                    </div>
                    {active.description && active.description !== active.headline && (
                      <p className="text-sm text-gray-500 mt-1">{active.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-6 text-center text-sm text-gray-500">
                  No game highlight video is available for this game yet.
                  {!hasHighlights && playlist.length === 0 && (
                    <span className="block mt-1">ESPN may still be publishing clips.</span>
                  )}
                </div>
              )}

              {playlist.length > 1 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Plays ({playlist.length})
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {playlist.map((clip) => {
                      const isActive = clip.id === active?.id;
                      return (
                        <button
                          key={clip.id}
                          type="button"
                          onClick={() => setActiveId(clip.id)}
                          className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-nfl-navy/10 text-nfl-navy'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {clip.thumbnailUrl ? (
                            <img
                              src={clip.thumbnailUrl}
                              alt=""
                              className="w-14 h-8 object-cover rounded shrink-0 bg-gray-100"
                            />
                          ) : (
                            <div className="w-14 h-8 rounded bg-gray-100 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{clip.headline}</div>
                            <div className="text-xs text-gray-400">
                              {clip.coverageType?.toLowerCase().includes('highlight')
                                ? 'Full highlights'
                                : 'Play'}
                              {clip.durationSeconds != null &&
                                ` · ${formatDuration(clip.durationSeconds)}`}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recap.headline && (
                <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">{recap.headline}</p>
              )}

              {recap.articleUrl && (
                <a
                  href={recap.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm font-medium text-nfl-navy hover:underline"
                >
                  Read full ESPN recap →
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
