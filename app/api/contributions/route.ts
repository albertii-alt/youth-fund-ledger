import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/requireSession';
import { isSunday, isFuture } from '@/lib/dates';

export async function PUT(req: NextRequest) {
  if (!await requireSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { member_id, contribution_date, amount } = await req.json();

  if (!member_id || !contribution_date) {
    return NextResponse.json({ error: 'member_id and contribution_date are required' }, { status: 400 });
  }
  if (!isSunday(contribution_date)) {
    return NextResponse.json({ error: 'contribution_date must be a Sunday' }, { status: 400 });
  }
  if (isFuture(contribution_date)) {
    return NextResponse.json({ error: 'contribution_date cannot be in the future' }, { status: 400 });
  }

  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed < 0) {
    return NextResponse.json({ error: 'Amount must be a non-negative number' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('contributions')
    .upsert({ member_id, contribution_date, amount: parsed, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
