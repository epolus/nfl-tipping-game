import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { sanitizeUser } from '../lib/sanitize';
import { requireAdmin } from '../middleware/auth';
import { syncNflGames } from '../jobs/syncNflGames';

const router = Router();

router.use(requireAdmin);

router.get('/users', async (_req, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ users: users.map(sanitizeUser) });
});

router.post('/users', async (req, res: Response) => {
  const { email, displayName, password } = req.body;
  if (!email || !displayName || !password) {
    res.status(400).json({ error: 'Email, displayName, and password required' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      displayName,
      passwordHash,
    },
  });
  res.status(201).json({ user: sanitizeUser(user) });
});

router.patch('/users/:id', async (req, res: Response) => {
  const { id } = req.params;
  const { displayName, password, isActive, isAdmin } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (displayName !== undefined) data.displayName = displayName;
  if (isActive !== undefined) data.isActive = isActive;
  if (isAdmin !== undefined) data.isAdmin = isAdmin;
  if (password) data.passwordHash = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({ where: { id }, data });
  res.json({ user: sanitizeUser(updated) });
});

router.post('/sync-games', async (_req, res: Response) => {
  try {
    const result = await syncNflGames({ allWeeks: true });
    res.json(result);
  } catch (err) {
    console.error('Manual sync failed:', err);
    res.status(500).json({ error: 'Sync failed', details: String(err) });
  }
});

export default router;
