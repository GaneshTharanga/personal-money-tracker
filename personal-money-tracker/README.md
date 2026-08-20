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
- Username/password login with 30-day sessions
- Separate balances, charts, and transactions for every user

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
user_id
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

## Users and login

There is no public registration page. Apply the migrations, then create users manually:

```bash
# Local development user
npm run user:create -- ganesh --local

# Production user
npm run user:create -- ganesh --remote
```

The command securely prompts for a password (minimum 8 characters). Usernames are
case-insensitive and must be 3-40 letters, numbers, dots, underscores, or hyphens.
Passwords are stored as salted scrypt hashes, never as plain text.

Each transaction belongs to one user. The migration intentionally leaves any old
transactions unassigned so they cannot accidentally appear in another user's account.
To give all old unassigned transactions to a user, first check that user's ID and then
run the update against the appropriate database:

```bash
npx wrangler d1 execute personal-money-tracker-db --local --command "SELECT id, username FROM users;"
npx wrangler d1 execute personal-money-tracker-db --local --command "UPDATE transactions SET user_id = 1 WHERE user_id IS NULL;"
```

Use `--remote` instead of `--local` for production. Replace `1` with the correct user ID.

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
