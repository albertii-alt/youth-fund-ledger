import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signSession, COOKIE_NAME } from '@/lib/auth';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

async function isRateLimited(ip: string): Promise<boolean> {
  const now = new Date();
  const { data } = await supabaseAdmin
    .from('login_attempts')
    .select('count, reset_at')
    .eq('ip', ip)
    .single();

  if (!data || new Date(data.reset_at) <= now) {
    // No record or window expired — reset
    await supabaseAdmin.from('login_attempts').upsert({
      ip,
      count: 1,
      reset_at: new Date(Date.now() + WINDOW_MS).toISOString(),
    });
    return false;
  }

  if (data.count >= MAX_ATTEMPTS) return true;

  await supabaseAdmin
    .from('login_attempts')
    .update({ count: data.count + 1 })
    .eq('ip', ip);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
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
