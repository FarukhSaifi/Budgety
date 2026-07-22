# Vercel environment variables (Budgety)

Secrets live in the **Vercel project**, not in git. Use `.env.example` as the template and `.env.local` for local development.

**Project:** `farukh-saifis-projects/budgety`  
**Production URL:** https://budgety-woad.vercel.app

## Required variables

| Variable | Production | Preview | Development (`vercel dev`) | Local (`.env.local`) |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Encrypted (Neon pooled) | Same | Same | Your Neon pooled URL |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase console | Same as Production | From Firebase console | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project-id>.firebaseapp.com` | Same as Production | Same | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Same as Production | Same | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `<project-id>.appspot.com` | Same as Production | Same | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console | Same as Production | Same | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase console | Same as Production | Same | Same |

`NEXT_PUBLIC_*` values are **not secrets** — they are exposed to the browser. Never put `DATABASE_URL` in a `NEXT_PUBLIC_` variable.

See [AUTH_SETUP.md](./AUTH_SETUP.md) for how to obtain Firebase config values.

## Removed (legacy)

These are no longer used by the Next.js app and should be deleted from Vercel if still present:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_API_KEY`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `VITE_API_URL`
- `PORT`

## Local setup

```bash
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL and NEXT_PUBLIC_FIREBASE_* values
npm run dev
```

Or sync non-sensitive / development values from Vercel:

```bash
npx vercel env pull .env.local --environment=development --yes
```

## Vercel CLI (production)

```bash
npx vercel link   # once per machine
npx vercel env ls

# Example: set a public Firebase config value (safe to repeat)
npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production \
  --value "your-project-id" --no-sensitive --yes --force
```

### Preview deployments

Set the same `NEXT_PUBLIC_FIREBASE_*` values for **Preview → All branches** so auth works on preview URLs. Add each preview domain under **Firebase → Authentication → Settings → Authorized domains**.

## After changing env vars

Redeploy production so new variables apply:

```bash
npx vercel --prod
```

Or trigger a deploy from the Vercel dashboard.
