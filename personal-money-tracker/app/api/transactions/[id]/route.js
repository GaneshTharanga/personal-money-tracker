import { NextResponse } from 'next/server';
import { deleteTransaction, getTransaction, updateTransaction } from '@/lib/transactions';
import { validateTransaction } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseId(id) {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function GET(_request, { params }) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'Invalid transaction ID.' }, { status: 400 });

  const transaction = await getTransaction(id);
  if (!transaction) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
  return NextResponse.json({ transaction });
}

export async function PUT(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: 'Invalid transaction ID.' }, { status: 400 });

    const validation = validateTransaction(await request.json());
    if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

    const transaction = await updateTransaction(id, validation.value);
    if (!transaction) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    return NextResponse.json({ transaction });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Could not update transaction.' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) return NextResponse.json({ error: 'Invalid transaction ID.' }, { status: 400 });

    const deleted = await deleteTransaction(id);
    if (!deleted) return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json(
        { error: 'This income cannot be deleted because it would make the balance negative.' },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: 'Could not delete transaction.' }, { status: 500 });
  }
}
