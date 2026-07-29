import { NextRequest } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/auth';

export async function requireSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}
