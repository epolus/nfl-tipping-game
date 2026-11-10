import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { fetchNflNews } from '../services/nfl/news';

const router = Router();

router.get('/', requireAuth, async (req, res: Response) => {
  try {
    const raw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 25;
    const limit = Number.isFinite(raw) ? raw : 25;
    const articles = await fetchNflNews(limit);
    res.json({ articles });
  } catch (err) {
    console.error('News fetch failed:', err);
    res.status(502).json({ error: 'Failed to fetch news' });
  }
});

export default router;
