'use client';

import { useEffect, useState } from 'react';
import { todayISO } from '@/lib/money';
import { EXPENSE_CATEGORIES } from '@/lib/categories';

export default function TransactionModal({ open, mode, transaction, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: '', description: '', category: 'Other', transaction_date: todayISO() });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      transaction
        ? {
            amount: String(transaction.amount),
            description: transaction.description || '',
            category: transaction.category || 'Other',
            transaction_date: transaction.transaction_date,
          }
        : { amount: '', description: '', category: 'Other', transaction_date: todayISO() }
    );
  }, [open, transaction]);

  if (!open) return null;
  const type = transaction?.type || mode;
  const isAdd = type === 'ADD';

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(transaction ? `/api/transactions/${transaction.id}` : '/api/transactions', {
        method: transaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, category: isAdd ? null : form.category, type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save transaction.');
      onSaved(data.transaction);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{transaction ? 'Edit transaction' : isAdd ? 'Income' : 'Expense'}</p>
            <h2 id="transaction-title">{transaction ? 'Edit Transaction' : isAdd ? 'Add Money' : 'Deduct Money'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={submit} className="form-stack">
          <label>
            <span>Amount *</span>
            <div className="amount-input"><span>LKR</span><input autoFocus inputMode="decimal" type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50,000" /></div>
          </label>
          {!isAdd && (
            <label>
              <span>Category *</span>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          )}
          <label>
            <span>Description <small>Optional</small></span>
            <input maxLength="120" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={isAdd ? 'Salary' : 'Lunch'} />
          </label>
          <label>
            <span>Date *</span>
            <input type="date" required value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
          </label>

          {error && <div className="error-message" role="alert">{error}</div>}

          <div className="form-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className={`button ${isAdd ? 'positive' : 'negative'}`} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
