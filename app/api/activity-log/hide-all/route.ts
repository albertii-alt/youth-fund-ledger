import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/requireSession';

export async function POST(req: NextRequest) {
  if (!await requireSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from('activity_log')
    .update({ hidden_at: new Date().toISOString() })
    .is('hidden_at', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
