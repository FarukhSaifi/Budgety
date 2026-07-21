# Auth setup (Firebase Authentication)

Budgety uses [Firebase Authentication](https://firebase.google.com/docs/auth) for
email/password and Google sign-in. Authentication runs entirely on the client
via the Firebase Web SDK — there is no auth server route or auth database to
manage. Budget data still lives in Neon PostgreSQL (see `DATABASE_URL`).

## 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and create
   a project (the free **Spark** plan is sufficient).
2. **Build → Authentication → Get started.**
3. Enable the **Email/Password** provider.
4. (Optional) Enable the **Google** provider — set a support email.

## 2. Register a Web app and copy the config

1. Project settings (gear icon) → **General → Your apps → Add app → Web**.
2. Register the app; Firebase shows a `firebaseConfig` object.
3. Copy each value into `.env.local` (see below). These `NEXT_PUBLIC_*` values are
   public and safe to ship to the browser.

## 3. Environment variables

**Local:** copy `.env.example` to `.env.local` and fill in the values
(`.env.local` is gitignored). **Vercel:** set the same values in the project —
see [VERCEL_ENV.md](./VERCEL_ENV.md).

```env
# Budget data
DATABASE_URL=postgresql://...?sslmode=require

# Firebase (public — from the console SDK config)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
```

## 4. Authorized domains

For Google sign-in, the domain hosting the app must be in
**Authentication → Settings → Authorized domains**. `localhost` and your
Vercel domains are usually added automatically; add custom domains manually.
Use the bare host only (e.g. `localhost`, not `http://localhost:3000`).

## 5. Run the app

```bash
npm run dev
```

- Unauthenticated users see the **Sign in / Sign up** form.
- After signing in, they see the app; **Sign out** is in the header.

## Flow

- **Sign up**: name, email, password → creates a Firebase user; display name is
  stored on the profile.
- **Sign in**: email/password or Google → Firebase issues a session that the SDK
  persists in the browser (`onAuthStateChanged` drives the UI).
- **Sign out**: clears the Firebase session.

## Local testing without a real project (Auth emulator)

You can exercise the full sign-up / sign-in / sign-out flow without creating a
Firebase project by using the local Auth emulator:

```bash
# terminal 1 — start the emulator (uses a throwaway demo project)
npm run emulators

# terminal 2 — point the client at the emulator, then run the app
#   set these in .env.local:
#   NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
#   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-budgety
#   NEXT_PUBLIC_FIREBASE_APP_ID=demo-app
#   NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
npm run dev
```

Email/password accounts created in the emulator live only for the emulator
session. Google popup sign-in is not exercised by the emulator.
