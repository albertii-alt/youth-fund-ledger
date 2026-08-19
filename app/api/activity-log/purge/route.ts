import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/requireSession';

export async function POST(req: NextRequest) {
  if (!await requireSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { member_id } = await req.json().catch(() => ({}));

  let query = supabaseAdmin
    .from('activity_log')
    .delete()
    .not('hidden_at', 'is', null);

  if (member_id) query = query.eq('member_id', member_id);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
