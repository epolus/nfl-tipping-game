export interface GameRecapVideo {
  id: string;
  headline: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  videoUrl: string | null;
  espnUrl: string | null;
  coverageType: string | null;
}

export interface GameRecap {
  externalId: string;
  headline: string | null;
  articleUrl: string | null;
  /** Condensed game highlights reel when available */
  video: GameRecapVideo | null;
  /** Individual scoring / key play clips */
  plays: GameRecapVideo[];
}

interface EspnVideo {
  id?: number | string;
  headline?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  tracking?: {
    coverageType?: string;
    trackingName?: string;
  };
  links?: {
    source?: {
      href?: string;
      HD?: { href?: string };
      mezzanine?: { href?: string };
      HLS?: { href?: string };
    };
    web?: { href?: string };
  };
}

interface EspnSummary {
  article?: {
    headline?: string;
    links?: { web?: { href?: string } };
    video?: EspnVideo | EspnVideo[];
  };
  videos?: EspnVideo[];
}

const cache = new Map<string, { data: GameRecap; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function pickVideoUrl(video: EspnVideo): string | null {
  const source = video.links?.source;
  return (
    source?.HD?.href ??
    source?.mezzanine?.href ??
    source?.href ??
    source?.HLS?.href ??
    null
  );
}

function coverageType(video: EspnVideo): string {
  return (video.tracking?.coverageType ?? '').trim();
}

function trackingName(video: EspnVideo): string {
  return (video.tracking?.trackingName ?? '').toLowerCase();
}

function isPlayable(video: EspnVideo): boolean {
  return Boolean(pickVideoUrl(video) && (video.id || video.headline));
}

function isGameHighlight(video: EspnVideo): boolean {
  const type = coverageType(video).toLowerCase();
  const name = trackingName(video);
  return (
    type === 'final game highlight' ||
    type.includes('game highlight') ||
    name.includes('highlight') && !name.includes('instantanalysis') && !name.includes('one-play')
  );
}

function isOnePlay(video: EspnVideo): boolean {
  const type = coverageType(video).toLowerCase();
  const name = trackingName(video);
  return type === 'oneplay' || name.includes('one-play');
}

function isAnalysisOrTalk(video: EspnVideo): boolean {
  const type = coverageType(video).toLowerCase();
  const name = trackingName(video);
  return (
    type.includes('instantanalysis') ||
    type === 'misc' ||
    name.includes('instantanalysis') ||
    name.includes('analysis')
  );
}

function parseVideo(video: EspnVideo): GameRecapVideo | null {
  if (!isPlayable(video)) return null;
  return {
    id: String(video.id ?? ''),
    headline: video.headline ?? 'Game highlight',
    description: video.description ?? null,
    thumbnailUrl: video.thumbnail ?? null,
    durationSeconds: video.duration ?? null,
    videoUrl: pickVideoUrl(video),
    espnUrl: video.links?.web?.href ?? null,
    coverageType: coverageType(video) || null,
  };
}

function collectVideos(summary: EspnSummary): EspnVideo[] {
  const fromList = summary.videos ?? [];
  const artVideo = summary.article?.video;
  const fromArticle = Array.isArray(artVideo)
    ? artVideo
    : artVideo
      ? [artVideo]
      : [];

  const seen = new Set<string>();
  const all: EspnVideo[] = [];
  for (const v of [...fromList, ...fromArticle]) {
    const key = String(v.id ?? v.headline ?? '');
    if (!key || seen.has(key) || !isPlayable(v)) continue;
    seen.add(key);
    all.push(v);
  }
  return all;
}

function selectVideos(all: EspnVideo[]): {
  video: GameRecapVideo | null;
  plays: GameRecapVideo[];
} {
  const highlights = all.filter(isGameHighlight).map(parseVideo).filter((v): v is GameRecapVideo => v != null);
  const plays = all.filter(isOnePlay).map(parseVideo).filter((v): v is GameRecapVideo => v != null);

  // Prefer full game highlight reel; otherwise first play clip; never analysis as primary
  let video: GameRecapVideo | null = highlights[0] ?? plays[0] ?? null;

  if (!video) {
    const fallback = all.find((v) => !isAnalysisOrTalk(v)) ?? all[0];
    video = fallback ? parseVideo(fallback) : null;
  }

  // Don't duplicate the primary video in the plays list
  const playsFiltered = plays.filter((p) => p.id !== video?.id);

  return { video, plays: playsFiltered };
}

export async function fetchGameRecap(externalId: string): Promise<GameRecap> {
  const cached = cache.get(externalId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${encodeURIComponent(externalId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN summary error: ${response.status}`);
  }

  const summary = (await response.json()) as EspnSummary;
  const article = summary.article;
  const { video, plays } = selectVideos(collectVideos(summary));

  const data: GameRecap = {
    externalId,
    headline: article?.headline ?? video?.headline ?? null,
    articleUrl: article?.links?.web?.href ?? `https://www.espn.com/nfl/recap?gameId=${externalId}`,
    video,
    plays,
  };

  // Cache highlights; also cache empty-ish responses briefly so we retry later for late videos
  const ttl = data.video || data.plays.length > 0 ? CACHE_TTL_MS : 5 * 60 * 1000;
  cache.set(externalId, { data, expiresAt: Date.now() + ttl });

  return data;
}
