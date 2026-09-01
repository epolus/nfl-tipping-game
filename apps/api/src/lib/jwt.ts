import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'nfl_tipping_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function signToken(user: Pick<User, 'id' | 'email' | 'isAdmin'>): string {
  return jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.isAdmin } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: MAX_AGE_MS,
    path: '/',
  };
}

export { COOKIE_NAME, JWT_SECRET };
