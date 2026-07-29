import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/requireSession';

export async function POST(req: NextRequest) {
  if (!await requireSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, joined_date } = await req.json();
  const trimmed = name?.trim().slice(0, 100);
  if (!trimmed) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const date = joined_date ?? new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from('members')
    .insert({ name: trimmed, joined_date: date })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
