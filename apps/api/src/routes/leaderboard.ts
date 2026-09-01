import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res: Response) => {
  const season = req.query.season
    ? parseInt(req.query.season as string, 10)
    : (await prisma.game.findFirst({ orderBy: { season: 'desc' } }))?.season ??
      new Date().getFullYear();

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, displayName: true, email: true },
  });

  const finalGames = await prisma.game.findMany({
    where: { season, status: 'FINAL', winnerTeamId: { not: null } },
    select: { id: true, week: true, winnerTeamId: true },
  });

  const tips = await prisma.tip.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      gameId: { in: finalGames.map((g) => g.id) },
    },
    select: { userId: true, gameId: true, pickedTeamId: true },
  });

  const gameMap = new Map(finalGames.map((g) => [g.id, g]));
  const userStats = new Map<
    string,
    { totalPoints: number; weeklyPoints: Map<number, number> }
  >();

  for (const user of users) {
    userStats.set(user.id, { totalPoints: 0, weeklyPoints: new Map() });
  }

  for (const tip of tips) {
    const game = gameMap.get(tip.gameId);
    if (!game || !game.winnerTeamId) continue;
    if (tip.pickedTeamId === game.winnerTeamId) {
      const stats = userStats.get(tip.userId)!;
      stats.totalPoints += 1;
      stats.weeklyPoints.set(game.week, (stats.weeklyPoints.get(game.week) ?? 0) + 1);
    }
  }

  const maxWeek = finalGames.reduce((max, g) => Math.max(max, g.week), 0);

  const leaderboard = users
    .map((user) => {
      const stats = userStats.get(user.id)!;
      return {
        userId: user.id,
        displayName: user.displayName,
        email: user.email,
        totalPoints: stats.totalPoints,
        lastWeekPoints: stats.weeklyPoints.get(maxWeek) ?? 0,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.lastWeekPoints - a.lastWeekPoints;
    })
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  res.json({ season, leaderboard });
});

export default router;
