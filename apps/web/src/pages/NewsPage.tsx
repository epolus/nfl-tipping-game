import { useEffect, useState } from 'react';
import { api, NewsArticle } from '../lib/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

function formatPublished(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function NewsItem({ article }: { article: NewsArticle }) {
  const meta = [article.byline, formatPublished(article.published)].filter(Boolean).join(' · ');
  const body = (
    <>
      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt=""
          className="w-full sm:w-44 h-40 sm:h-28 object-cover shrink-0 bg-gray-100 dark:bg-gray-800"
          loading="lazy"
        />
      )}
      <div className="flex-1 min-w-0 p-4">
        <h2 className="font-semibold text-gray-900 leading-snug dark:text-gray-100">
          {article.headline}
        </h2>
        {article.description && article.description !== article.headline && (
          <p className="mt-1.5 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
            {article.description}
          </p>
        )}
        {(meta || article.teams.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            {meta && <span>{meta}</span>}
            {article.teams.map((team) => (
              <span
                key={team}
                className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                {team}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const className =
    'flex flex-col sm:flex-row overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition-colors hover:border-nfl-navy/30 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-sky-500/40';

  if (article.articleUrl) {
    return (
      <a
        href={article.articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {body}
      </a>
    );
  }

  return <div className={className}>{body}</div>;
}

export function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { articles: next } = await api.getNews(30);
        if (!cancelled) setArticles(next);
      } catch {
        if (!cancelled) setError('News unavailable right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">NFL News</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Latest headlines from ESPN. Stories open on ESPN.
        </p>
      </div>

      {error && <p className="text-gray-500 dark:text-gray-400">{error}</p>}

      {!error && articles.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No news articles right now.</p>
      )}

      <div className="space-y-3">
        {articles.map((article) => (
          <NewsItem key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
