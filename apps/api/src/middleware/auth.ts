import { Request, Response, NextFunction } from 'express';
import { COOKIE_NAME, verifyToken, JwtPayload } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

export async function requirePlayer(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    if (user.isAdmin) {
      res.status(403).json({ error: 'Admins cannot participate in tipping' });
      return;
    }
    next();
  });
}
