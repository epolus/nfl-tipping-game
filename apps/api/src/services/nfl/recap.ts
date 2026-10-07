export interface GameRecapVideo {
  id: string;
  headline: string;
  description: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  videoUrl: string | null;
  espnUrl: string | null;
}

export interface GameRecap {
  externalId: string;
  headline: string | null;
  articleUrl: string | null;
  video: GameRecapVideo | null;
}

interface EspnVideo {
  id?: number | string;
  headline?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
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

function parseVideo(video: EspnVideo | undefined): GameRecapVideo | null {
  if (!video?.id && !video?.headline) return null;
  return {
    id: String(video.id ?? ''),
    headline: video.headline ?? 'Game recap',
    description: video.description ?? null,
    thumbnailUrl: video.thumbnail ?? null,
    durationSeconds: video.duration ?? null,
    videoUrl: pickVideoUrl(video),
    espnUrl: video.links?.web?.href ?? null,
  };
}

function firstVideo(summary: EspnSummary): EspnVideo | undefined {
  if (summary.videos?.length) return summary.videos[0];
  const artVideo = summary.article?.video;
  if (Array.isArray(artVideo) && artVideo.length) return artVideo[0];
  if (artVideo && !Array.isArray(artVideo)) return artVideo;
  return undefined;
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
  const video = parseVideo(firstVideo(summary));

  const data: GameRecap = {
    externalId,
    headline: article?.headline ?? video?.headline ?? null,
    articleUrl: article?.links?.web?.href ?? `https://www.espn.com/nfl/recap?gameId=${externalId}`,
    video,
  };

  // Only cache when we got something useful — empty early so later retries can pick up late-published videos
  if (data.video || data.headline) {
    cache.set(externalId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return data;
}
