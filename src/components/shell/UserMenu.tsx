"use client";

import { useEffect, useRef, useState } from "react";

import { UI_TEXT } from "@constants";

import { LogoutIcon } from "@components/icons";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { signOutUser } from "@store/slices/authSlice";
import { showSuccess } from "@utils/toast";

export function UserMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;

  const displayName = user.displayName || user.email || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await dispatch(signOutUser());
    showSuccess(UI_TEXT.AUTH_SUCCESS_SIGNED_OUT);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary-main"
        aria-label={displayName}
      >
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoURL} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-1000 mt-2 w-56 overflow-hidden rounded-2xl border border-outline-variant/60 bg-card shadow-elevated">
          <div className="border-b border-outline-variant/60 px-4 py-3">
            <p className="truncate text-sm font-semibold text-brand-deep">{displayName}</p>
            {user.email && <p className="truncate text-xs text-on-surface-variant">{user.email}</p>}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-brand-deep transition-colors hover:bg-surface-low"
          >
            <LogoutIcon className="h-4 w-4" />
            {UI_TEXT.SIGN_OUT}
          </button>
        </div>
      )}
    </div>
  );
}
