import { GameStatus } from '@prisma/client';

export interface NflGameData {
  externalId: string;
  week: number;
  season: number;
  kickoff: Date;
  homeAbbreviation: string;
  homeName: string;
  homeLogoUrl: string | null;
  awayAbbreviation: string;
  awayName: string;
  awayLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  winnerAbbreviation: string | null;
}

export interface NflDataProvider {
  fetchScoreboard(week?: number, season?: number): Promise<NflGameData[]>;
  fetchSeasonInfo(): Promise<{ season: number; currentWeek: number }>;
}
