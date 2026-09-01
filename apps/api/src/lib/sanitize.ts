export function sanitizeUser<T extends { passwordHash?: string }>(
  user: T
): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}
