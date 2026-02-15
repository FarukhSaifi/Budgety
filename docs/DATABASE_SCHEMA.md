# Budgety – Neon database schema

All user data is stored in Neon (PostgreSQL). Local storage is not used.

## Tables (in `public` schema)

### budgety_transactions

| Column      | Type          | Description                |
| ----------- | ------------- | -------------------------- |
| id          | TEXT (PK)     | UUID                       |
| type        | TEXT          | `income` \| `expense`      |
| date        | DATE          | Transaction date           |
| mode        | TEXT          | Cash, UPI, Card, etc.      |
| description | TEXT          | Transaction description    |
| category    | TEXT          | Category name              |
| amount      | NUMERIC(14,2) | Amount                     |
| created_at  | TIMESTAMPTZ   | Created at                 |
| imported    | BOOLEAN       | Whether imported from file |

### budgety_savings_goals

| Column         | Type          | Description    |
| -------------- | ------------- | -------------- |
| id             | TEXT (PK)     | UUID           |
| name           | TEXT          | Goal name      |
| target_amount  | NUMERIC(14,2) | Target amount  |
| current_amount | NUMERIC(14,2) | Current amount |
| created_at     | TIMESTAMPTZ   | Created at     |

### budgety_budgets

| Column | Type | Description |
| --- | --- | --- |
| id | TEXT (PK) | UUID |
| category | TEXT | Category name |
| amount | NUMERIC(14,2) | Budget limit |
| month | INTEGER | 1–12 |
| year | INTEGER | Year |
| created_at | TIMESTAMPTZ | Created at |
| UNIQUE | (category, month, year) | One budget per category per month/year |

### budgety_recurring_transactions

| Column      | Type          | Description                 |
| ----------- | ------------- | --------------------------- |
| id          | TEXT (PK)     | UUID                        |
| type        | TEXT          | income \| expense           |
| description | TEXT          | Description                 |
| category    | TEXT          | Category                    |
| amount      | NUMERIC(14,2) | Amount                      |
| recurrence  | TEXT          | daily/weekly/monthly/yearly |
| start_date  | DATE          | Start date                  |
| end_date    | DATE          | Optional end                |
| created_at  | TIMESTAMPTZ   | Created at                  |

### budgety_bill_reminders

| Column        | Type          | Description          |
| ------------- | ------------- | -------------------- |
| id            | TEXT (PK)     | UUID                 |
| name          | TEXT          | Bill name            |
| category      | TEXT          | Category             |
| amount        | NUMERIC(14,2) | Amount               |
| due_date      | DATE          | Due date             |
| reminder_days | INTEGER       | Days before reminder |
| is_recurring  | BOOLEAN       | Recurring flag       |
| recurrence    | TEXT          | e.g. monthly         |
| is_paid       | BOOLEAN       | Paid flag            |
| paid_date     | TIMESTAMPTZ   | When marked paid     |
| created_at    | TIMESTAMPTZ   | Created at           |

### budgety_categories

All category options (income and expense) are stored in the DB and separated by type.

| Column     | Type         | Description                     |
| ---------- | ------------ | ------------------------------- |
| id         | TEXT (PK)    | UUID                            |
| name       | TEXT         | Category name                   |
| type       | TEXT         | `income` \| `expense`           |
| created_at | TIMESTAMPTZ  | Created at                      |
| UNIQUE     | (name, type) | Same name allowed for each type |

Create the table with `scripts/create-categories-table.sql`. On first load, the app seeds it with default income and expense categories from constants if the table is empty.

## Running the app (Next.js)

1. Copy `.env.example` to `.env.local`.
2. In [Neon Console](https://console.neon.tech), open your project → Connection details, and set `DATABASE_URL` in `.env.local`.
3. Install dependencies: `npm install`
4. Run: `npm run dev` (app and API run together on port 3000; API routes live at `/api/*`).

For production: `npm run build` then `npm run start`. Deploy to Vercel, Railway, or any Node host that supports Next.js.
