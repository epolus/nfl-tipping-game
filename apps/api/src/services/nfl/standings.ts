export interface StandingTeam {
  abbreviation: string;
  name: string;
  logoUrl: string | null;
  wins: number;
  losses: number;
  ties: number;
  winPercent: string;
  divisionRecord: string;
  streak: string;
}

export interface DivisionStanding {
  name: string;
  conference: 'AFC' | 'NFC';
  teams: StandingTeam[];
}

export interface StandingsData {
  season: number;
  divisions: DivisionStanding[];
}

const DIVISION_GROUPS: Array<{ group: number; name: string; conference: 'AFC' | 'NFC' }> = [
  { group: 4, name: 'AFC East', conference: 'AFC' },
  { group: 12, name: 'AFC North', conference: 'AFC' },
  { group: 13, name: 'AFC South', conference: 'AFC' },
  { group: 6, name: 'AFC West', conference: 'AFC' },
  { group: 1, name: 'NFC East', conference: 'NFC' },
  { group: 10, name: 'NFC North', conference: 'NFC' },
  { group: 11, name: 'NFC South', conference: 'NFC' },
  { group: 3, name: 'NFC West', conference: 'NFC' },
];

interface EspnStandingEntry {
  team?: {
    abbreviation?: string;
    displayName?: string;
    logos?: Array<{ href?: string; rel?: string[] }>;
  };
  stats?: Array<{ name?: string; displayValue?: string; value?: number }>;
}

interface EspnDivisionStandings {
  name?: string;
  standings?: {
    season?: number;
    entries?: EspnStandingEntry[];
  };
}

function statValue(entry: EspnStandingEntry, name: string): string {
  const stat = entry.stats?.find((s) => s.name === name);
  return stat?.displayValue ?? '0';
}

function statNumber(entry: EspnStandingEntry, name: string): number {
  const stat = entry.stats?.find((s) => s.name === name);
  return stat?.value ?? 0;
}

function parseEntry(entry: EspnStandingEntry): StandingTeam | null {
  const team = entry.team;
  if (!team?.abbreviation) return null;

  const logo =
    team.logos?.find((l) => l.rel?.includes('default'))?.href ??
    team.logos?.[0]?.href ??
    null;

  return {
    abbreviation: team.abbreviation,
    name: team.displayName ?? team.abbreviation,
    logoUrl: logo,
    wins: statNumber(entry, 'wins'),
    losses: statNumber(entry, 'losses'),
    ties: statNumber(entry, 'ties'),
    winPercent: statValue(entry, 'winPercent'),
    divisionRecord: statValue(entry, 'divisionRecord'),
    streak: statValue(entry, 'streak'),
  };
}

async function fetchDivision(group: number): Promise<EspnDivisionStandings> {
  const url = `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?group=${group}&seasontype=2`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN standings error: ${response.status}`);
  }
  return (await response.json()) as EspnDivisionStandings;
}

let cache: { data: StandingsData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function fetchNflStandings(): Promise<StandingsData> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const results = await Promise.all(
    DIVISION_GROUPS.map(async (div) => {
      const data = await fetchDivision(div.group);
      const teams = (data.standings?.entries ?? [])
        .map(parseEntry)
        .filter((t): t is StandingTeam => t != null);
      return {
        name: div.name,
        conference: div.conference,
        teams,
        season: data.standings?.season,
      };
    })
  );

  const season = results.find((r) => r.season != null)?.season ?? new Date().getFullYear();
  const divisions = results.map(({ name, conference, teams }) => ({
    name,
    conference,
    teams,
  }));

  const data: StandingsData = { season, divisions };
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
