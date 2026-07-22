import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  return toAuthUser(cred.user);
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
        state.user = action.payload;
        state.loading = false;
        state.initialized = true;
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
  return onAuthStateChanged(auth, (user) => {
    dispatch(setAuthUser(user ? toAuthUser(user) : null));
  });
}
