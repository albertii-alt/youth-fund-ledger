import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const member_id = searchParams.get('member_id');
  const show_hidden = searchParams.get('show_hidden') === 'true';
  // cursor = changed_at of the last item on the previous page (ISO string)
  const cursor = searchParams.get('cursor');

  let query = supabase
    .from('activity_log')
    .select('id, contribution_date, previous_amount, new_amount, changed_at, members(name)')
    .order('changed_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1); // fetch one extra to know if there's a next page

  query = show_hidden ? query.not('hidden_at', 'is', null) : query.is('hidden_at', null);
  if (member_id) query = query.eq('member_id', member_id);
  if (cursor) query = query.lt('changed_at', cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasMore = data.length > PAGE_SIZE;
  const rows = hasMore ? data.slice(0, PAGE_SIZE) : data;
  const nextCursor = hasMore ? rows[rows.length - 1].changed_at : null;

  return NextResponse.json({ rows, nextCursor });
}
