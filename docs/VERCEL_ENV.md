# Vercel environment variables (Budgety)

Secrets live in the **Vercel project**, not in git. Use `.env.example` as the template and `.env.local` for local development.

**Project:** `farukh-saifis-projects/budgety`  
**Production URL:** https://budgety-woad.vercel.app  
**Firebase project:** `budgety-e7e94`

## Required on Vercel (Production + Preview)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Usually `budgety-e7e94.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `budgety-e7e94` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase console |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server-only — bank statement AI import (`/api/parse-statement`) |

`NEXT_PUBLIC_*` values are public (safe in the browser). Never put API secrets in `NEXT_PUBLIC_*`.

## Do **not** set on Vercel

| Variable | Why |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` | Points the client at a local emulator — breaks production auth |
| `DATABASE_URL` | Legacy Neon — unused by the Firebase app (safe to delete from Vercel) |

## Firebase Auth domains (required for Google sign-in on Vercel)

In [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/budgety-e7e94/authentication/settings) add:

- `localhost` (dev)
- `budgety-e7e94.firebaseapp.com`
- **`budgety-woad.vercel.app`** (production)
- Any custom domain you attach later
- Preview hosts (e.g. `budgety-xxx.vercel.app`) if you use Google sign-in on PR previews

Without the Vercel host listed, Google sign-in fails with `auth/unauthorized-domain` (or related OAuth errors).

Google sign-in on production uses **full-page redirect** (not a popup) to avoid `auth/popup-blocked` in browsers.

## After changing env vars

Redeploy so Next.js picks up new `NEXT_PUBLIC_*` values at build time:

```bash
npx vercel --prod
```

Or redeploy from the Vercel dashboard.

## Local setup

```bash
cp .env.example .env.local
# Fill NEXT_PUBLIC_FIREBASE_* and GOOGLE_GENERATIVE_AI_API_KEY
npm run dev
```
