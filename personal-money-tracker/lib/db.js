import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'money-tracker.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
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
`);

// Safe migration for databases created by the first version of the app.
const columns = db.prepare('PRAGMA table_info(transactions)').all();
if (!columns.some((column) => column.name === 'category')) {
  db.exec('ALTER TABLE transactions ADD COLUMN category TEXT');
}

export default db;
