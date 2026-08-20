# Personal Money Tracker

A simple local-first personal wallet tracker built with Next.js and SQLite.

## Features

- Add money/income
- Deduct money/expenses
- Prevent deductions that would make the overall balance negative
- Current balance
- Monthly added, deducted, and saved/net totals
- Expense categories: Food, Transport, Shopping, Bills, Health, Education, Entertainment, Other
- Category-wise monthly expense donut chart
- Monthly Added vs Deducted vs Saved/Net bar chart
- Recent transactions
- Full transaction history
- Edit and delete transactions
- Month navigation/filtering
- LKR formatting
- Local SQLite database
- Mobile-friendly UI

## Linux setup

Requirements: Node.js 20.9+ and npm.

```bash
cd /path/to/personal-money-tracker
npm install
npm run dev
```

Open http://localhost:3000

You can also run:

```bash
chmod +x start-linux-mac.sh
./start-linux-mac.sh
```

## Database

The database is automatically created at:

```text
data/money-tracker.db
```

The app safely upgrades databases from version 1 by adding the `category` column automatically.

Main table:

```text
transactions
id
type
amount
description
category
transaction_date
created_at
updated_at
```

`type` is either `ADD` or `DEDUCT`. Categories are stored directly on expense transactions; there is no separate category table.

## API

- `GET /api/transactions`
- `GET /api/transactions?month=YYYY-MM`
- `POST /api/transactions`
- `GET /api/transactions/{id}`
- `PUT /api/transactions/{id}`
- `DELETE /api/transactions/{id}`
- `GET /api/dashboard?month=YYYY-MM`

The dashboard response now also includes `expenseCategories` for the selected month.
