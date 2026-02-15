# Migrate to budgety-store database

Steps to create a new database named **budgety-store** and move all data from your current DB into it.

## 1. Create the new database in Neon

- Open [Neon Console](https://console.neon.tech) and select your project.
- Either:
  - **Create a new branch** and name it e.g. `budgety-store`, or
  - **Create a new project** and name it `budgety-store`.
- Copy the **connection string** for the new database (Connection details).

## 2. Set environment variables

In `.env` (or `.env.local`):

- Keep **DATABASE_URL** as your **current** database (source of data).
- Add **BUDGETY_STORE_DATABASE_URL** with the new database connection string.

Example:

```env
# Current DB (source)
DATABASE_URL=postgresql://...@ep-xxx/neondb?sslmode=require

# New budgety-store DB (target)
BUDGETY_STORE_DATABASE_URL=postgresql://...@ep-yyy/budgety-store?sslmode=require
```

## 3. Create tables in budgety-store

From the project root:

```bash
node scripts/init-budgety-store-db.js
```

(Uses `BUDGETY_STORE_DATABASE_URL` or `DATABASE_URL` to create the tables.)

Or with `psql`:

```bash
psql "$BUDGETY_STORE_DATABASE_URL" -f scripts/init-budgety-store-db.sql
```

## 4. Migrate data

```bash
DATABASE_URL=postgresql://... BUDGETY_STORE_DATABASE_URL=postgresql://... node scripts/migrate-to-budgety-store.js
```

If `.env` already has both variables:

```bash
node scripts/migrate-to-budgety-store.js
```

This copies all rows from the current DB into budgety-store (transactions, savings goals, budgets, recurring transactions, bill reminders). Duplicates by `id` are skipped.

## 5. Switch the app to budgety-store

In `.env`, set:

```env
DATABASE_URL=<paste value of BUDGETY_STORE_DATABASE_URL>
```

Restart the app. It will now use the budgety-store database.
