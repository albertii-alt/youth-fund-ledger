import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { signSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 });
  }

  const { data: settings } = await supabaseAdmin
    .from('settings')
    .select('pin_hash')
    .single();

  if (settings?.pin_hash) {
    return NextResponse.json({ error: 'PIN already set' }, { status: 403 });
  }

  const pin_hash = await bcrypt.hash(pin, 10);
  await supabaseAdmin.from('settings').update({ pin_hash }).eq('id', 1);

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
