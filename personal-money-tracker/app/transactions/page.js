'use client';

import { useCallback, useEffect, useState } from 'react';
import MonthPicker from '@/components/MonthPicker';
import TransactionModal from '@/components/TransactionModal';
import { currentMonthISO, formatDate, formatLKR } from '@/lib/money';
import { useRouter } from 'next/navigation';

export default function TransactionsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthISO());
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/transactions?month=${month}`, { cache: 'no-store' });
      const data = await response.json();
      if (response.status === 401) return router.replace('/login');
      if (!response.ok) throw new Error(data.error || 'Could not load transactions.');
      setTransactions(data.transactions);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [month, router]);

  useEffect(() => { load(); }, [load]);

  async function remove(tx) {
    if (!window.confirm(`Delete ${tx.description || 'this transaction'}? This cannot be undone.`)) return;
    setError('');
    try {
      const response = await fetch(`/api/transactions/${tx.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete transaction.');
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="page-container">
      <div className="page-heading"><div><p className="eyebrow">History</p><h1>Transactions</h1><p>Review, edit, or remove your money records.</p></div><MonthPicker month={month} onChange={setMonth} /></div>
      {error && <div className="error-message">{error}</div>}
      <section className="panel transaction-panel">
        {loading ? <div className="empty-state">Loading…</div> : transactions.length ? (
          <div className="history-list">
            {transactions.map((tx) => (
              <article className="history-card" key={tx.id}>
                <div className={`tx-symbol ${tx.type === 'ADD' ? 'add' : 'deduct'}`}>{tx.type === 'ADD' ? '+' : '−'}</div>
                <div className="history-details"><strong>{tx.description || (tx.type === 'ADD' ? 'Money added' : 'Money deducted')}</strong><span>{formatDate(tx.transaction_date)} · {tx.type === 'ADD' ? 'Added' : `Deducted · ${tx.category || 'Other'}`}</span></div>
                <strong className={`history-amount ${tx.type === 'ADD' ? 'money-positive' : 'money-negative'}`}>{tx.type === 'ADD' ? '+' : '−'} {formatLKR(tx.amount)}</strong>
                <div className="row-actions"><button className="small-button" onClick={() => setEditing(tx)}>Edit</button><button className="small-button danger" onClick={() => remove(tx)}>Delete</button></div>
              </article>
            ))}
          </div>
        ) : <div className="empty-state"><strong>No transactions for this month</strong><span>Use the Dashboard to add or deduct money.</span></div>}
      </section>
      <TransactionModal open={Boolean(editing)} transaction={editing} mode={editing?.type} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
    </div>
  );
}
