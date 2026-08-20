import { NextResponse } from 'next/server';
import { createTransaction, listTransactions } from '@/lib/transactions';
import { validMonth, validateTransaction } from '@/lib/validation';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (month && !validMonth(month)) {
    return NextResponse.json({ error: 'Invalid month. Use YYYY-MM.' }, { status: 400 });
  }
  return NextResponse.json({ transactions: await listTransactions(user.id, month || undefined) });
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    const validation = validateTransaction(await request.json());
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const transaction = await createTransaction(user.id, validation.value);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Could not save transaction.' }, { status: 500 });
  }
}
