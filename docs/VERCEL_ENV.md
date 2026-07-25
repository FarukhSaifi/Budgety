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
| `FIREBASE_ADMIN_PROJECT_ID` | Server-only — usually same as `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server-only — service account email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server-only — service account private key (`\n` escaped newlines OK) |
| `ADMIN_UIDS` | Server-only — comma-separated Firebase Auth UIDs for bootstrap admins |

`NEXT_PUBLIC_*` values are public (safe in the browser). Never put API secrets in `NEXT_PUBLIC_*`.

### First admin bootstrap

1. Sign in to the app once and copy your UID from Firebase Console → Authentication → Users.
2. Set `ADMIN_UIDS=<your-uid>` (and the three `FIREBASE_ADMIN_*` vars) on Vercel / `.env.local`.
3. Redeploy / restart `npm run dev`.
4. Open **Admin** from the desktop sidebar or Profile → Admin. Promote other users from there (custom claim `admin: true`).

Admin APIs verify the caller’s Firebase ID token and require either the `admin` custom claim or membership in `ADMIN_UIDS`. Firestore rules are unchanged — user listing uses the Auth Admin SDK, not a Firestore `users` collection.

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

### Google OAuth redirect URI (required for redirect / same-origin authDomain)

Production uses the app host as `authDomain` (same-origin) plus a Next.js rewrite of `/__/auth/*` → `https://budgety-e7e94.firebaseapp.com/__/auth/*`. That avoids Chrome blocking cross-origin Auth helper storage after `signInWithRedirect`.

In [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials?project=budgety-e7e94) open the **Web client** used by Firebase Google sign-in and ensure **Authorized redirect URIs** includes:

- `https://budgety-woad.vercel.app/__/auth/handler`

(Keep the existing `https://budgety-e7e94.firebaseapp.com/__/auth/handler` entry.)

### Sign-in strategy

- **Desktop:** `signInWithPopup` (Firebase’s recommended approach when not on Firebase Hosting).
- **Mobile / popup blocked:** `signInWithRedirect`, completed via `getRedirectResult` on bootstrap.

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
