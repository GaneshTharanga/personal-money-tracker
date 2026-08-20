CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('ADD', 'DEDUCT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  category TEXT,
  transaction_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_date
ON transactions(transaction_date DESC, id DESC);
