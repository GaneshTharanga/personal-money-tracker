import { getDb } from '@/lib/db';

export async function getOverallTotals(userId) {
  const row = await getDb().prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'ADD' THEN amount ELSE 0 END), 0) AS totalAdded,
      COALESCE(SUM(CASE WHEN type = 'DEDUCT' THEN amount ELSE 0 END), 0) AS totalDeducted
    FROM transactions WHERE user_id = ?
  `).bind(userId).first();
  const totalAdded = Number(row?.totalAdded || 0);
  const totalDeducted = Number(row?.totalDeducted || 0);
  return { totalAdded, totalDeducted, balance: totalAdded - totalDeducted };
}

export async function getMonthTotals(userId, month) {
  const row = await getDb().prepare(`
    SELECT COALESCE(SUM(CASE WHEN type = 'ADD' THEN amount ELSE 0 END), 0) AS totalAdded,
      COALESCE(SUM(CASE WHEN type = 'DEDUCT' THEN amount ELSE 0 END), 0) AS totalDeducted
    FROM transactions WHERE user_id = ? AND substr(transaction_date, 1, 7) = ?
  `).bind(userId, month).first();
  const totalAdded = Number(row?.totalAdded || 0);
  const totalDeducted = Number(row?.totalDeducted || 0);
  return { totalAdded, totalDeducted, net: totalAdded - totalDeducted };
}

export async function getExpenseCategoryTotals(userId, month) {
  const result = await getDb().prepare(`
    SELECT COALESCE(NULLIF(category, ''), 'Other') AS category, SUM(amount) AS total
    FROM transactions
    WHERE user_id = ? AND type = 'DEDUCT' AND substr(transaction_date, 1, 7) = ?
    GROUP BY COALESCE(NULLIF(category, ''), 'Other')
    ORDER BY total DESC, category ASC
  `).bind(userId, month).all();
  return result.results.map((row) => ({ category: row.category, total: Number(row.total || 0) }));
}

export async function listTransactions(userId, month) {
  const statement = month
    ? getDb().prepare('SELECT * FROM transactions WHERE user_id = ? AND substr(transaction_date, 1, 7) = ? ORDER BY transaction_date DESC, id DESC').bind(userId, month)
    : getDb().prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC').bind(userId);
  const result = await statement.all();
  return result.results.map(normalizeTransaction);
}

export async function getTransaction(userId, id) {
  const row = await getDb().prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).first();
  return row ? normalizeTransaction(row) : null;
}

export async function getRecentTransactions(userId, limit = 6) {
  const result = await getDb().prepare(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC LIMIT ?'
  ).bind(userId, limit).all();
  return result.results.map(normalizeTransaction);
}

export async function createTransaction(userId, { type, amount, description, category, transaction_date }) {
  if (type === 'DEDUCT') {
    const { balance } = await getOverallTotals(userId);
    if (amount > balance) throw new Error('INSUFFICIENT_BALANCE');
  }
  const result = await getDb().prepare(`
    INSERT INTO transactions (user_id, type, amount, description, category, transaction_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(userId, type, amount, description || null, type === 'DEDUCT' ? category : null, transaction_date).run();
  return getTransaction(userId, result.meta.last_row_id);
}

export async function updateTransaction(userId, id, input) {
  const existing = await getTransaction(userId, id);
  if (!existing) return null;
  const totals = await getOverallTotals(userId);
  const existingEffect = existing.type === 'ADD' ? existing.amount : -existing.amount;
  const newEffect = input.type === 'ADD' ? input.amount : -input.amount;
  if (totals.balance - existingEffect + newEffect < 0) throw new Error('INSUFFICIENT_BALANCE');
  await getDb().prepare(`
    UPDATE transactions SET type = ?, amount = ?, description = ?, category = ?,
      transaction_date = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?
  `).bind(input.type, input.amount, input.description || null,
    input.type === 'DEDUCT' ? input.category : null, input.transaction_date, id, userId).run();
  return getTransaction(userId, id);
}

export async function deleteTransaction(userId, id) {
  const existing = await getTransaction(userId, id);
  if (!existing) return false;
  if (existing.type === 'ADD') {
    const { balance } = await getOverallTotals(userId);
    if (balance - existing.amount < 0) throw new Error('INSUFFICIENT_BALANCE');
  }
  await getDb().prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return true;
}

function normalizeTransaction(row) {
  return { ...row, id: Number(row.id), amount: Number(row.amount),
    category: row.type === 'DEDUCT' ? (row.category || 'Other') : null };
}
