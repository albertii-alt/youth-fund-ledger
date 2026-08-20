import { NextRequest, NextResponse } from 'next/server';
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSession(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .update({
      amount: Number(body.amount),
      description: String(body.description).trim(),
      expense_date: String(body.expense_date),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireSession(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin.from('expenses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
