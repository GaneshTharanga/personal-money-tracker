'use client';

import { formatLKR } from '@/lib/money';

const COLORS = ['#c23b3b', '#df7b36', '#d9aa28', '#4f7b63', '#4b70b9', '#7a5fb0', '#b05283', '#7b8089'];

function DonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  if (!total) return <div className="chart-empty">No expenses for this month.</div>;

  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    cursor += (item.total / total) * 100;
    return `${COLORS[index % COLORS.length]} ${start}% ${cursor}%`;
  });

  return (
    <div className="expense-chart-layout">
      <div className="donut-chart" style={{ background: `conic-gradient(${stops.join(',')})` }}>
        <div className="donut-hole"><span>Expenses</span><strong>{formatLKR(total)}</strong></div>
      </div>
      <div className="chart-legend">
        {items.map((item, index) => (
          <div className="legend-row" key={item.category}>
            <span className="legend-dot" style={{ background: COLORS[index % COLORS.length] }} />
            <span>{item.category}</span>
            <strong>{formatLKR(item.total)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryBars({ monthly }) {
  const values = [monthly.totalAdded, monthly.totalDeducted, Math.abs(monthly.net)];
  const max = Math.max(...values, 1);
  const rows = [
    { label: 'Money Added', value: monthly.totalAdded, className: 'positive-bar' },
    { label: 'Money Deducted', value: monthly.totalDeducted, className: 'negative-bar' },
    { label: monthly.net >= 0 ? 'Saved / Net' : 'Net Used', value: Math.abs(monthly.net), display: monthly.net, className: 'net-bar' },
  ];

  return (
    <div className="bar-chart">
      {rows.map((row) => (
        <div className="bar-row" key={row.label}>
          <div className="bar-label"><span>{row.label}</span><strong>{formatLKR(row.display ?? row.value)}</strong></div>
          <div className="bar-track"><span className={row.className} style={{ width: `${(row.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function MoneyCharts({ monthly, expenseCategories }) {
  return (
    <div className="charts-grid">
      <section className="panel chart-panel">
        <div className="panel-header"><div><p className="eyebrow">Where your money went</p><h2>Expenses by Category</h2></div></div>
        <DonutChart items={expenseCategories || []} />
      </section>
      <section className="panel chart-panel">
        <div className="panel-header"><div><p className="eyebrow">Monthly comparison</p><h2>Added vs Deducted</h2></div></div>
        <SummaryBars monthly={monthly || { totalAdded: 0, totalDeducted: 0, net: 0 }} />
      </section>
    </div>
  );
}
