"use client";

import { GMAIL_DEFAULTS, GMAIL_UI_TEXT } from "@constants";

import { Button } from "@components/common/Button";
import { Spinner } from "@components/common/Spinner";
import { CheckCircleIcon, CloudUploadIcon, WarningIcon } from "@components/icons";

import { useGmailIntegration } from "@hooks/useGmailIntegration";
import { useAppSelector } from "@store/hooks";

export function GmailIntegrationCard() {
  const userId = useAppSelector((s) => s.auth.user?.uid) || GMAIL_DEFAULTS.DEFAULT_USER_ID;
  const { status, isConfigured, loading, disconnecting, connectGmail, disconnectGmail } = useGmailIntegration(userId);

  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <CloudUploadIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-brand-deep">{GMAIL_UI_TEXT.TITLE}</h4>
              {status.connected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCircleIcon className="h-3 w-3" />
                  {GMAIL_UI_TEXT.CONNECTED}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              {status.connected && status.email ? `Connected to ${status.email}` : GMAIL_UI_TEXT.DISCONNECTED_SUBTITLE}
            </p>
            {status.lastSyncAt && (
              <p className="mt-1 text-[11px] text-gray-400">
                {GMAIL_UI_TEXT.LAST_SYNCED.replace("{time}", new Date(status.lastSyncAt).toLocaleString())}
              </p>
            )}
          </div>
        </div>

        <div>
          {loading ? (
            <Spinner className="h-4 w-4" />
          ) : status.connected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnecting}
              onClick={disconnectGmail}
              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!isConfigured}
              onClick={connectGmail}
              className="text-xs"
            >
              {GMAIL_UI_TEXT.CONNECT_BUTTON}
            </Button>
          )}
        </div>
      </div>

      {!isConfigured && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
          <WarningIcon className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            Requires <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>.env.local</code>.
          </span>
        </div>
      )}
    </div>
  );
}
