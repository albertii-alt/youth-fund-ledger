import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireSession } from '@/lib/requireSession';

function validate(body: { amount?: unknown; description?: unknown; expense_date?: unknown }) {
  const amount = Number(body.amount);
  if (!body.amount || isNaN(amount) || amount <= 0)
    return 'amount must be a positive number';
  const desc = String(body.description ?? '').trim();
  if (!desc) return 'description is required';
  if (desc.length > 200) return 'description must be 200 characters or fewer';
  const date = String(body.expense_date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date)))
    return 'expense_date must be a valid date (YYYY-MM-DD)';
  const phtToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  if (date > phtToday) return 'expense_date cannot be in the future';
  return null;
}

export async function GET() {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, description, expense_date, created_at')
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await requireSession(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({
      amount: Number(body.amount),
      description: String(body.description).trim(),
      expense_date: String(body.expense_date),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
