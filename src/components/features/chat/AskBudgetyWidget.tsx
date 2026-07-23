"use client";

import { useState } from "react";

import { UI_TEXT } from "@constants";

import { Button } from "@components/common/Button";
import { AutoAwesomeIcon, CloseIcon, SendIcon } from "@components/icons";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  addChatMessage,
  setChatOpen,
  setChatStatus,
  toggleChatOpen,
} from "@store/slices/chatSlice";
import { cn } from "@utils/cn";

/**
 * Floating “Ask Budgety” co-pilot shell.
 * Phase 3 wires `/api/ai-chat`; for now replies with a graceful stub.
 */
export function AskBudgetyWidget() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.chat.open);
  const messages = useAppSelector((s) => s.chat.messages);
  const status = useAppSelector((s) => s.chat.status);
  const [draft, setDraft] = useState("");

  const send = async () => {
    const content = draft.trim();
    if (!content || status === "loading") return;
    const now = new Date().toISOString();
    dispatch(
      addChatMessage({
        id: `u-${now}`,
        role: "user",
        content,
        createdAt: now,
      }),
    );
    setDraft("");
    dispatch(setChatStatus({ status: "loading" }));

    // Phase 3: POST /api/ai-chat with Redux financial context.
    await new Promise((r) => setTimeout(r, 400));
    dispatch(
      addChatMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        content:
          "Ask Budgety AI will answer from your live finances in Phase 3. Try questions like “How much did I spend on dining this month?” once Gemini chat is enabled.",
        createdAt: new Date().toISOString(),
      }),
    );
    dispatch(setChatStatus({ status: "succeeded" }));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dispatch(toggleChatOpen())}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-main text-white shadow-elevated transition hover:brightness-110 md:bottom-8 md:right-8"
        aria-label={UI_TEXT.ASK_BUDGETY}
      >
        <AutoAwesomeIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-card shadow-elevated md:bottom-24 md:right-8">
          <header className="flex items-center justify-between gap-2 border-b border-outline-variant/40 bg-primary-soft/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <AutoAwesomeIcon className="h-5 w-5 text-primary-main" />
              <h2 className="text-sm font-bold text-brand-deep">{UI_TEXT.ASK_BUDGETY}</h2>
            </div>
            <button
              type="button"
              onClick={() => dispatch(setChatOpen(false))}
              className="rounded-full p-1 text-on-surface-variant hover:bg-surface-low"
              aria-label={UI_TEXT.CANCEL}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </header>

          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <p className="text-xs text-on-surface-variant">
                Ask about spending, safe-to-spend, or goals. Gemini chat ships in Phase 3.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary-main text-white"
                    : "mr-auto bg-surface-low text-brand-deep",
                )}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-outline-variant/40 p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Ask Budgety…"
              className="h-10 flex-1 rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm text-brand-deep outline-none focus:ring-2 focus:ring-(--focus-ring)"
            />
            <Button
              size="sm"
              onClick={() => void send()}
              disabled={!draft.trim() || status === "loading"}
              aria-label="Send"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
