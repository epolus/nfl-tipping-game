import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { fetchNflStandings } from '../services/nfl/standings';

const router = Router();

router.get('/', requireAuth, async (_req, res: Response) => {
  try {
    const standings = await fetchNflStandings();
    res.json(standings);
  } catch (err) {
    console.error('Standings fetch failed:', err);
    res.status(502).json({ error: 'Failed to fetch standings' });
  }
});

export default router;
