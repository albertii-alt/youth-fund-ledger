import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signSession, COOKIE_NAME } from '@/lib/auth';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

// req.ip is set by Vercel's edge and is not client-spoofable.
// x-real-ip is the fallback for other environments.
function getClientIp(req: NextRequest): string {
  return req.ip ?? req.headers.get('x-real-ip') ?? 'unknown';
}

// Single atomic round-trip: no read-then-write race condition.
async function isRateLimited(ip: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .rpc('check_rate_limit', { client_ip: ip, max_attempts: MAX_ATTEMPTS, window_ms: WINDOW_MS });
  if (error) return false; // fail open — don't lock out on DB errors
  return data === true;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const { pin } = await req.json();
  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('pin_hash')
    .single();

  if (!settings?.pin_hash) {
    return NextResponse.json({ error: 'No PIN set' }, { status: 403 });
  }

  const valid = await bcrypt.compare(pin, settings.pin_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
  return res;
}
