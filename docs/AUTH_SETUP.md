# Auth setup (Better Auth + Neon)

Budgety uses [Better Auth](https://better-auth.com) with your Neon PostgreSQL database for email/password sign in and sign up.

## 1. Create auth tables in Neon

Run the SQL migration once to create `user`, `session`, `account`, and `verification` tables:

**Option A – Neon SQL Editor**

1. Open [Neon Console](https://console.neon.tech) → your project → SQL Editor.
2. Paste and run the contents of `scripts/init-auth-tables.sql`.

**Option B – psql**

```bash
psql "$DATABASE_URL" -f scripts/init-auth-tables.sql
```

## 2. Environment variables

In `.env.local` (or `.env`), set:

```env
# Existing
DATABASE_URL=postgresql://...?sslmode=require

# Auth (required)
BETTER_AUTH_SECRET=<at-least-32-characters>

# Optional – defaults to http://localhost:3000 or https://$VERCEL_URL
# BETTER_AUTH_URL=http://localhost:3000
```

Generate a secret:

```bash
openssl rand -base64 32
```

## 3. Connection pooling (recommended for serverless)

For serverless (e.g. Vercel), use Neon’s **pooled** connection string so the `pg` driver doesn’t exhaust connections:

- In Neon Console: **Connection details** → enable **Connection pooling**.
- Use the URL with `-pooler` in the host (e.g. `ep-xxx-pooler.us-east-2.aws.neon.tech`).

## 4. Run the app

```bash
npm run dev
```

- Unauthenticated users see the **Sign in** / **Sign up** form.
- After signing in, they see the app; **Sign out** is in the header.

## Flow

- **Sign up**: name, email, password → stored in Neon `user` and `account` (credential).
- **Sign in**: email, password → session stored in `session`; cookie set for the app.
- **Sign out**: session invalidated; cookie cleared.

All auth data lives in your Neon project alongside Budgety’s existing tables.
