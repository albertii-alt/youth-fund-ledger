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

  const settings = settingsRes.data;
  const members = membersRes.data;
  const allContributions = contributionsRes.data;
  const expectedWeekly = Number(settings.expected_weekly_amount);

  if (!all && !isNaN(year) && !isNaN(month)) {
    const sundays = sundaysInMonth(year, month).map(toDateString);
    const contributions = allContributions.filter((c) => sundays.includes(c.contribution_date));
    return NextResponse.json({ settings, members, sundays, contributions });
  }

  if (all) {
    // Collect all year-months that have data or joined members, plus current month
    const ymSet = new Set<string>();
    for (const c of allContributions) ymSet.add(c.contribution_date.slice(0, 7));
    for (const m of members) ymSet.add(m.joined_date.slice(0, 7));
    const today = new Date();
    ymSet.add(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

    const months = Array.from(ymSet).sort();

    // Pre-aggregate: for each member × month, compute actual + expected
    const rows: { member_id: string; year: number; month: number; actual: number; expected: number }[] = [];

    for (const ym of months) {
      const [y, mo] = ym.split('-').map(Number);
      const sundays = sundaysInMonth(y, mo).map(toDateString);
      for (const m of members) {
        const actual = allContributions
          .filter((c) => c.member_id === m.id && sundays.includes(c.contribution_date))
          .reduce((sum, c) => sum + Number(c.amount), 0);
        const expected = sundays.filter((s) => s >= m.joined_date).length * expectedWeekly;
        rows.push({ member_id: m.id, year: y, month: mo, actual, expected });
      }
    }

    return NextResponse.json({ settings, members, months, rows });
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
