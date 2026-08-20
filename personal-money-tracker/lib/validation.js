import { EXPENSE_CATEGORIES, normalizeCategory } from '@/lib/categories';

export function validateTransaction(body) {
  const type = String(body?.type || '').toUpperCase();
  const amount = Number(body?.amount);
  const description = String(body?.description || '').trim();
  const transaction_date = String(body?.transaction_date || '');
  const category = type === 'DEDUCT' ? normalizeCategory(body?.category) : null;

  if (!['ADD', 'DEDUCT'].includes(type)) {
    return { error: 'Transaction type must be ADD or DEDUCT.' };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'Amount must be greater than 0.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction_date)) {
    return { error: 'Please enter a valid transaction date.' };
  }
  if (description.length > 120) {
    return { error: 'Description must be 120 characters or fewer.' };
  }
  if (type === 'DEDUCT' && !EXPENSE_CATEGORIES.includes(category)) {
    return { error: 'Please select a valid expense category.' };
  }

  return {
    value: {
      type,
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      description,
      category,
      transaction_date,
    },
  };
}

export function validMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '');
}
