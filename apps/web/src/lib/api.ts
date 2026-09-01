const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? 'Request failed', res.status);
  }
  return data as T;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  nflAbbreviation: string;
  name: string;
  logoUrl: string | null;
}

export interface Game {
  id: string;
  externalId: string;
  week: number;
  season: number;
  kickoff: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINAL';
  winnerTeamId: string | null;
  homeTeam: Team;
  awayTeam: Team;
  winnerTeam?: Team | null;
}

export interface Tip {
  id: string;
  userId: string;
  gameId: string;
  pickedTeamId: string;
  createdAt: string;
  updatedAt: string;
  pickedTeam: Team;
  game: Game;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  email: string;
  totalPoints: number;
  lastWeekPoints: number;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ user: User }>('/api/me'),

  getGames: (week?: number, season?: number) => {
    const params = new URLSearchParams();
    if (week != null) params.set('week', String(week));
    if (season != null) params.set('season', String(season));
    const qs = params.toString();
    return request<{ games: Game[]; week: number; season: number }>(
      `/api/games${qs ? `?${qs}` : ''}`
    );
  },

  getGameWeeks: (season?: number) => {
    const params = season != null ? `?season=${season}` : '';
    return request<{ season: number; weeks: number[]; currentWeek: number }>(
      `/api/games/weeks${params}`
    );
  },

  getMyTips: (week?: number, season?: number) => {
    const params = new URLSearchParams();
    if (week != null) params.set('week', String(week));
    if (season != null) params.set('season', String(season));
    const qs = params.toString();
    return request<{ tips: Tip[] }>(`/api/tips/me${qs ? `?${qs}` : ''}`);
  },

  createTip: (gameId: string, pickedTeamId: string) =>
    request<{ tip: Tip }>('/api/tips', {
      method: 'POST',
      body: JSON.stringify({ gameId, pickedTeamId }),
    }),

  updateTip: (id: string, pickedTeamId: string) =>
    request<{ tip: Tip }>(`/api/tips/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ pickedTeamId }),
    }),

  getLeaderboard: (season?: number) => {
    const params = season != null ? `?season=${season}` : '';
    return request<{ season: number; leaderboard: LeaderboardEntry[] }>(
      `/api/leaderboard${params}`
    );
  },

  getUsers: () => request<{ users: User[] }>('/api/admin/users'),

  createUser: (email: string, displayName: string, password: string) =>
    request<{ user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, displayName, password }),
    }),

  updateUser: (
    id: string,
    data: Partial<{ displayName: string; password: string; isActive: boolean; isAdmin: boolean }>
  ) =>
    request<{ user: User }>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  syncGames: () =>
    request<{ ok: boolean; gamesUpserted: number; fetched: number; weeksSynced?: number; season?: number }>(
      '/api/admin/sync-games',
      { method: 'POST' }
    ),
};

export function isGameLocked(kickoff: string): boolean {
  return new Date() >= new Date(kickoff);
}

export function formatKickoff(kickoff: string): string {
  return new Date(kickoff).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeUntilKickoff(kickoff: string): string {
  const diff = new Date(kickoff).getTime() - Date.now();
  if (diff <= 0) return 'Locked';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
