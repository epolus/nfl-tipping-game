import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function isGameLocked(kickoff: Date): boolean {
  return new Date() >= kickoff;
}

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const week = req.query.week ? parseInt(req.query.week as string, 10) : undefined;

  const where: { userId: string; game?: { week?: number; season?: number } } = { userId };

  if (week !== undefined) {
    const season = req.query.season
      ? parseInt(req.query.season as string, 10)
      : (await prisma.game.findFirst({ orderBy: { season: 'desc' } }))?.season ??
        new Date().getFullYear();
    where.game = { week, season };
  }

  const tips = await prisma.tip.findMany({
    where,
    include: {
      game: {
        include: { homeTeam: true, awayTeam: true, winnerTeam: true },
      },
      pickedTeam: true,
    },
    orderBy: { game: { kickoff: 'desc' } },
  });

  const enriched = tips.map((tip) => ({
    ...tip,
    isCorrect:
      tip.game.status === 'FINAL' && tip.game.winnerTeamId === tip.pickedTeamId,
    pointsEarned:
      tip.game.status === 'FINAL' && tip.game.winnerTeamId === tip.pickedTeamId ? 1 : 0,
  }));

  res.json({ tips: enriched });
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { gameId, pickedTeamId } = req.body;

  if (!gameId || !pickedTeamId) {
    res.status(400).json({ error: 'gameId and pickedTeamId required' });
    return;
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { homeTeam: true, awayTeam: true },
  });

  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  if (isGameLocked(game.kickoff)) {
    res.status(403).json({ error: 'Tips are locked — kickoff has passed' });
    return;
  }

  if (pickedTeamId !== game.homeTeamId && pickedTeamId !== game.awayTeamId) {
    res.status(400).json({ error: 'pickedTeamId must be home or away team' });
    return;
  }

  const existing = await prisma.tip.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });
  if (existing) {
    res.status(409).json({ error: 'Tip already exists — use PUT to update' });
    return;
  }

  const tip = await prisma.tip.create({
    data: { userId, gameId, pickedTeamId },
    include: { pickedTeam: true, game: { include: { homeTeam: true, awayTeam: true } } },
  });
  res.status(201).json({ tip });
});

router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { pickedTeamId } = req.body;

  if (!pickedTeamId) {
    res.status(400).json({ error: 'pickedTeamId required' });
    return;
  }

  const tip = await prisma.tip.findUnique({
    where: { id },
    include: { game: true },
  });

  if (!tip || tip.userId !== userId) {
    res.status(404).json({ error: 'Tip not found' });
    return;
  }

  if (isGameLocked(tip.game.kickoff)) {
    res.status(403).json({ error: 'Tips are locked — kickoff has passed' });
    return;
  }

  if (pickedTeamId !== tip.game.homeTeamId && pickedTeamId !== tip.game.awayTeamId) {
    res.status(400).json({ error: 'pickedTeamId must be home or away team' });
    return;
  }

  const updated = await prisma.tip.update({
    where: { id },
    data: { pickedTeamId },
    include: { pickedTeam: true, game: { include: { homeTeam: true, awayTeam: true } } },
  });
  res.json({ tip: updated });
});

export default router;
