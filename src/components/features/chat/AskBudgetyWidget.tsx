"use client";

import { useMemo, useRef, useState } from "react";

import { ASSISTANT_CONSENT_STORAGE_KEY, UI_TEXT } from "@constants";

import { Button } from "@components/common/Button";
import { AutoAwesomeIcon, CloseIcon, SendIcon } from "@components/icons";

import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectPeriodAggregates } from "@store/selectors/periodSelectors";
import { addChatMessage, setChatOpen, setChatStatus, toggleChatOpen } from "@store/slices/chatSlice";
import { cn } from "@utils/cn";

import type { FinanceSnapshot } from "@/lib/assistant/prompt";

const SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "What’s my safe-to-spend right now?",
  "Am I on track with my budgets?",
];

function readConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ASSISTANT_CONSENT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Floating “Ask Budgety” co-pilot — posts to `/api/assistant` with a finance snapshot.
 */
export function AskBudgetyWidget() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.chat.open);
  const messages = useAppSelector((s) => s.chat.messages);
  const status = useAppSelector((s) => s.chat.status);
  const debts = useAppSelector((s) => s.debt.items);
  const netWorthItems = useAppSelector((s) => s.netWorth.items);
  const goals = useAppSelector((s) => s.goals.items);
  const budgets = useAppSelector((s) => s.budgets.items);
  const bills = useAppSelector((s) => s.bills.items);
  const period = useAppSelector(selectPeriodAggregates);
  const [draft, setDraft] = useState("");
  const [consent, setConsent] = useState(readConsent);
  const messageSeqRef = useRef(0);

  const nextMessageId = (prefix: string) => {
    messageSeqRef.current += 1;
    return `${prefix}-${messageSeqRef.current}`;
  };

  const snapshot = useMemo((): FinanceSnapshot => {
    const totalDebt = debts.reduce((s, d) => s + (d.balance || 0), 0);
    const assets = netWorthItems.reduce((s, i) => s + (i.balance || 0), 0);
    const spendingByCategory = Object.entries(period.spendingByCategory ?? {})
      .map(([category, amount]) => ({ category, amount: Number(amount) || 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15);

    const budgetSpent = period.spendingByCategory ?? {};
    const budgetRows = budgets.slice(0, 12).map((b) => ({
      category: b.category,
      limit: Number(b.limitAmount) || 0,
      spent: Number(budgetSpent[b.category]) || 0,
    }));

    const upcomingBills = bills
      .filter((b) => !b.isPaid && b.status !== "paid")
      .slice(0, 12)
      .map((b) => ({
        title: b.title || b.name || "Bill",
        amount: Number(b.amount) || 0,
        dueDate: b.dueDate,
      }));

    const recentTransactions = (period.filteredTransactions ?? []).slice(0, 30).map((t) => ({
      date: t.date,
      title: t.title || t.description || "",
      category: t.category,
      amount: Number(t.amount) || 0,
      type: t.type,
    }));

    return {
      periodLabel: "selected period",
      income: period.totalIncome,
      expense: period.totalExpense,
      net: period.balance,
      currentBalance: period.balance,
      netWorth: assets - totalDebt,
      safeToSpend: period.totalIncome - period.totalExpense,
      spendingByCategory,
      budgets: budgetRows,
      upcomingBills,
      recentTransactions,
      goalsSummary:
        goals.length === 0
          ? "none"
          : goals
              .slice(0, 4)
              .map((g) => `${g.title || g.name}: ${g.savedAmount}/${g.targetAmount}`)
              .join("; "),
    };
  }, [bills, budgets, debts, goals, netWorthItems, period]);

  const acceptConsent = () => {
    try {
      window.localStorage.setItem(ASSISTANT_CONSENT_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setConsent(true);
  };

  const send = async (text?: string) => {
    const content = (text ?? draft).trim();
    if (!content || status === "loading" || !consent) return;
    const createdAt = new Date().toISOString();
    dispatch(
      addChatMessage({
        id: nextMessageId("u"),
        role: "user",
        content,
        createdAt,
      }),
    );
    setDraft("");
    dispatch(setChatStatus({ status: "loading" }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, consent: true, snapshot }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || UI_TEXT.ASSISTANT_ERROR);
      }
      dispatch(
        addChatMessage({
          id: nextMessageId("a"),
          role: "assistant",
          content: data.reply || UI_TEXT.ASSISTANT_ERROR,
          createdAt: new Date().toISOString(),
        }),
      );
      dispatch(setChatStatus({ status: "succeeded" }));
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : UI_TEXT.ASSISTANT_ERROR;
      dispatch(
        addChatMessage({
          id: nextMessageId("a"),
          role: "assistant",
          content: message,
          createdAt: new Date().toISOString(),
        }),
      );
      dispatch(setChatStatus({ status: "failed", error: message }));
    }
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

          {!consent ? (
            <div className="space-y-3 px-4 py-4">
              <p className="text-sm font-semibold text-brand-deep">{UI_TEXT.ASSISTANT_CONSENT_TITLE}</p>
              <p className="text-xs text-on-surface-variant">{UI_TEXT.ASSISTANT_CONSENT_BODY}</p>
              <Button size="sm" onClick={acceptConsent}>
                {UI_TEXT.ASSISTANT_CONSENT_ACCEPT}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto px-3 py-3">
                {messages.length === 0 && (
                  <>
                    <p className="text-xs text-on-surface-variant">{UI_TEXT.ASSISTANT_EMPTY_HINT}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                      {UI_TEXT.ASSISTANT_SUGGESTED_PROMPTS}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void send(prompt)}
                          className="rounded-full border border-outline-variant/60 bg-surface-low px-2.5 py-1 text-left text-[11px] text-brand-deep hover:border-primary-main/40"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </>
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

              <div className="border-t border-outline-variant/40 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void send();
                    }}
                    placeholder={UI_TEXT.ASSISTANT_PLACEHOLDER}
                    className="h-10 flex-1 rounded-xl border border-outline-variant/60 bg-surface px-3 text-sm text-brand-deep outline-none focus:ring-2 focus:ring-(--focus-ring)"
                  />
                  <Button
                    size="sm"
                    onClick={() => void send()}
                    disabled={!draft.trim() || status === "loading"}
                    aria-label={UI_TEXT.ASSISTANT_SEND}
                  >
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-on-surface-variant">{UI_TEXT.ASSISTANT_DISCLAIMER}</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
