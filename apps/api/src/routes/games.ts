import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { fetchGameRecap } from '../services/nfl/recap';

const router = Router();

router.get('/weeks', requireAuth, async (req: AuthRequest, res: Response) => {
  const seasonParam = req.query.season ? parseInt(req.query.season as string, 10) : undefined;

  const latestGame = await prisma.game.findFirst({
    orderBy: [{ season: 'desc' }, { week: 'desc' }],
  });

  const season = seasonParam ?? latestGame?.season ?? new Date().getFullYear();

  const weekRows = await prisma.game.findMany({
    where: { season },
    select: { week: true },
    distinct: ['week'],
    orderBy: { week: 'asc' },
  });

  const weeks = weekRows.map((r) => r.week);

  // Default week: latest week with a non-final game, else the latest week in the season
  const activeGame = await prisma.game.findFirst({
    where: { season, status: { in: ['SCHEDULED', 'LIVE'] } },
    orderBy: { week: 'asc' },
  });
  const currentWeek =
    activeGame?.week ??
    (latestGame?.season === season ? latestGame.week : weeks[weeks.length - 1] ?? 1);

  res.json({ season, weeks, currentWeek });
});

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const week = req.query.week ? parseInt(req.query.week as string, 10) : undefined;
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;

  let targetWeek = week;
  let targetSeason = season;

  if (targetWeek === undefined || targetSeason === undefined) {
    const latest = await prisma.game.findFirst({
      orderBy: [{ season: 'desc' }, { week: 'desc' }],
    });
    if (latest) {
      targetWeek = targetWeek ?? latest.week;
      targetSeason = targetSeason ?? latest.season;
    } else {
      targetWeek = targetWeek ?? 1;
      targetSeason = targetSeason ?? new Date().getFullYear();
    }
  }

  const games = await prisma.game.findMany({
    where: { week: targetWeek, season: targetSeason },
    include: {
      homeTeam: true,
      awayTeam: true,
      winnerTeam: true,
    },
    orderBy: { kickoff: 'asc' },
  });

  res.json({ games, week: targetWeek, season: targetSeason });
});

router.get('/:id/recap', requireAuth, async (req: AuthRequest, res: Response) => {
  const game = await prisma.game.findUnique({ where: { id: req.params.id } });
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  try {
    const recap = await fetchGameRecap(game.externalId);
    res.json({ recap });
  } catch (err) {
    console.error('Recap fetch failed:', err);
    res.status(502).json({ error: 'Failed to fetch game recap' });
  }
});

export default router;
