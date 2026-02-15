-- Categories table: all category types (income & expense) in DB, separated by type.
-- Run this in Neon SQL Editor (or psql). Seed data is inserted by the app on first load or via scripts/seed-categories.js.

CREATE TABLE IF NOT EXISTS budgety_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, type)
);

CREATE INDEX IF NOT EXISTS idx_budgety_categories_type ON budgety_categories (type);
CREATE INDEX IF NOT EXISTS idx_budgety_categories_type_name ON budgety_categories (type, name);
