import { prisma } from '../lib/prisma';
import { getNflProvider, NflGameData } from '../services/nfl';

const REGULAR_SEASON_WEEKS = 18;

export interface SyncOptions {
  week?: number;
  season?: number;
  /** When true, sync every week of the regular season (used by admin manual sync). */
  allWeeks?: boolean;
}

export interface SyncResult {
  ok: true;
  teamsUpserted: number;
  gamesUpserted: number;
  fetched: number;
  weeksSynced?: number;
  season?: number;
}

async function upsertTeam(abbreviation: string, name: string, logoUrl: string | null) {
  return prisma.team.upsert({
    where: { nflAbbreviation: abbreviation },
    create: { nflAbbreviation: abbreviation, name, logoUrl },
    update: { name, logoUrl },
  });
}

async function upsertGame(data: NflGameData, homeTeamId: string, awayTeamId: string) {
  const existing = await prisma.game.findUnique({
    where: { externalId: data.externalId },
    include: { tips: { take: 1 } },
  });

  let winnerTeamId: string | null = null;
  if (data.winnerAbbreviation) {
    const winner = await prisma.team.findUnique({
      where: { nflAbbreviation: data.winnerAbbreviation },
    });
    winnerTeamId = winner?.id ?? null;
  }

  const kickoffUpdate =
    existing && existing.tips.length > 0 ? {} : { kickoff: data.kickoff };

  if (existing) {
    return prisma.game.update({
      where: { externalId: data.externalId },
      data: {
        week: data.week,
        season: data.season,
        ...kickoffUpdate,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        status: data.status,
        winnerTeamId,
      },
    });
  }

  return prisma.game.create({
    data: {
      externalId: data.externalId,
      week: data.week,
      season: data.season,
      kickoff: data.kickoff,
      homeTeamId,
      awayTeamId,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: data.status,
      winnerTeamId,
    },
  });
}

async function processGames(games: NflGameData[]): Promise<Pick<SyncResult, 'teamsUpserted' | 'gamesUpserted' | 'fetched'>> {
  let teamsUpserted = 0;
  let gamesUpserted = 0;

  for (const gameData of games) {
    await upsertTeam(gameData.homeAbbreviation, gameData.homeName, gameData.homeLogoUrl);
    await upsertTeam(gameData.awayAbbreviation, gameData.awayName, gameData.awayLogoUrl);
    teamsUpserted += 2;

    const homeTeam = await prisma.team.findUnique({
      where: { nflAbbreviation: gameData.homeAbbreviation },
    });
    const awayTeam = await prisma.team.findUnique({
      where: { nflAbbreviation: gameData.awayAbbreviation },
    });

    if (!homeTeam || !awayTeam) continue;

    await upsertGame(gameData, homeTeam.id, awayTeam.id);
    gamesUpserted += 1;
  }

  return { teamsUpserted, gamesUpserted, fetched: games.length };
}

async function syncSingleWeek(week?: number, season?: number): Promise<SyncResult> {
  const provider = getNflProvider();
  const games = await provider.fetchScoreboard(week, season);
  const result = await processGames(games);
  return { ok: true, ...result };
}

async function syncAllSeasonWeeks(season?: number): Promise<SyncResult> {
  const provider = getNflProvider();
  const seasonInfo = await provider.fetchSeasonInfo();
  const targetSeason = season ?? seasonInfo.season;

  let teamsUpserted = 0;
  let gamesUpserted = 0;
  let fetched = 0;
  let weeksWithGames = 0;

  for (let week = 1; week <= REGULAR_SEASON_WEEKS; week++) {
    const games = await provider.fetchScoreboard(week, targetSeason);
    if (games.length === 0) continue;

    weeksWithGames += 1;
    const result = await processGames(games);
    teamsUpserted += result.teamsUpserted;
    gamesUpserted += result.gamesUpserted;
    fetched += result.fetched;

    // Be polite to ESPN's undocumented API
    await new Promise((r) => setTimeout(r, 150));
  }

  return {
    ok: true,
    teamsUpserted,
    gamesUpserted,
    fetched,
    weeksSynced: weeksWithGames,
    season: targetSeason,
  };
}

export async function syncNflGames(options?: SyncOptions): Promise<SyncResult> {
  if (options?.allWeeks) {
    return syncAllSeasonWeeks(options.season);
  }
  return syncSingleWeek(options?.week, options?.season);
}
