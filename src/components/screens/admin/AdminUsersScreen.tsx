"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import dayjs from "dayjs";

import { ERROR_MESSAGES, TIMEOUTS, UI_TEXT } from "@constants";

import { ADMIN_API_ROUTES, ADMIN_USER_ROLES, type AdminUserRole } from "@constants/admin";

import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Spinner,
} from "@common";

import {
  DeleteIcon,
  MoreVertIcon,
  PersonIcon,
  RefreshIcon,
  SearchIcon,
  ShieldIcon,
} from "@components/icons";

import { useAppSelector } from "@store/hooks";
import { cn } from "@utils/cn";
import { showError, showSuccess } from "@utils/toast";

import { adminFetch } from "@/lib/adminApiClient";
import type { AdminUserListItem } from "@/types";

type PendingAction =
  | { type: "promote"; user: AdminUserListItem }
  | { type: "demote"; user: AdminUserListItem }
  | { type: "disable"; user: AdminUserListItem }
  | { type: "enable"; user: AdminUserListItem }
  | { type: "delete"; user: AdminUserListItem }
  | null;

function formatAuthTimestamp(value: string | null): string {
  if (!value) return UI_TEXT.ADMIN_NEVER_SIGNED_IN;
  const d = dayjs(value);
  return d.isValid() ? d.format("DD MMM YYYY") : UI_TEXT.ADMIN_NEVER_SIGNED_IN;
}

function roleBadgeTone(role: AdminUserRole) {
  return role === ADMIN_USER_ROLES.ADMIN ? "info" : "neutral";
}

async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // ignore parse errors
  }
  return ERROR_MESSAGES.ADMIN_REQUEST_FAILED;
}

function UserCardMenu({
  user,
  isSelf,
  onPromote,
  onDemote,
  onDisable,
  onEnable,
  onDelete,
}: {
  user: AdminUserListItem;
  isSelf: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  const isAdmin = user.role === ADMIN_USER_ROLES.ADMIN;
  const canPromote = !isAdmin;
  const canDemote = isAdmin && !isSelf;
  const canDisable = !user.disabled && !isSelf;
  const canEnable = user.disabled;
  const canDelete = !isSelf;
  const hasActions = canPromote || canDemote || canDisable || canEnable || canDelete;

  if (!hasActions) return null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        aria-label={UI_TEXT.MORE_OPTIONS}
        aria-expanded={open}
      >
        <MoreVertIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-elevated">
          {canPromote && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-surface-low"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onPromote();
              }}
            >
              <ShieldIcon className="h-4 w-4" />
              {UI_TEXT.ADMIN_PROMOTE}
            </button>
          )}
          {canDemote && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-surface-low"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDemote();
              }}
            >
              <PersonIcon className="h-4 w-4" />
              {UI_TEXT.ADMIN_DEMOTE}
            </button>
          )}
          {canDisable && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-expense hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDisable();
              }}
            >
              {UI_TEXT.ADMIN_DISABLE}
            </button>
          )}
          {canEnable && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-surface-low"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEnable();
              }}
            >
              {UI_TEXT.ADMIN_ENABLE}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-expense hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
            >
              <DeleteIcon className="h-4 w-4" />
              {UI_TEXT.ADMIN_DELETE}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUsersScreen() {
  const currentUid = useAppSelector((s) => s.auth.user?.uid);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, TIMEOUTS.SEARCH_DEBOUNCE);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const loadUsers = useCallback(
    async (opts?: { pageToken?: string | null; append?: boolean }) => {
      const append = Boolean(opts?.append);
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (opts?.pageToken) params.set("pageToken", opts.pageToken);
        const qs = params.toString();
        const url = qs ? `${ADMIN_API_ROUTES.users}?${qs}` : ADMIN_API_ROUTES.users;
        const res = await adminFetch(url);
        if (!res.ok) {
          showError(await readApiError(res));
          if (!append) setUsers([]);
          return;
        }
        const data = (await res.json()) as {
          users: AdminUserListItem[];
          nextPageToken: string | null;
          truncated?: boolean;
        };
        setUsers((prev) => (append ? [...prev, ...data.users] : data.users));
        setNextPageToken(data.nextPageToken);
        setTruncated(Boolean(data.truncated));
      } catch {
        showError(ERROR_MESSAGES.ADMIN_REQUEST_FAILED);
        if (!append) setUsers([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const applyUserUpdate = (updated: AdminUserListItem) => {
    setUsers((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
  };

  const removeUser = (uid: string) => {
    setUsers((prev) => prev.filter((u) => u.uid !== uid));
  };

  const runPendingAction = async () => {
    if (!pending) return;
    setActionLoading(true);
    try {
      if (pending.type === "delete") {
        const res = await adminFetch(ADMIN_API_ROUTES.user(pending.user.uid), {
          method: "DELETE",
        });
        if (!res.ok) {
          showError(await readApiError(res));
          return;
        }
        removeUser(pending.user.uid);
        showSuccess(UI_TEXT.ADMIN_ACTION_SUCCESS_DELETED);
        setPending(null);
        return;
      }

      const body =
        pending.type === "promote"
          ? { role: ADMIN_USER_ROLES.ADMIN }
          : pending.type === "demote"
            ? { role: ADMIN_USER_ROLES.USER }
            : pending.type === "disable"
              ? { disabled: true }
              : { disabled: false };

      const res = await adminFetch(ADMIN_API_ROUTES.user(pending.user.uid), {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        showError(await readApiError(res));
        return;
      }
      const data = (await res.json()) as { user: AdminUserListItem };
      applyUserUpdate(data.user);

      if (pending.type === "promote") showSuccess(UI_TEXT.ADMIN_ACTION_SUCCESS_PROMOTED);
      if (pending.type === "demote") showSuccess(UI_TEXT.ADMIN_ACTION_SUCCESS_DEMOTED);
      if (pending.type === "disable") showSuccess(UI_TEXT.ADMIN_ACTION_SUCCESS_DISABLED);
      if (pending.type === "enable") showSuccess(UI_TEXT.ADMIN_ACTION_SUCCESS_ENABLED);
      setPending(null);
    } catch {
      showError(ERROR_MESSAGES.ADMIN_REQUEST_FAILED);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCopy = (() => {
    if (!pending) {
      return {
        title: UI_TEXT.CONFIRM_ACTION,
        message: UI_TEXT.CONFIRM_DEFAULT_MESSAGE,
        confirmLabel: UI_TEXT.CONFIRM,
        danger: true,
      };
    }
    switch (pending.type) {
      case "promote":
        return {
          title: UI_TEXT.ADMIN_PROMOTE_CONFIRM_TITLE,
          message: UI_TEXT.ADMIN_PROMOTE_CONFIRM_MESSAGE,
          confirmLabel: UI_TEXT.ADMIN_PROMOTE,
          danger: false,
        };
      case "demote":
        return {
          title: UI_TEXT.ADMIN_DEMOTE_CONFIRM_TITLE,
          message: UI_TEXT.ADMIN_DEMOTE_CONFIRM_MESSAGE,
          confirmLabel: UI_TEXT.ADMIN_DEMOTE,
          danger: true,
        };
      case "disable":
        return {
          title: UI_TEXT.ADMIN_DISABLE_CONFIRM_TITLE,
          message: UI_TEXT.ADMIN_DISABLE_CONFIRM_MESSAGE,
          confirmLabel: UI_TEXT.ADMIN_DISABLE,
          danger: true,
        };
      case "enable":
        return {
          title: UI_TEXT.ADMIN_ENABLE_CONFIRM_TITLE,
          message: UI_TEXT.ADMIN_ENABLE_CONFIRM_MESSAGE,
          confirmLabel: UI_TEXT.ADMIN_ENABLE,
          danger: false,
        };
      case "delete":
        return {
          title: UI_TEXT.ADMIN_DELETE_CONFIRM_TITLE,
          message: UI_TEXT.ADMIN_DELETE_CONFIRM_MESSAGE,
          confirmLabel: UI_TEXT.ADMIN_DELETE,
          danger: true,
        };
      default:
        return {
          title: UI_TEXT.CONFIRM_ACTION,
          message: UI_TEXT.CONFIRM_DEFAULT_MESSAGE,
          confirmLabel: UI_TEXT.CONFIRM,
          danger: true,
        };
    }
  })();

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-4 md:max-w-2xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-deep">
            {UI_TEXT.ADMIN_USERS_TITLE}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{UI_TEXT.ADMIN_USERS_SUBTITLE}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshIcon className="h-4 w-4" />}
          onClick={() => void loadUsers()}
          disabled={loading}
          aria-label={UI_TEXT.REFRESH}
        >
          {UI_TEXT.REFRESH}
        </Button>
      </header>

      <Field label={UI_TEXT.SEARCH_LABEL}>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={UI_TEXT.ADMIN_USERS_SEARCH_PLACEHOLDER}
            className="pl-9"
          />
        </div>
      </Field>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner label={UI_TEXT.LOADING} />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<PersonIcon className="h-6 w-6" />}
          title={UI_TEXT.ADMIN_USERS_EMPTY_TITLE}
          description={UI_TEXT.ADMIN_USERS_EMPTY_DESCRIPTION}
        />
      ) : (
        <ul className="space-y-3">
          {users.map((user) => {
            const isSelf = user.uid === currentUid;
            return (
              <li
                key={user.uid}
                className={cn(
                  "rounded-card border border-outline-variant/60 bg-card p-4 shadow-card",
                  user.disabled && "opacity-75",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-brand-deep">
                        {user.displayName || user.email || user.uid}
                      </p>
                      <Badge tone={roleBadgeTone(user.role)}>
                        {user.role === ADMIN_USER_ROLES.ADMIN
                          ? UI_TEXT.ADMIN_ROLE_ADMIN
                          : UI_TEXT.ADMIN_ROLE_USER}
                      </Badge>
                      <Badge tone={user.disabled ? "danger" : "success"}>
                        {user.disabled
                          ? UI_TEXT.ADMIN_STATUS_DISABLED
                          : UI_TEXT.ADMIN_STATUS_ACTIVE}
                      </Badge>
                      {isSelf && <Badge tone="neutral">{UI_TEXT.ADMIN_YOU}</Badge>}
                    </div>
                    {user.email && (
                      <p className="mt-1 truncate text-sm text-on-surface-variant">{user.email}</p>
                    )}
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {UI_TEXT.ADMIN_CREATED_AT}: {formatAuthTimestamp(user.createdAt)}
                      {" · "}
                      {UI_TEXT.ADMIN_LAST_SIGN_IN}: {formatAuthTimestamp(user.lastSignInAt)}
                    </p>
                  </div>
                  <UserCardMenu
                    user={user}
                    isSelf={isSelf}
                    onPromote={() => setPending({ type: "promote", user })}
                    onDemote={() => setPending({ type: "demote", user })}
                    onDisable={() => setPending({ type: "disable", user })}
                    onEnable={() => setPending({ type: "enable", user })}
                    onDelete={() => setPending({ type: "delete", user })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {truncated && (
        <p className="text-center text-xs text-on-surface-variant">{UI_TEXT.ADMIN_USERS_TRUNCATED}</p>
      )}

      {!searchQuery && nextPageToken && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            loading={loadingMore}
            onClick={() => void loadUsers({ pageToken: nextPageToken, append: true })}
          >
            {UI_TEXT.ADMIN_USERS_LOAD_MORE}
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-on-surface-variant">{UI_TEXT.ADMIN_DELETE_DATA_NOTE}</p>

      <ConfirmDialog
        open={Boolean(pending)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        danger={confirmCopy.danger}
        loading={actionLoading}
        onConfirm={() => void runPendingAction()}
        onCancel={() => {
          if (!actionLoading) setPending(null);
        }}
      />
    </div>
  );
}
