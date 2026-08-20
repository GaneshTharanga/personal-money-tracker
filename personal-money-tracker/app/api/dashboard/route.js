import { NextResponse } from 'next/server';
import { getExpenseCategoryTotals, getMonthTotals, getOverallTotals, getRecentTransactions } from '@/lib/transactions';
import { validMonth } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  if (!validMonth(month)) {
    return NextResponse.json({ error: 'Invalid month. Use YYYY-MM.' }, { status: 400 });
  }

  const overall = getOverallTotals();
  const monthly = getMonthTotals(month);

  return NextResponse.json({
    totalAdded: overall.totalAdded,
    totalDeducted: overall.totalDeducted,
    balance: overall.balance,
    month,
    monthly,
    expenseCategories: getExpenseCategoryTotals(month),
    recentTransactions: getRecentTransactions(),
  });
}
