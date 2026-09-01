import { GameStatus } from '@prisma/client';
import { NflDataProvider, NflGameData } from './types';

interface EspnTeam {
  id?: string;
  abbreviation?: string;
  displayName?: string;
  logo?: string;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: EspnTeam;
}

interface EspnEvent {
  id?: string;
  date?: string;
  status?: { type?: { name?: string; state?: string; completed?: boolean } };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
  }>;
}

interface EspnScoreboard {
  week?: { number?: number };
  season?: { year?: number };
  events?: EspnEvent[];
}

function mapEspnStatus(event: EspnEvent): GameStatus {
  const state = event.status?.type?.state?.toLowerCase();
  const name = event.status?.type?.name?.toLowerCase() ?? '';

  if (event.status?.type?.completed || name.includes('final') || state === 'post') {
    return GameStatus.FINAL;
  }
  if (state === 'in' || name.includes('in progress') || name.includes('halftime')) {
    return GameStatus.LIVE;
  }
  return GameStatus.SCHEDULED;
}

function parseCompetitor(comp: EspnCompetitor | undefined) {
  if (!comp?.team?.abbreviation) return null;
  return {
    abbreviation: comp.team.abbreviation,
    name: comp.team.displayName ?? comp.team.abbreviation,
    logoUrl: comp.team.logo ?? null,
    score: comp.score != null ? parseInt(comp.score, 10) : null,
    isWinner: comp.winner === true,
    homeAway: comp.homeAway,
  };
}

function parseEvent(event: EspnEvent, week: number, season: number): NflGameData | null {
  if (!event.id || !event.date) return null;

  const competitors = event.competitions?.[0]?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === 'home');
  const away = competitors.find((c) => c.homeAway === 'away');

  const homeParsed = parseCompetitor(home);
  const awayParsed = parseCompetitor(away);
  if (!homeParsed || !awayParsed) return null;

  const status = mapEspnStatus(event);
  let winnerAbbreviation: string | null = null;
  if (status === GameStatus.FINAL) {
    if (homeParsed.isWinner) winnerAbbreviation = homeParsed.abbreviation;
    else if (awayParsed.isWinner) winnerAbbreviation = awayParsed.abbreviation;
    else if (homeParsed.score != null && awayParsed.score != null) {
      if (homeParsed.score > awayParsed.score) winnerAbbreviation = homeParsed.abbreviation;
      else if (awayParsed.score > homeParsed.score) winnerAbbreviation = awayParsed.abbreviation;
    }
  }

  return {
    externalId: event.id,
    week,
    season,
    kickoff: new Date(event.date),
    homeAbbreviation: homeParsed.abbreviation,
    homeName: homeParsed.name,
    homeLogoUrl: homeParsed.logoUrl,
    awayAbbreviation: awayParsed.abbreviation,
    awayName: awayParsed.name,
    awayLogoUrl: awayParsed.logoUrl,
    homeScore: homeParsed.score,
    awayScore: awayParsed.score,
    status,
    winnerAbbreviation,
  };
}

export class EspnProvider implements NflDataProvider {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

  private async fetchRaw(week?: number, season?: number): Promise<EspnScoreboard> {
    const params = new URLSearchParams();
    if (week != null) params.set('week', String(week));
    if (season != null) {
      params.set('seasontype', '2'); // regular season
      params.set('year', String(season));
    }

    const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as EspnScoreboard;
  }

  async fetchSeasonInfo(): Promise<{ season: number; currentWeek: number }> {
    const data = await this.fetchRaw();
    return {
      season: data.season?.year ?? new Date().getFullYear(),
      currentWeek: data.week?.number ?? 1,
    };
  }

  async fetchScoreboard(week?: number, season?: number): Promise<NflGameData[]> {
    const data = await this.fetchRaw(week, season);
    const resolvedWeek = week ?? data.week?.number ?? 1;
    const resolvedSeason = season ?? data.season?.year ?? new Date().getFullYear();

    const games: NflGameData[] = [];
    for (const event of data.events ?? []) {
      const parsed = parseEvent(event, resolvedWeek, resolvedSeason);
      if (parsed) games.push(parsed);
    }
    return games;
  }
}

export function getNflProvider(): NflDataProvider {
  const provider = process.env.NFL_DATA_PROVIDER ?? 'espn';
  switch (provider) {
    case 'espn':
      return new EspnProvider();
    default:
      console.warn(`Unknown NFL_DATA_PROVIDER "${provider}", falling back to ESPN`);
      return new EspnProvider();
  }
}
