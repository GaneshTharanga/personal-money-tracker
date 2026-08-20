# Personal Money Tracker

A personal wallet tracker built with Next.js and Cloudflare D1.

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
- Cloudflare D1 database
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

The schema is managed by the SQL files in `migrations/`. During development,
Wrangler provides a local D1 database; production uses the D1 database bound as
`DB` in `wrangler.jsonc`.

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

## Deploy to Cloudflare Workers

You need Node.js 20.9+ and access to the Cloudflare account that will own the app.

1. Install dependencies and sign in:

```bash
npm install
npx wrangler login
```

2. Create the production D1 database:

```bash
npx wrangler d1 create personal-money-tracker-db
```

3. Copy the `database_id` printed by that command into `wrangler.jsonc`, replacing
   `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

4. Create the production tables and deploy:

```bash
npm run db:migrate:remote
npm run deploy
```

Wrangler prints the deployed `workers.dev` URL when deployment finishes.

For a local D1 environment, run:

```bash
npm run db:migrate:local
npm run dev
```

The previous `data/money-tracker.db` file is not uploaded automatically. Keep it
as a backup until any existing transactions have been imported and verified.
