import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
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

/** Prefer redirect on production — browsers often block OAuth popups on Vercel/mobile. */
function preferGoogleRedirect(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "production") return true;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
    // Popup blocked locally → fall back to full-page redirect.
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

export const { setAuthUser, setAuthLoading, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

/** Subscribe once at app root — syncs Firebase session into Redux. */
export function listenToAuthChanges(
  dispatch: (action: ReturnType<typeof setAuthUser> | ReturnType<typeof setAuthLoading>) => void,
) {
  if (!isFirebaseConfigured) {
    dispatch(setAuthUser(null));
    return () => undefined;
  }
  dispatch(setAuthLoading(true));

  // Complete Google redirect sign-in after returning from the IdP (production / mobile).
  void getRedirectResult(auth).catch(() => {
    // Errors surface via onAuthStateChanged / next sign-in attempt.
  });

  return onAuthStateChanged(auth, (user) => {
    dispatch(setAuthUser(user ? toAuthUser(user) : null));
  });
}
