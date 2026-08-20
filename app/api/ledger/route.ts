import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabaseClient';
import { sundaysInMonth, toDateString } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const all = searchParams.get('all') === 'true';
  const year = parseInt(searchParams.get('year') ?? '');
  const month = parseInt(searchParams.get('month') ?? '');

  const [settingsRes, membersRes, contributionsRes] = await Promise.all([
    supabase.from('settings').select('*').single(),
    supabase.from('members').select('*').order('name'),
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
    // Only include members active for any part of this month
    const firstDay = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-01`;
    const lastDay = toDateString(new Date(year, month, 0)); // day 0 of next month = last day of this month
    const activeMembers = members.filter((m) =>
      m.joined_date <= lastDay &&
      (m.left_date == null || m.left_date >= firstDay)
    );
    const contributions = allContributions.filter((c) => sundays.includes(c.contribution_date));

    // prevMonthCollected
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevSundays = sundaysInMonth(prevYear, prevMonth).map(toDateString);
    const prevTotal = allContributions
      .filter((c) => prevSundays.includes(c.contribution_date))
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const prevMonthCollected = prevSundays.length > 0 ? prevTotal : null;

    // membersContributed: active members with actual > 0 this month
    const membersContributed = activeMembers.filter((m) =>
      contributions.filter((c) => c.member_id === m.id).reduce((s, c) => s + Number(c.amount), 0) > 0
    ).length;

    return NextResponse.json({ settings, members: activeMembers, sundays, contributions, prevMonthCollected, membersContributed });
  }

  if (all) {
    // Collect all year-months that have data or joined members, plus current month
    const ymSet = new Set<string>();
    for (const c of allContributions) ymSet.add(c.contribution_date.slice(0, 7));
    for (const m of members) ymSet.add(m.joined_date.slice(0, 7));
    const phtNow = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    ymSet.add(phtNow.slice(0, 7));

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
        const expected = sundays.filter(
          (s) => s >= m.joined_date && (m.left_date == null || s <= m.left_date)
        ).length * expectedWeekly;
        rows.push({ member_id: m.id, year: y, month: mo, actual, expected });
      }
    }

    // membersContributed all-time: members who have ever contributed at least once
    const membersContributed = members.filter((m) =>
      allContributions.some((c) => c.member_id === m.id && Number(c.amount) > 0)
    ).length;

    return NextResponse.json({ settings, members, months, rows, prevMonthCollected: null, membersContributed });
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
