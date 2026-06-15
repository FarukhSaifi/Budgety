# Vercel environment variables (Budgety)

Secrets live in the **Vercel project**, not in git. Use `.env.example` as the template and `.env.local` for local development.

**Project:** `farukh-saifis-projects/budgety`  
**Production URL:** https://budgety-woad.vercel.app

## Required variables

| Variable | Production | Preview | Development (`vercel dev`) | Local (`.env.local`) |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Encrypted (Neon pooled) | Same | Same | Your Neon pooled URL |
| `BETTER_AUTH_SECRET` | Encrypted (min 32 chars) | **Add in dashboard** (match Production) | Optional | `openssl rand -base64 32` |
| `BETTER_AUTH_API_KEY` | Encrypted (from Better Auth Dash) | Same as Production | Optional | Copy from Better Auth dashboard |
| `BETTER_AUTH_URL` | `https://budgety-woad.vercel.app` (no trailing slash) | Optional (falls back to `VERCEL_URL`) | `http://localhost:3000` | `http://localhost:3000` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | `https://budgety-woad.vercel.app` | Same as production URL | `http://localhost:3000` | `http://localhost:3000` |

`NEXT_PUBLIC_*` values are **not secrets** — they are exposed to the browser. Never put `DATABASE_URL` or `BETTER_AUTH_SECRET` in a `NEXT_PUBLIC_` variable.

## Removed (legacy Vite app)

These are no longer used by the Next.js app and should be deleted from Vercel if still present:

- `VITE_API_URL`
- `PORT`

## Local setup

```bash
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL and BETTER_AUTH_SECRET
npm run dev
```

Or sync non-sensitive / development values from Vercel:

```bash
npx vercel env pull .env.local --environment=development --yes
# Then add BETTER_AUTH_SECRET manually (not pulled when sensitive-only on Production)
```

## Vercel CLI (production)

```bash
npx vercel link   # once per machine
npx vercel env ls

# Example: set public production URL (safe to repeat)
npx vercel env add BETTER_AUTH_URL production \
  --value "https://budgety-woad.vercel.app" --no-sensitive --yes --force

# Sensitive secret (Production only via CLI; Preview may require dashboard)
openssl rand -base64 32 | npx vercel env add BETTER_AUTH_SECRET production --yes --sensitive --force
```

### Preview deployments

Add `BETTER_AUTH_SECRET` for **Preview → All branches** in the Vercel dashboard (Settings → Environment Variables), using the **same value as Production** so auth cookies behave consistently against the shared Neon database.

## After changing env vars

Redeploy production so new variables apply:

```bash
npx vercel --prod
```

Or trigger a deploy from the Vercel dashboard.

## Auth tables

Run `scripts/init-auth-tables.sql` once in Neon before first sign-up. See [AUTH_SETUP.md](./AUTH_SETUP.md).
