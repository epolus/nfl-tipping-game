export interface NewsArticle {
  id: string;
  headline: string;
  description: string | null;
  published: string | null;
  byline: string | null;
  imageUrl: string | null;
  articleUrl: string | null;
  type: string | null;
  teams: string[];
}

interface EspnNewsImage {
  url?: string;
  width?: number;
  height?: number;
}

interface EspnNewsCategory {
  type?: string;
  description?: string;
  team?: { abbreviation?: string; shortDisplayName?: string; description?: string };
}

interface EspnNewsArticle {
  id?: number | string;
  type?: string;
  headline?: string;
  description?: string;
  published?: string;
  byline?: string;
  premium?: boolean;
  images?: EspnNewsImage[];
  categories?: EspnNewsCategory[];
  links?: { web?: { href?: string } };
}

interface EspnNewsResponse {
  articles?: EspnNewsArticle[];
}

const NEWS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news';
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { fetchedAt: number; articles: NewsArticle[] } | null = null;

function pickImage(images: EspnNewsImage[] | undefined): string | null {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  return sorted.find((img) => img.url)?.url ?? null;
}

function pickTeams(categories: EspnNewsCategory[] | undefined): string[] {
  if (!categories?.length) return [];
  const teams = categories
    .filter((c) => c.type === 'team')
    .map((c) => c.team?.abbreviation ?? c.team?.shortDisplayName ?? c.description)
    .filter((name): name is string => Boolean(name));
  return [...new Set(teams)];
}

function mapArticle(article: EspnNewsArticle): NewsArticle | null {
  if (article.id == null || !article.headline) return null;
  if (article.premium) return null;

  return {
    id: String(article.id),
    headline: article.headline,
    description: article.description?.trim() || null,
    published: article.published ?? null,
    byline: article.byline?.trim() || null,
    imageUrl: pickImage(article.images),
    articleUrl: article.links?.web?.href ?? null,
    type: article.type ?? null,
    teams: pickTeams(article.categories),
  };
}

export async function fetchNflNews(limit = 25): Promise<NewsArticle[]> {
  const capped = Math.min(Math.max(limit, 1), 50);
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.articles.slice(0, capped);
  }

  const res = await fetch(`${NEWS_URL}?limit=${capped}`);
  if (!res.ok) {
    throw new Error(`ESPN news request failed: ${res.status}`);
  }

  const data = (await res.json()) as EspnNewsResponse;
  const articles = (data.articles ?? [])
    .map(mapArticle)
    .filter((a): a is NewsArticle => a != null);

  cache = { fetchedAt: Date.now(), articles };
  return articles.slice(0, capped);
}
