import db from '@/lib/db';

export function getOverallTotals() {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'ADD' THEN amount ELSE 0 END), 0) AS totalAdded,
      COALESCE(SUM(CASE WHEN type = 'DEDUCT' THEN amount ELSE 0 END), 0) AS totalDeducted
    FROM transactions
  `).get();

  const totalAdded = Number(row.totalAdded || 0);
  const totalDeducted = Number(row.totalDeducted || 0);
  return { totalAdded, totalDeducted, balance: totalAdded - totalDeducted };
}

export function getMonthTotals(month) {
  const row = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'ADD' THEN amount ELSE 0 END), 0) AS totalAdded,
      COALESCE(SUM(CASE WHEN type = 'DEDUCT' THEN amount ELSE 0 END), 0) AS totalDeducted
    FROM transactions
    WHERE substr(transaction_date, 1, 7) = ?
  `).get(month);

  const totalAdded = Number(row.totalAdded || 0);
  const totalDeducted = Number(row.totalDeducted || 0);
  return { totalAdded, totalDeducted, net: totalAdded - totalDeducted };
}

export function getExpenseCategoryTotals(month) {
  return db.prepare(`
    SELECT COALESCE(NULLIF(category, ''), 'Other') AS category, SUM(amount) AS total
    FROM transactions
    WHERE type = 'DEDUCT' AND substr(transaction_date, 1, 7) = ?
    GROUP BY COALESCE(NULLIF(category, ''), 'Other')
    ORDER BY total DESC, category ASC
  `).all(month).map((row) => ({ category: row.category, total: Number(row.total || 0) }));
}

export function listTransactions(month) {
  const sql = month
    ? `SELECT * FROM transactions WHERE substr(transaction_date, 1, 7) = ? ORDER BY transaction_date DESC, id DESC`
    : `SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC`;
  const rows = month ? db.prepare(sql).all(month) : db.prepare(sql).all();
  return rows.map(normalizeTransaction);
}

export function getTransaction(id) {
  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  return row ? normalizeTransaction(row) : null;
}

export function getRecentTransactions(limit = 6) {
  return db
    .prepare('SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC LIMIT ?')
    .all(limit)
    .map(normalizeTransaction);
}

export function createTransaction({ type, amount, description, category, transaction_date }) {
  if (type === 'DEDUCT') {
    const { balance } = getOverallTotals();
    if (amount > balance) throw new Error('INSUFFICIENT_BALANCE');
  }

  const result = db.prepare(`
    INSERT INTO transactions (type, amount, description, category, transaction_date)
    VALUES (?, ?, ?, ?, ?)
  `).run(type, amount, description || null, type === 'DEDUCT' ? category : null, transaction_date);

  return getTransaction(result.lastInsertRowid);
}

export function updateTransaction(id, input) {
  const existing = getTransaction(id);
  if (!existing) return null;

  const totals = getOverallTotals();
  const existingEffect = existing.type === 'ADD' ? existing.amount : -existing.amount;
  const newEffect = input.type === 'ADD' ? input.amount : -input.amount;
  const resultingBalance = totals.balance - existingEffect + newEffect;

  if (resultingBalance < 0) throw new Error('INSUFFICIENT_BALANCE');

  db.prepare(`
    UPDATE transactions
    SET type = ?, amount = ?, description = ?, category = ?, transaction_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    input.type,
    input.amount,
    input.description || null,
    input.type === 'DEDUCT' ? input.category : null,
    input.transaction_date,
    id
  );

  return getTransaction(id);
}

export function deleteTransaction(id) {
  const existing = getTransaction(id);
  if (!existing) return false;

  if (existing.type === 'ADD') {
    const { balance } = getOverallTotals();
    if (balance - existing.amount < 0) throw new Error('INSUFFICIENT_BALANCE');
  }

  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  return true;
}

function normalizeTransaction(row) {
  return {
    ...row,
    id: Number(row.id),
    amount: Number(row.amount),
    category: row.type === 'DEDUCT' ? (row.category || 'Other') : null,
  };
}
