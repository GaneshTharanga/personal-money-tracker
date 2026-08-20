import { NextResponse } from 'next/server';
import { createTransaction, listTransactions } from '@/lib/transactions';
import { validMonth, validateTransaction } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  if (month && !validMonth(month)) {
    return NextResponse.json({ error: 'Invalid month. Use YYYY-MM.' }, { status: 400 });
  }
  return NextResponse.json({ transactions: listTransactions(month || undefined) });
}

export async function POST(request) {
  try {
    const validation = validateTransaction(await request.json());
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const transaction = createTransaction(validation.value);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Could not save transaction.' }, { status: 500 });
  }
}
