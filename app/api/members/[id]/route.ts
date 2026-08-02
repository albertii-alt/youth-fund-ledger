import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/requireSession';
import { sundaysInMonth, toDateString } from '@/lib/dates';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [memberRes, settingsRes, contributionsRes] = await Promise.all([
    supabase.from('members').select('*').eq('id', id).single(),
    supabase.from('settings').select('expected_weekly_amount').single(),
    supabase.from('contributions').select('*').eq('member_id', id),
  ]);

  if (memberRes.error) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const member = memberRes.data;
  const expectedWeekly = Number(settingsRes.data?.expected_weekly_amount ?? 20);
  const contributions = contributionsRes.data ?? [];

  // Build month-by-month breakdown from joined_date up to left_date (or now)
  const ymSet = new Set<string>();
  for (const c of contributions) ymSet.add(c.contribution_date.slice(0, 7));
  ymSet.add(member.joined_date.slice(0, 7));
  const phtNow = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const ceiling = member.left_date ?? phtNow;
  ymSet.add(ceiling.slice(0, 7));

  const months = Array.from(ymSet)
    .filter((ym) => ym >= member.joined_date.slice(0, 7) && ym <= ceiling.slice(0, 7))
    .sort();

  const breakdown = months.map((ym) => {
    const [y, mo] = ym.split('-').map(Number);
    const sundays = sundaysInMonth(y, mo).map(toDateString);
    const activeSundays = sundays.filter(
      (s) => s >= member.joined_date && (member.left_date == null || s <= member.left_date)
    );
    const actual = contributions
      .filter((c) => sundays.includes(c.contribution_date))
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const expected = activeSundays.length * expectedWeekly;
    return { year: y, month: mo, actual, expected };
  });

  const allTimeActual = breakdown.reduce((sum, r) => sum + r.actual, 0);
  const allTimeExpected = breakdown.reduce((sum, r) => sum + r.expected, 0);

  return NextResponse.json({ member, breakdown, allTimeActual, allTimeExpected });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, string | null> = {};

  if (body.name) updates.name = body.name.trim().slice(0, 100);
  if (body.joined_date) updates.joined_date = body.joined_date;
  // left_date must be explicitly checked with `in` since null is a valid value
  if ('left_date' in body) updates.left_date = body.left_date ?? null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
