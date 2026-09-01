import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import tipsRoutes from './routes/tips';
import leaderboardRoutes from './routes/leaderboard';
import standingsRoutes from './routes/standings';
import adminRoutes from './routes/admin';
import { startScheduler } from './jobs/scheduler';
import { requireAuth, AuthRequest } from './middleware/auth';
import { prisma } from './lib/prisma';
import { sanitizeUser } from './lib/sanitize';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'User not found or inactive' });
    return;
  }
  res.json({ user: sanitizeUser(user) });
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/standings', standingsRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
  startScheduler();
});
