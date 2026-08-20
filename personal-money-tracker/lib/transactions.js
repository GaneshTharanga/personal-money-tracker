import { getDb } from '@/lib/db';

export async function getOverallTotals() {
  const row = await getDb().prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'ADD' THEN amount ELSE 0 END), 0) AS totalAdded,
      COALESCE(SUM(CASE WHEN type = 'DEDUCT' THEN amount ELSE 0 END), 0) AS totalDeducted
    FROM transactions
  `).first();
  const totalAdded = Number(row?.totalAdded || 0);
  const totalDeducted = Number(row?.totalDeducted || 0);
  return { totalAdded, totalDeducted, balance: totalAdded - totalDeducted };
}

export async function getMonthTotals(month) {
  const row = await getDb().prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'ADD' THEN amount ELSE 0 END), 0) AS totalAdded,
      COALESCE(SUM(CASE WHEN type = 'DEDUCT' THEN amount ELSE 0 END), 0) AS totalDeducted
    FROM transactions WHERE substr(transaction_date, 1, 7) = ?
  `).bind(month).first();
  const totalAdded = Number(row?.totalAdded || 0);
  const totalDeducted = Number(row?.totalDeducted || 0);
  return { totalAdded, totalDeducted, net: totalAdded - totalDeducted };
}

export async function getExpenseCategoryTotals(month) {
  const result = await getDb().prepare(`
    SELECT COALESCE(NULLIF(category, ''), 'Other') AS category, SUM(amount) AS total
    FROM transactions
    WHERE type = 'DEDUCT' AND substr(transaction_date, 1, 7) = ?
    GROUP BY COALESCE(NULLIF(category, ''), 'Other')
    ORDER BY total DESC, category ASC
  `).bind(month).all();
  return result.results.map((row) => ({ category: row.category, total: Number(row.total || 0) }));
}

export async function listTransactions(month) {
  const statement = month
    ? getDb().prepare('SELECT * FROM transactions WHERE substr(transaction_date, 1, 7) = ? ORDER BY transaction_date DESC, id DESC').bind(month)
    : getDb().prepare('SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC');
  const result = await statement.all();
  return result.results.map(normalizeTransaction);
}

export async function getTransaction(id) {
  const row = await getDb().prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first();
  return row ? normalizeTransaction(row) : null;
}

export async function getRecentTransactions(limit = 6) {
  const result = await getDb().prepare(
    'SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC LIMIT ?'
  ).bind(limit).all();
  return result.results.map(normalizeTransaction);
}

export async function createTransaction({ type, amount, description, category, transaction_date }) {
  if (type === 'DEDUCT') {
    const { balance } = await getOverallTotals();
    if (amount > balance) throw new Error('INSUFFICIENT_BALANCE');
  }
  const result = await getDb().prepare(`
    INSERT INTO transactions (type, amount, description, category, transaction_date)
    VALUES (?, ?, ?, ?, ?)
  `).bind(type, amount, description || null, type === 'DEDUCT' ? category : null, transaction_date).run();
  return getTransaction(result.meta.last_row_id);
}

export async function updateTransaction(id, input) {
  const existing = await getTransaction(id);
  if (!existing) return null;
  const totals = await getOverallTotals();
  const existingEffect = existing.type === 'ADD' ? existing.amount : -existing.amount;
  const newEffect = input.type === 'ADD' ? input.amount : -input.amount;
  if (totals.balance - existingEffect + newEffect < 0) throw new Error('INSUFFICIENT_BALANCE');
  await getDb().prepare(`
    UPDATE transactions SET type = ?, amount = ?, description = ?, category = ?,
      transaction_date = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(input.type, input.amount, input.description || null,
    input.type === 'DEDUCT' ? input.category : null, input.transaction_date, id).run();
  return getTransaction(id);
}

export async function deleteTransaction(id) {
  const existing = await getTransaction(id);
  if (!existing) return false;
  if (existing.type === 'ADD') {
    const { balance } = await getOverallTotals();
    if (balance - existing.amount < 0) throw new Error('INSUFFICIENT_BALANCE');
  }
  await getDb().prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();
  return true;
}

function normalizeTransaction(row) {
  return { ...row, id: Number(row.id), amount: Number(row.amount),
    category: row.type === 'DEDUCT' ? (row.category || 'Other') : null };
}
