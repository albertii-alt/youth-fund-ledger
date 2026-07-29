import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get('month'); // 'YYYY-MM' or 'all'

  const [settingsRes, membersRes, sundaysRes] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('members').select('*').order('created_at'),
    supabase.from('sundays').select('*').order('the_date'),
  ]);

  if (settingsRes.error || membersRes.error || sundaysRes.error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }

  const allSundays: { id: string; the_date: string }[] = sundaysRes.data;

  const filteredSundays =
    !month || month === 'all'
      ? allSundays
      : allSundays.filter((s) => s.the_date.startsWith(month));

  const sundayIds = filteredSundays.map((s) => s.id);

  const contributionsRes =
    sundayIds.length > 0
      ? await supabase
          .from('contributions')
          .select('*')
          .in('sunday_id', sundayIds)
      : { data: [], error: null };

  if (contributionsRes.error) {
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }

  return NextResponse.json({
    settings: settingsRes.data,
    members: membersRes.data,
    sundays: filteredSundays,
    allSundays,
    contributions: contributionsRes.data,
  });
}
