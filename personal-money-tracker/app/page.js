'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import MonthPicker from '@/components/MonthPicker';
import TransactionModal from '@/components/TransactionModal';
import MoneyCharts from '@/components/MoneyCharts';
import { currentMonthISO, formatDate, formatLKR } from '@/lib/money';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [month, setMonth] = useState(currentMonthISO());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/dashboard?month=${month}`, { cache: 'no-store' });
      const json = await response.json();
      if (response.status === 401) return router.replace('/login');
      if (!response.ok) throw new Error(json.error || 'Could not load dashboard.');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, router]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  return (
    <div className="page-container dashboard-page">
      <section className="balance-card">
        <p>Current Balance</p>
        <h1>{formatLKR(data?.balance || 0)}</h1>
        <span>Available across all transactions</span>
      </section>

      <div className="primary-actions">
        <button className="action-card add" onClick={() => setModalMode('ADD')}><span className="action-icon">+</span><span><strong>Add Money</strong><small>Record income</small></span></button>
        <button className="action-card deduct" onClick={() => setModalMode('DEDUCT')}><span className="action-icon">−</span><span><strong>Deduct Money</strong><small>Record expense</small></span></button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">Monthly summary</p><h2>Overview</h2></div><MonthPicker month={month} onChange={setMonth} /></div>
        <div className="summary-grid">
          <div className="summary-item"><span>Money Added</span><strong className="money-positive">+ {formatLKR(data?.monthly?.totalAdded || 0)}</strong></div>
          <div className="summary-item"><span>Money Deducted</span><strong className="money-negative">− {formatLKR(data?.monthly?.totalDeducted || 0)}</strong></div>
          <div className="summary-item"><span>Saved / Net</span><strong>{formatLKR(data?.monthly?.net || 0)}</strong></div>
        </div>
      </section>

      <MoneyCharts monthly={data?.monthly} expenseCategories={data?.expenseCategories} />

      <section className="panel">
        <div className="panel-header"><div><p className="eyebrow">Latest activity</p><h2>Recent Transactions</h2></div><Link href="/transactions" className="text-link">View all</Link></div>
        {loading ? <div className="empty-state">Loading…</div> : data?.recentTransactions?.length ? (
          <div className="transaction-list">
            {data.recentTransactions.map((tx) => <div className="transaction-row" key={tx.id}><div className={`tx-symbol ${tx.type === 'ADD' ? 'add' : 'deduct'}`}>{tx.type === 'ADD' ? '+' : '−'}</div><div className="tx-main"><strong>{tx.description || (tx.type === 'ADD' ? 'Money added' : 'Money deducted')}</strong><span>{formatDate(tx.transaction_date)}{tx.category ? ` · ${tx.category}` : ''}</span></div><strong className={tx.type === 'ADD' ? 'money-positive' : 'money-negative'}>{tx.type === 'ADD' ? '+' : '−'} {formatLKR(tx.amount)}</strong></div>)}
          </div>
        ) : <div className="empty-state"><strong>No transactions yet</strong><span>Add money to start tracking your balance.</span></div>}
      </section>

      <TransactionModal open={Boolean(modalMode)} mode={modalMode} onClose={() => setModalMode(null)} onSaved={() => { setModalMode(null); loadDashboard(); }} />
    </div>
  );
}
