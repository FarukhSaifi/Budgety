import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function getFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: unknown }).code || "");
  }
  return "";
}

/**
 * Prefer full-page redirect on mobile (popups are unreliable).
 * Desktop uses popup; redirect is the fallback when the popup is blocked.
 * Production redirect requires same-origin authDomain + `/__/auth` proxy
 * (see firebase.ts + next.config.js) — otherwise Chrome blocks session restore.
 */
function preferGoogleRedirect(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/** Consume redirect result once (React Strict Mode remounts must not race). */
let redirectResultPromise: Promise<UserCredential | null> | null = null;

function consumeRedirectResult(): Promise<UserCredential | null> {
  if (!isFirebaseConfigured) return Promise.resolve(null);
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth).catch((error: unknown) => {
      // Re-throw after clearing the cache so a future retry can run.
      redirectResultPromise = null;
      throw error;
    });
  }
  return redirectResultPromise;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: isFirebaseConfigured,
  error: null,
  isConfigured: isFirebaseConfigured,
  initialized: !isFirebaseConfigured,
};

export const signInWithEmail = createAsyncThunk(
  "auth/signInWithEmail",
  async ({ email, password }: { email: string; password: string }) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return toAuthUser(cred.user);
  },
);

export const signUpWithEmail = createAsyncThunk(
  "auth/signUpWithEmail",
  async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    return toAuthUser(cred.user);
  },
);

export const signInWithGoogle = createAsyncThunk("auth/signInWithGoogle", async () => {
  const provider = createGoogleProvider();

  if (preferGoogleRedirect()) {
    await signInWithRedirect(auth, provider);
    // Browser navigates away; callers should not expect a resolved user here.
    return null;
  }

  try {
    const cred = await signInWithPopup(auth, provider);
    return toAuthUser(cred.user);
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    // Popup blocked → fall back to full-page redirect (needs auth proxy on Vercel).
    if (code === "auth/popup-blocked") {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
});

export const signOutUser = createAsyncThunk("auth/signOut", async () => {
  await firebaseSignOut(auth);
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.loading = false;
      state.initialized = true;
      state.error = null;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
      state.initialized = true;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => {
      state.loading = true;
      state.error = null;
    };
    const rejected = (state: AuthState, action: { error: { message?: string } }) => {
      state.loading = false;
      state.error = action.error.message ?? "Authentication failed";
    };

    builder
      .addCase(signInWithEmail.pending, pending)
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(signInWithEmail.rejected, rejected)
      .addCase(signUpWithEmail.pending, pending)
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(signUpWithEmail.rejected, rejected)
      .addCase(signInWithGoogle.pending, pending)
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.initialized = true;
        }
        // null payload = redirect in progress; keep loading until auth state returns
        state.loading = Boolean(!action.payload);
      })
      .addCase(signInWithGoogle.rejected, rejected)
      .addCase(signOutUser.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
      });
  },
});

export const { setAuthUser, setAuthLoading, setAuthError, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

export type AuthChangeListener = (
  action:
    | ReturnType<typeof setAuthUser>
    | ReturnType<typeof setAuthLoading>
    | ReturnType<typeof setAuthError>,
) => void;

/** Subscribe once at app root — syncs Firebase session into Redux. */
export function listenToAuthChanges(
  dispatch: AuthChangeListener,
  options?: { onRedirectError?: (message: string) => void },
) {
  if (!isFirebaseConfigured) {
    dispatch(setAuthUser(null));
    return () => undefined;
  }
  dispatch(setAuthLoading(true));

  let cancelled = false;
  let unsubscribe: (() => void) | undefined;

  // Await redirect completion before onAuthStateChanged so a transient null
  // user does not mark the app initialized and wipe collections.
  void (async () => {
    try {
      const cred = await consumeRedirectResult();
      if (cancelled) return;
      if (cred?.user) {
        dispatch(setAuthUser(toAuthUser(cred.user)));
      }
    } catch (error: unknown) {
      if (cancelled) return;
      const message = getAuthErrorMessage(error);
      dispatch(setAuthError(message));
      options?.onRedirectError?.(message);
    }

    if (cancelled) return;
    unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch(setAuthUser(user ? toAuthUser(user) : null));
    });
  })();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
