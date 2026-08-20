export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Entertainment',
  'Other',
];

export function normalizeCategory(value) {
  const category = String(value || '').trim();
  return EXPENSE_CATEGORIES.includes(category) ? category : 'Other';
}
