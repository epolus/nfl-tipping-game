import { useEffect, useState } from 'react';
import { api, GameRecap, ApiError } from '../lib/api';
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
    api
      .getGameRecap(gameId)
      .then(({ recap }) => {
        if (!cancelled) setRecap(recap);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Recap: ${title}`}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Game Recap</div>
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

        <div className="p-4 space-y-4">
          {loading && <LoadingSpinner label="Loading recap..." />}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {!loading && !error && recap && (
            <>
              {recap.video?.videoUrl ? (
                <div className="space-y-2">
                  <video
                    key={recap.video.videoUrl}
                    controls
                    playsInline
                    poster={recap.video.thumbnailUrl ?? undefined}
                    className="w-full rounded-lg bg-black aspect-video"
                    src={recap.video.videoUrl}
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {recap.video.headline}
                      {recap.video.durationSeconds != null && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">
                          {formatDuration(recap.video.durationSeconds)}
                        </span>
                      )}
                    </div>
                    {recap.video.description && (
                      <p className="text-sm text-gray-500 mt-1">{recap.video.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-6 text-center text-sm text-gray-500">
                  No video highlight is available for this game yet.
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
