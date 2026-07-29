import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sundaysInMonth, toDateString } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const all = searchParams.get('all') === 'true';
  const year = parseInt(searchParams.get('year') ?? '');
  const month = parseInt(searchParams.get('month') ?? '');

  const [settingsRes, membersRes, contributionsRes] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('members').select('*').order('joined_date'),
    supabase.from('contributions').select('*'),
  ]);

  if (settingsRes.error || membersRes.error || contributionsRes.error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }

  let sundays: string[] = [];

  if (!all && !isNaN(year) && !isNaN(month)) {
    sundays = sundaysInMonth(year, month).map(toDateString);
  } else if (all) {
    // derive all months that have contributions or member joined_dates
    const dates = new Set<string>();
    for (const c of contributionsRes.data) dates.add(c.contribution_date.slice(0, 7));
    for (const m of membersRes.data) dates.add(m.joined_date.slice(0, 7));
    const today = new Date();
    dates.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
    for (const ym of dates) {
      const [y, mo] = ym.split('-').map(Number);
      sundaysInMonth(y, mo).forEach((d) => sundays.push(toDateString(d)));
    }
    sundays.sort();
  }

  const contributions = all
    ? contributionsRes.data
    : contributionsRes.data.filter((c) => sundays.includes(c.contribution_date));

  return NextResponse.json({
    settings: settingsRes.data,
    members: membersRes.data,
    sundays,
    contributions,
  });
}
