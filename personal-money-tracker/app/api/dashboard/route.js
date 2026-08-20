import { NextResponse } from 'next/server';
import { getExpenseCategoryTotals, getMonthTotals, getOverallTotals, getRecentTransactions } from '@/lib/transactions';
import { validMonth } from '@/lib/validation';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

  if (!validMonth(month)) {
    return NextResponse.json({ error: 'Invalid month. Use YYYY-MM.' }, { status: 400 });
  }

  const [overall, monthly, expenseCategories, recentTransactions] = await Promise.all([
    getOverallTotals(user.id),
    getMonthTotals(user.id, month),
    getExpenseCategoryTotals(user.id, month),
    getRecentTransactions(user.id),
  ]);

  return NextResponse.json({
    totalAdded: overall.totalAdded,
    totalDeducted: overall.totalDeducted,
    balance: overall.balance,
    month,
    monthly,
    expenseCategories,
    recentTransactions,
  });
}
