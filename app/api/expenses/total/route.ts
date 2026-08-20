import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const total = (data ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  return NextResponse.json({ total });
}
