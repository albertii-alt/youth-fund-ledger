import { NextRequest, NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const loggedIn = token ? await verifySession(token) : false;

  const { data: settings } = await supabase
    .from('settings')
    .select('pin_hash')
    .single();

  return NextResponse.json({
    loggedIn,
    pinSet: !!settings?.pin_hash,
  });
}
