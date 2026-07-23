"use client";

import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_CONFIG,
  CURRENCY_SYMBOL,
  DATE_CONSTANTS,
  DEFAULT_VALUES,
  DISPLAY_LIMITS,
  MONTHS,
  PERCENTAGE_THRESHOLDS,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";

import { Badge, Button, EmptyState, ProgressBar } from "@common";

import {
  AccountBalanceWalletIcon,
  AddIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CheckCircleIcon,
  DownloadIcon,
  FilterListIcon,
  HealthAndSafetyIcon,
  HelpOutlineIcon,
  LightbulbIcon,
  MenuIcon,
  SavingsIcon,
  SearchIcon,
  ShoppingCartIcon,
  ShowChartIcon,
  TrendingUpIcon,
  WarningIcon,
} from "@components/icons";
import {
  AlertBanner,
  BudgetItemCard,
  DonutChartCard,
  FilterPills,
  SegmentedTabs,
  TransactionItem,
} from "@components/mobile";
import { daysElapsedInMonth, formatDelta } from "@components/screens/analytics/analyticsHelpers";
import { ReportsInsightsPanel } from "@components/screens/analytics/ReportsInsightsPanel";
import { BudgetModal } from "@components/screens/budgets/BudgetModal";
import { PeriodPicker } from "@components/shell/PeriodPicker";

import { useAppNavigation } from "@hooks/useAppNavigation";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useUiPeriod } from "@hooks/useUiPeriod";
import { useAppSelector } from "@store/hooks";
import { cn } from "@utils/cn";
import { getCategoryChartColor } from "@utils/colorUtils";
import { compareByDateThenCreatedAt } from "@utils/dateUtils";
import { exportChartData, exportTaxAuditReport } from "@utils/exportUtils";
import { buildRollingMonthTrend } from "@utils/periodFilter";
import { percentChange } from "@utils/transactionFilters";

import { CHART_THEME_COLORS } from "@/lib/theme";
import type { AnalyticsTab, Budget } from "@/types";

const BUDGET_LIMIT_COLOR = CHART_THEME_COLORS.PRIMARY_SOFT;
const ACTUAL_SPENT_COLOR = CHART_THEME_COLORS.PRIMARY_CONTAINER;
const OVER_BUDGET_COLOR = "#BA1A1A";

type CriticalAlert = {
  id: string;
  title: string;
  message: string;
  tone: "danger" | "success" | "warning";
};

export function AnalyticsScreen() {
  const navigateToTab = useAppNavigation();
  const searchParams = useSearchParams();
  const transactions = useAppSelector((s) => s.transactions.items);
  const budgets = useAppSelector((s) => s.budgets.items);
  const goals = useAppSelector((s) => s.goals.items);
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((s) => s.ui);
  const { formatCurrency, formatCurrencyForChart, formatCompactCurrency } = useCurrencyFormatter();

  const initialTab = (searchParams.get("tab") as AnalyticsTab | null) ?? "overview";
  const [tab, setTab] = useState<AnalyticsTab>(
    initialTab === "income" ||
      initialTab === "outcome" ||
      initialTab === "budget" ||
      initialTab === "reports"
      ? initialTab
      : "overview",
  );
  const [search, setSearch] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("all");
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    const param = searchParams.get("tab") as AnalyticsTab | null;
    if (
      param === "overview" ||
      param === "income" ||
      param === "outcome" ||
      param === "budget" ||
      param === "reports"
    ) {
      setTab(param);
    }
  }, [searchParams]);

  const current = useBudgetCalculations(transactions, viewPeriod, selectedMonth, selectedYear);

  const { previousPeriod } = useUiPeriod();
  const previous = useBudgetCalculations(
    transactions,
    previousPeriod.viewPeriod,
    previousPeriod.selectedMonth,
    previousPeriod.selectedYear,
  );

  const searchLower = search.trim().toLowerCase();

  const budgetLimit = useMemo(
    () => budgets.filter((b) => b.period === "monthly").reduce((sum, b) => sum + (b.limitAmount || 0), 0),
    [budgets],
  );

  const netSavings = current.balance;
  const prevNetSavings = previous.balance;
  const netDelta = percentChange(netSavings, prevNetSavings);
  const spendDelta = percentChange(current.totalExpense, previous.totalExpense);
  const incomeDelta = percentChange(current.totalIncome, previous.totalIncome);

  /** All-time running balance — same pattern as Dashboard SummaryCards. */
  const currentBalance = useMemo(() => {
    const allIncome = transactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);
    const allExpense = transactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);
    return allIncome - allExpense;
  }, [transactions]);

  const savingsRate =
    current.totalIncome > 0
      ? (netSavings / current.totalIncome) * PERCENTAGE_THRESHOLDS.MAX
      : null;

  const avgDailySpend = useMemo(() => {
    const days = daysElapsedInMonth(selectedMonth, selectedYear);
    return current.totalExpense / days;
  }, [current.totalExpense, selectedMonth, selectedYear]);

  const spendOfIncome =
    current.totalIncome > 0
      ? (current.totalExpense / current.totalIncome) * PERCENTAGE_THRESHOLDS.MAX
      : null;

  const largestTransactions = useMemo(() => {
    return [...current.filteredTransactions]
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, DISPLAY_LIMITS.LARGEST_TRANSACTIONS);
  }, [current.filteredTransactions]);

  const budgetHealthPct = useMemo(() => {
    if (budgetLimit <= 0) return PERCENTAGE_THRESHOLDS.MAX;
    const remaining = ((budgetLimit - current.totalExpense) / budgetLimit) * PERCENTAGE_THRESHOLDS.MAX;
    return Math.round(Math.max(PERCENTAGE_THRESHOLDS.MIN, Math.min(PERCENTAGE_THRESHOLDS.MAX, remaining)));
  }, [budgetLimit, current.totalExpense]);

  const budgetHealthStatus = useMemo(() => {
    if (budgetLimit <= 0) return UI_TEXT.ON_TRACK;
    const used = (current.totalExpense / budgetLimit) * PERCENTAGE_THRESHOLDS.MAX;
    if (used >= PERCENTAGE_THRESHOLDS.MAX) return UI_TEXT.AT_RISK;
    if (used >= PERCENTAGE_THRESHOLDS.WARNING) return UI_TEXT.WATCH;
    return UI_TEXT.ON_TRACK;
  }, [budgetLimit, current.totalExpense]);

  const monthlyTrend = useMemo(() => {
    return buildRollingMonthTrend(transactions, selectedMonth, selectedYear, DISPLAY_LIMITS.TREND_MONTHS).map(
      ({ key, label, Income, Expense }) => ({
        key,
        label,
        income: Income,
        expense: Expense,
        net: Income - Expense,
      }),
    );
  }, [transactions, selectedMonth, selectedYear]);

  const incomeExpenseTrend = useMemo(
    () => monthlyTrend.map(({ label, income, expense }) => ({ label, income, expense })),
    [monthlyTrend],
  );

  const incomeTrend = useMemo(() => monthlyTrend.map(({ label, income }) => ({ label, income })), [monthlyTrend]);

  const expenseTrend = useMemo(() => monthlyTrend.map(({ label, expense }) => ({ label, expense })), [monthlyTrend]);

  const highlightMonthLabel = MONTHS[selectedMonth - 1]?.slice(0, 3) ?? "";

  const expenseForecast = useMemo(() => {
    const history = monthlyTrend.map((m) => ({
      label: m.label,
      expense: m.expense,
      projected: false as boolean,
    }));
    const withSpend = monthlyTrend.filter((m) => m.expense > 0);
    const avg = withSpend.length > 0 ? withSpend.reduce((s, m) => s + m.expense, 0) / withSpend.length : 0;
    const nextMonthIndex = (new Date().getMonth() + 1) % 12;
    history.push({
      label: MONTHS[nextMonthIndex].slice(0, 3),
      expense: Math.round(avg),
      projected: true,
    });
    return history;
  }, [monthlyTrend]);

  const eoyForecast = useMemo(() => {
    const withData = monthlyTrend.filter((m) => m.income > 0 || m.expense > 0);
    const avgNet = withData.length > 0 ? withData.reduce((s, m) => s + m.net, 0) / withData.length : netSavings;
    const remainingMonths = Math.max(0, DATE_CONSTANTS.MONTHS_PER_YEAR - selectedMonth);
    const ytdNet = monthlyTrend
      .filter((m) => {
        const [y] = m.key.split("-").map(Number);
        return y === selectedYear;
      })
      .reduce((s, m) => s + m.net, 0);
    const ytdFallback = ytdNet !== 0 ? ytdNet : netSavings;
    return ytdFallback + avgNet * remainingMonths;
  }, [monthlyTrend, netSavings, selectedMonth, selectedYear]);

  const insight = useMemo(() => {
    const recent = monthlyTrend.slice(-3).filter((m) => m.expense > 0);
    const prior = monthlyTrend.slice(-6, -3).filter((m) => m.expense > 0);
    if (recent.length === 0) {
      return "Add a few months of spending to unlock a pace-based forecast insight.";
    }
    const recentAvg = recent.reduce((s, m) => s + m.expense, 0) / recent.length;
    if (prior.length === 0) {
      return `Based on recent months, average spend is about ${CURRENCY_SYMBOL}${formatCurrency(recentAvg)}. Next month is estimated near that pace.`;
    }
    const priorAvg = prior.reduce((s, m) => s + m.expense, 0) / prior.length;
    const change = percentChange(recentAvg, priorAvg);
    if (change == null) {
      return `Spending has been steady near ${CURRENCY_SYMBOL}${formatCurrency(recentAvg)} per month.`;
    }
    const abs = Math.abs(change).toFixed(0);
    if (change < -3) {
      return `Spending is trending about ${abs}% lower than the prior period. Next month may stay near ${CURRENCY_SYMBOL}${formatCurrency(recentAvg)} if the pace continues.`;
    }
    if (change > 3) {
      return `Spending is trending about ${abs}% higher than the prior period. Next month may approach ${CURRENCY_SYMBOL}${formatCurrency(recentAvg)} at the current pace.`;
    }
    return `Spending looks stable versus recent months (about ${CURRENCY_SYMBOL}${formatCurrency(recentAvg)}). Small category shifts can still move the forecast.`;
  }, [monthlyTrend, formatCurrency]);

  const budgetVsActual = useMemo(() => {
    let rows = budgets
      .filter((b) => b.period === "monthly")
      .map((b) => {
        const actual = current.spendingByCategory[b.category] ?? 0;
        const budget = b.limitAmount || 0;
        return {
          category: b.category,
          budget,
          actual,
          over: budget > 0 && actual > budget,
        };
      })
      .sort((a, b) => b.actual - a.actual)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES);
    if (searchLower) {
      rows = rows.filter((r) => r.category.toLowerCase().includes(searchLower));
    }
    return rows;
  }, [budgets, current.spendingByCategory, searchLower]);

  const spendSlices = useMemo(() => {
    let slices = Object.entries(current.spendingByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES)
      .map((s, i) => ({
        ...s,
        color: getCategoryChartColor(s.name, i),
      }));
    if (searchLower) {
      slices = slices.filter((s) => s.name.toLowerCase().includes(searchLower));
    }
    return slices;
  }, [current.spendingByCategory, searchLower]);

  const categoryColorByName = useMemo(() => {
    const map = new Map<string, string>();
    spendSlices.forEach((s, i) => {
      map.set(s.name, s.color ?? getCategoryChartColor(s.name, i));
    });
    return map;
  }, [spendSlices]);

  const topOverBudget = useMemo((): { category: string; pct: number } | null => {
    return budgets.reduce<{ category: string; pct: number } | null>((best, b) => {
      const spent = current.spendingByCategory[b.category] ?? 0;
      const limit = b.limitAmount || 0;
      if (limit <= 0) return best;
      const pct = (spent / limit) * 100;
      if (!best || pct > best.pct) return { category: b.category, pct };
      return best;
    }, null);
  }, [budgets, current.spendingByCategory]);

  const criticalAlerts = useMemo((): CriticalAlert[] => {
    const alerts: CriticalAlert[] = [];
    budgets.forEach((b) => {
      const spent = current.spendingByCategory[b.category] ?? 0;
      const limit = b.limitAmount || 0;
      if (limit <= 0) return;
      const overBy = spent - limit;
      const pct = (spent / limit) * PERCENTAGE_THRESHOLDS.MAX;
      if (overBy > 0) {
        alerts.push({
          id: `over-${b.id}`,
          title: UI_TEXT.BUDGET_EXCEEDED,
          message: `${b.category} has exceeded the monthly limit by ${CURRENCY_SYMBOL}${formatCurrency(overBy)}.`,
          tone: "danger",
        });
      } else if (pct >= PERCENTAGE_THRESHOLDS.WARNING) {
        alerts.push({
          id: `near-${b.id}`,
          title: UI_TEXT.NEARING_LIMIT,
          message: `${b.category} is at ${Math.round(pct)}% of its budget (${CURRENCY_SYMBOL}${formatCurrency(spent)} of ${CURRENCY_SYMBOL}${formatCurrency(limit)}).`,
          tone: "warning",
        });
      }
    });
    goals.forEach((g) => {
      const saved = g.savedAmount ?? g.currentAmount ?? 0;
      const target = g.targetAmount || 0;
      if (target > 0 && saved >= target) {
        alerts.push({
          id: `goal-${g.id}`,
          title: UI_TEXT.GOAL_REACHED,
          message: `Congratulations! You've reached your '${g.title || g.name || "goal"}' savings goal.`,
          tone: "success",
        });
      }
    });
    let filtered = alerts;
    if (searchLower) {
      filtered = alerts.filter(
        (a) => a.title.toLowerCase().includes(searchLower) || a.message.toLowerCase().includes(searchLower),
      );
    }
    return filtered.slice(0, DISPLAY_LIMITS.PREVIEW_ITEMS);
  }, [budgets, goals, current.spendingByCategory, formatCurrency, searchLower]);

  const incomeCategories = useMemo(
    () => ["all", ...Object.keys(current.incomeByCategory).sort()],
    [current.incomeByCategory],
  );

  const incomeRows = useMemo(() => {
    let list = current.filteredTransactions.filter((t) => t.type === "income");
    if (incomeCategory !== "all") {
      list = list.filter((t) => t.category === incomeCategory);
    }
    if (searchLower) {
      list = list.filter(
        (t) =>
          (t.title || t.description || "").toLowerCase().includes(searchLower) ||
          (t.category || "").toLowerCase().includes(searchLower),
      );
    }
    return [...list].sort((a, b) => -compareByDateThenCreatedAt(a, b)).slice(0, 20);
  }, [current.filteredTransactions, incomeCategory, searchLower]);

  const outcomeRows = useMemo(() => {
    let list = current.filteredTransactions.filter((t) => t.type === "expense");
    if (searchLower) {
      list = list.filter(
        (t) =>
          (t.title || t.description || "").toLowerCase().includes(searchLower) ||
          (t.category || "").toLowerCase().includes(searchLower),
      );
    }
    return [...list].sort((a, b) => -compareByDateThenCreatedAt(a, b)).slice(0, 20);
  }, [current.filteredTransactions, searchLower]);

  const activeTooltip =
    spendSlices.length > 1
      ? `${spendSlices[1].name} ${Math.round(
          (spendSlices[1].value / (spendSlices.reduce((a, s) => a + s.value, 0) || 1)) * 100,
        )}%`
      : null;

  const currentExpensePoint = monthlyTrend[monthlyTrend.length - 1];

  const handleExportBudgetVsActual = () => {
    exportChartData(
      budgetVsActual.map((r) => ({
        Category: r.category,
        "Budget Limit": r.budget,
        "Actual Spent": r.actual,
        Status: r.over ? UI_TEXT.OVER_BUDGET : UI_TEXT.ON_TRACK,
      })),
      "budget-vs-actual",
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-6xl md:space-y-5 lg:max-w-7xl">
      {/* Mobile header — desktop TopBar already shows title */}
      <header className="flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white"
          aria-label="Menu"
          onClick={() => navigateToTab("profile")}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-brand-deep">{UI_TEXT.ANALYTICS_AND_REPORTS}</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white"
          aria-label={UI_TEXT.EXPORT_DATA}
          onClick={() => setTab("reports")}
        >
          <DownloadIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="hidden items-center justify-end gap-3 md:flex">
        <label className="input-pill-focus flex items-center gap-2 rounded-full border border-gray-200 bg-surface-low px-3 py-2 transition-[box-shadow,border-color] focus-within:border-primary-main/40 focus-within:ring-2 focus-within:ring-primary-main/30">
          <SearchIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={UI_TEXT.SEARCH_ANALYTICS}
            className="w-48 appearance-none bg-transparent text-sm text-brand-deep outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none"
          />
        </label>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<DownloadIcon className="h-4 w-4" />}
          onClick={() => setTab("reports")}
        >
          {UI_TEXT.REPORTS_TAB}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<DownloadIcon className="h-4 w-4" />}
          onClick={() => exportTaxAuditReport(transactions)}
        >
          {UI_TEXT.TAX_EXPORT}
        </Button>
      </div>

      <div className="md:hidden">
        <label className="input-pill-focus flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2.5 shadow-card transition-[box-shadow,border-color] focus-within:border-primary-main/40 focus-within:ring-2 focus-within:ring-primary-main/30">
          <SearchIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={UI_TEXT.SEARCH_ANALYTICS}
            className="w-full appearance-none bg-transparent text-sm text-brand-deep outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none"
          />
        </label>
      </div>

      <SegmentedTabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: UI_TEXT.OVERVIEW },
          { value: "income", label: UI_TEXT.INCOME },
          { value: "outcome", label: UI_TEXT.OUTCOME },
          { value: "budget", label: UI_TEXT.BUDGET },
          { value: "reports", label: UI_TEXT.REPORTS_TAB },
        ]}
      />

      {tab === "overview" && (
        <>
          {/* KPI row — balance + core period metrics */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-main">
                  <AccountBalanceWalletIcon className="h-5 w-5" />
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">{UI_TEXT.CURRENT_BALANCE}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
                {CURRENCY_SYMBOL}
                {formatCurrency(currentBalance)}
              </p>
              <p className="mt-2 text-xs text-gray-400">{UI_TEXT.CURRENT_BALANCE_HINT}</p>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
                  <TrendingUpIcon className="h-5 w-5" />
                </span>
                {formatDelta(netDelta) && (
                  <Badge tone={netDelta != null && netDelta >= 0 ? "success" : "danger"} className="rounded-md">
                    {netDelta != null && netDelta >= 0 ? (
                      <ArrowUpwardIcon className="h-3 w-3" />
                    ) : (
                      <ArrowDownwardIcon className="h-3 w-3" />
                    )}
                    {formatDelta(netDelta)}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500">{UI_TEXT.NET_SAVINGS}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
                {CURRENCY_SYMBOL}
                {formatCurrency(netSavings)}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {UI_TEXT.VS_LAST_MONTH} {CURRENCY_SYMBOL}
                {formatCurrency(prevNetSavings)}
              </p>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense/10 text-expense">
                  <ShoppingCartIcon className="h-5 w-5" />
                </span>
                {formatDelta(spendDelta) && (
                  <Badge tone={spendDelta != null && spendDelta <= 0 ? "success" : "danger"} className="rounded-md">
                    {formatDelta(spendDelta)}
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500">{UI_TEXT.MONTHLY_SPEND}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
                {CURRENCY_SYMBOL}
                {formatCurrency(current.totalExpense)}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {UI_TEXT.VS_LAST_MONTH} {CURRENCY_SYMBOL}
                {formatCurrency(previous.totalExpense)}
              </p>
            </article>

            <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-main">
                  <HealthAndSafetyIcon className="h-5 w-5" />
                </span>
                <Badge
                  tone={
                    budgetHealthStatus === UI_TEXT.AT_RISK
                      ? "danger"
                      : budgetHealthStatus === UI_TEXT.WATCH
                        ? "warning"
                        : "info"
                  }
                  className="rounded-md"
                >
                  {budgetHealthStatus}
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-500">{UI_TEXT.BUDGET_HEALTH}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
                {budgetHealthPct}%
              </p>
              <ProgressBar
                value={budgetHealthPct}
                className="mt-3 h-1.5"
                colorClassName="bg-primary-main"
                trackClassName="bg-surface-high"
              />
            </article>
          </div>

          {/* Insight metrics — savings rate, avg daily, spend vs income, EOY */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <article className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-income/10 text-income">
                <SavingsIcon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">{UI_TEXT.SAVINGS_RATE}</p>
              <p className="mt-1 text-xl font-bold text-brand-deep">
                {savingsRate == null ? UI_TEXT.NOT_AVAILABLE : `${savingsRate.toFixed(0)}%`}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">{UI_TEXT.PERIOD_BALANCE}</p>
            </article>

            <article className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-expense/10 text-expense">
                <ShoppingCartIcon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">{UI_TEXT.AVERAGE_DAILY_SPEND}</p>
              <p className="mt-1 text-xl font-bold text-brand-deep">
                {CURRENCY_SYMBOL}
                {formatCurrency(avgDailySpend)}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">{UI_TEXT.THIS_PERIOD}</p>
            </article>

            <article className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-main">
                <ShowChartIcon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">{UI_TEXT.SPEND_VS_INCOME}</p>
              <p className="mt-1 text-xl font-bold text-brand-deep">
                {spendOfIncome == null ? UI_TEXT.NOT_AVAILABLE : `${Math.round(spendOfIncome)}%`}
              </p>
              <ProgressBar
                value={spendOfIncome == null ? 0 : Math.min(PERCENTAGE_THRESHOLDS.MAX, spendOfIncome)}
                className="mt-2 h-1.5"
                colorClassName={
                  spendOfIncome != null && spendOfIncome > PERCENTAGE_THRESHOLDS.MAX
                    ? "bg-expense"
                    : "bg-primary-main"
                }
                trackClassName="bg-surface-high"
              />
              <p className="mt-1 text-[11px] text-gray-400">{UI_TEXT.OF_INCOME}</p>
            </article>

            <article className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-main">
                <TrendingUpIcon className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-gray-500">{UI_TEXT.FORECAST_EOY}</p>
              <p className="mt-1 text-xl font-bold text-brand-deep">
                {CURRENCY_SYMBOL}
                {formatCurrency(eoyForecast)}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">{UI_TEXT.FORECAST_PACE_HINT}</p>
            </article>
          </div>

          {/* Income vs Expenses trend */}
          <section className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card backdrop-blur-sm md:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.INCOME_VS_EXPENSES}</h3>
                <p className="text-sm text-on-surface-variant">{UI_TEXT.MONTHLY_TREND}</p>
              </div>
              <PeriodPicker variant="chip" align="right" />
            </div>
            <div className="h-56 w-full md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={incomeExpenseTrend} margin={{ ...CHART_CONFIG.MARGIN, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME_COLORS.GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: CHART_THEME_COLORS.TICK }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                    width={48}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${CURRENCY_SYMBOL}${formatCompactCurrency(Number(v) || 0)}`}
                  />
                  <Tooltip
                    formatter={(value) =>
                      formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name={UI_TEXT.INCOME}
                    stroke={CHART_THEME_COLORS.INCOME}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name={UI_TEXT.EXPENSE}
                    stroke={CHART_THEME_COLORS.EXPENSE}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Charts mid row */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <section className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card backdrop-blur-sm md:p-5 xl:col-span-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.BUDGET_VS_ACTUAL}</h3>
                  <p className="text-sm text-on-surface-variant">{UI_TEXT.BUDGET_VS_ACTUAL_SUBTITLE}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PeriodPicker variant="chip" align="right" />
                  <Button size="sm" onClick={handleExportBudgetVsActual}>
                    {UI_TEXT.EXPORT_PDF}
                  </Button>
                </div>
              </div>
              {budgetVsActual.length === 0 ? (
                <EmptyState title={UI_TEXT.NO_BUDGETS} description={UI_TEXT.BUDGET_VS_ACTUAL_SUBTITLE} />
              ) : (
                <>
                  <div className="h-64 w-full md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetVsActual} margin={{ ...CHART_CONFIG.MARGIN, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME_COLORS.GRID} vertical={false} />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={56}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                          width={44}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${CURRENCY_SYMBOL}${formatCompactCurrency(Number(v) || 0)}`}
                        />
                        <Tooltip
                          formatter={(value) =>
                            formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)
                          }
                        />
                        <Bar
                          dataKey="budget"
                          name={UI_TEXT.BUDGET_LIMIT}
                          fill={BUDGET_LIMIT_COLOR}
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                        <Bar dataKey="actual" name={UI_TEXT.ACTUAL_SPENT} radius={[6, 6, 0, 0]} maxBarSize={28}>
                          {budgetVsActual.map((entry) => (
                            <Cell key={entry.category} fill={entry.over ? OVER_BUDGET_COLOR : ACTUAL_SPENT_COLOR} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-4 border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: BUDGET_LIMIT_COLOR }} />
                      {UI_TEXT.BUDGET_LIMIT}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ACTUAL_SPENT_COLOR }} />
                      {UI_TEXT.ACTUAL_SPENT}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: OVER_BUDGET_COLOR }} />
                      {UI_TEXT.OVER_BUDGET}
                    </span>
                  </div>
                </>
              )}
            </section>

            <section className="flex flex-col rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.EXPENSE_FORECAST}</h3>
              <p className="mb-4 text-sm text-gray-500">{UI_TEXT.EXPENSE_FORECAST_SUBTITLE}</p>
              <div className="min-h-[180px] flex-1">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={expenseForecast} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expenseForecastFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_THEME_COLORS.PRIMARY} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={CHART_THEME_COLORS.PRIMARY} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME_COLORS.GRID_SOFT} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)
                      }
                      labelFormatter={(label) => String(label)}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke={CHART_THEME_COLORS.PRIMARY}
                      strokeWidth={3}
                      fill="url(#expenseForecastFill)"
                      name={UI_TEXT.EXPENSE}
                      dot={(props) => {
                        const { cx, cy, index, payload } = props;
                        if (cx == null || cy == null) return null;
                        const isCurrent = index === expenseForecast.length - 2 && !payload?.projected;
                        const isProjected = Boolean(payload?.projected);
                        if (!isCurrent && !isProjected) return null;
                        return (
                          <circle
                            key={`dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={isCurrent ? 6 : 4}
                            fill={isProjected ? CHART_THEME_COLORS.TERTIARY : CHART_THEME_COLORS.PRIMARY}
                            stroke={CHART_THEME_COLORS.DOT_STROKE}
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {currentExpensePoint && (
                  <p className="mt-1 text-center text-xs font-semibold text-primary-main">
                    {UI_TEXT.CURRENT_LABEL}: {CURRENCY_SYMBOL}
                    {formatCompactCurrency(currentExpensePoint.expense)}
                  </p>
                )}
              </div>
              <div className="mt-4 rounded-xl border border-primary-main/10 bg-primary-main/5 p-3">
                <div className="mb-1.5 flex items-center gap-2 text-primary-main">
                  <LightbulbIcon className="h-4 w-4" />
                  <span className="text-sm font-bold">{UI_TEXT.INSIGHT}</span>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">{insight}</p>
              </div>
            </section>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <h3 className="mb-4 text-base font-semibold text-brand-deep md:text-lg">
                {UI_TEXT.CATEGORY_DISTRIBUTION}
              </h3>
              {spendSlices.length === 0 ? (
                <EmptyState title={UI_TEXT.NO_SPENDING_DATA} />
              ) : (
                <DonutChartCard
                  slices={spendSlices}
                  spent={current.totalExpense}
                  limit={budgetLimit || current.totalExpense || 1}
                  formatCurrency={formatCurrency}
                  activeLabel={activeTooltip}
                  className="border-0 bg-transparent p-0 shadow-none"
                />
              )}
            </section>

            <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
              <h3 className="mb-4 text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.CRITICAL_ALERTS}</h3>
              {criticalAlerts.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">{UI_TEXT.NO_CRITICAL_ALERTS}</p>
              ) : (
                <ul className="space-y-2">
                  {criticalAlerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-gray-100 hover:bg-surface-low"
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          alert.tone === "danger" && "bg-red-100 text-expense",
                          alert.tone === "warning" && "bg-amber-100 text-amber-700 dark:text-amber-100",
                          alert.tone === "success" && "bg-green-100 text-income",
                        )}
                      >
                        {alert.tone === "success" ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <WarningIcon className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-brand-deep">{alert.title}</h4>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{alert.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => navigateToTab("budgets")}
                className="mt-3 w-full py-2 text-center text-sm font-semibold text-primary-main hover:underline"
              >
                {UI_TEXT.VIEW_ALL_NOTIFICATIONS}
              </button>
            </section>
          </div>

          <section className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.LARGEST_TRANSACTIONS}</h3>
              <button
                type="button"
                onClick={() => navigateToTab("transactions")}
                className="text-sm font-semibold text-primary-main hover:underline"
              >
                {UI_TEXT.VIEW_ALL}
              </button>
            </div>
            {largestTransactions.length === 0 ? (
              <EmptyState title={UI_TEXT.NO_TRANSACTIONS} />
            ) : (
              <ul className="divide-y divide-gray-50">
                {largestTransactions.map((t) => (
                  <li key={t.id}>
                    <TransactionItem transaction={t} formatCurrency={formatCurrency} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {tab === "budget" && (
        <>
          {topOverBudget && topOverBudget.pct >= 50 && !alertDismissed && (
            <AlertBanner
              tone="budget"
              message={`${topOverBudget.category} spending is ${Math.round(topOverBudget.pct)}% of budget. Consider reducing daily expenses.`}
              onDismiss={() => setAlertDismissed(true)}
            />
          )}

          <DonutChartCard
            slices={spendSlices}
            spent={current.totalExpense}
            limit={budgetLimit || current.totalExpense || 1}
            formatCurrency={formatCurrency}
            activeLabel={activeTooltip}
          />

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-brand-deep">{UI_TEXT.BUDGET_ITEM}</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-gray-500 hover:bg-surface-low"
              >
                <FilterListIcon className="h-4 w-4" />
                {UI_TEXT.SORT}
                <span className="inline-flex flex-col leading-none text-[10px]" aria-hidden>
                  <ArrowUpwardIcon className="h-2.5 w-2.5" />
                  <ArrowDownwardIcon className="h-2.5 w-2.5 -mt-0.5" />
                </span>
              </button>
              <Button
                size="sm"
                leftIcon={<AddIcon className="h-4 w-4" />}
                onClick={() => {
                  setEditingBudget(null);
                  setBudgetModalOpen(true);
                }}
              >
                {UI_TEXT.ADD_BUDGET}
              </Button>
            </div>
          </div>

          {budgets.length === 0 ? (
            <EmptyState title={UI_TEXT.NO_BUDGETS} />
          ) : (
            <ul className="space-y-3">
              {budgets
                .filter((b) => !searchLower || b.category.toLowerCase().includes(searchLower))
                .map((b, i) => (
                  <li key={b.id}>
                    <BudgetItemCard
                      category={b.category}
                      spent={current.spendingByCategory[b.category] ?? 0}
                      limit={b.limitAmount || 0}
                      formatCurrency={formatCurrency}
                      color={categoryColorByName.get(b.category) ?? getCategoryChartColor(b.category, i)}
                      onMenu={() => {
                        setEditingBudget(b);
                        setBudgetModalOpen(true);
                      }}
                    />
                  </li>
                ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => navigateToTab("budgets")}
            className="w-full py-2 text-center text-sm font-semibold text-primary-main"
          >
            {UI_TEXT.VIEW_ALL} {UI_TEXT.BUDGETS}
          </button>
        </>
      )}

      {tab === "income" && (
        <>
          <div className="rounded-card bg-white p-4 shadow-card md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-brand-deep md:text-base">{UI_TEXT.INCOME_ANALYTICS}</h3>
                <HelpOutlineIcon className="h-4 w-4 text-gray-400" aria-hidden />
              </div>
              <PeriodPicker variant="chip" align="right" />
            </div>
            <div className="mb-4 flex items-end gap-2">
              <p className="text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
                {CURRENCY_SYMBOL}
                {formatCurrency(current.totalIncome)}
              </p>
              {incomeDelta != null && (
                <span
                  className={cn(
                    "mb-1 inline-flex items-center gap-0.5 text-xs font-semibold",
                    incomeDelta >= 0 ? "text-income" : "text-expense",
                  )}
                >
                  {incomeDelta >= 0 ? (
                    <ArrowUpwardIcon className="h-3 w-3" />
                  ) : (
                    <ArrowDownwardIcon className="h-3 w-3" />
                  )}
                  {Math.abs(incomeDelta).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeTrend} margin={CHART_CONFIG.MARGIN}>
                  <defs>
                    <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_THEME_COLORS.PRIMARY_CONTAINER} />
                      <stop offset="100%" stopColor={CHART_THEME_COLORS.PRIMARY} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME_COLORS.GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${CURRENCY_SYMBOL}${formatCompactCurrency(Number(v) || 0)}`}
                  />
                  <Tooltip
                    formatter={(value) =>
                      formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)
                    }
                  />
                  <Bar dataKey="income" radius={[8, 8, 0, 0]} name={UI_TEXT.INCOME} maxBarSize={36}>
                    {incomeTrend.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={
                          entry.label === highlightMonthLabel ? "url(#incomeBarGrad)" : CHART_THEME_COLORS.MUTED_BAR
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <FilterPills
            variant="underline"
            value={incomeCategory}
            onChange={setIncomeCategory}
            options={incomeCategories.map((c) => ({
              value: c,
              label: c === "all" ? UI_TEXT.ALL : c,
            }))}
          />

          <div className="rounded-card bg-white px-4 shadow-card">
            {incomeRows.length === 0 ? (
              <EmptyState title={UI_TEXT.NO_TRANSACTIONS} />
            ) : (
              <ul className="divide-y divide-gray-50">
                {incomeRows.map((t) => (
                  <li key={t.id}>
                    <TransactionItem transaction={t} formatCurrency={formatCurrency} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => setTab("reports")}
            className="w-full py-2 text-center text-sm font-semibold text-primary-main"
          >
            {UI_TEXT.VIEW_ALL} {UI_TEXT.REPORTS_TAB}
          </button>
        </>
      )}

      {tab === "outcome" && (
        <>
          <div className="rounded-card bg-white p-4 shadow-card md:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-brand-deep md:text-base">{UI_TEXT.OUTCOME_ANALYTICS}</h3>
                <HelpOutlineIcon className="h-4 w-4 text-gray-400" aria-hidden />
              </div>
              <PeriodPicker variant="chip" align="right" />
            </div>
            <div className="mb-4 flex items-end gap-2">
              <p className="text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
                {CURRENCY_SYMBOL}
                {formatCurrency(current.totalExpense)}
              </p>
              {spendDelta != null && (
                <span
                  className={cn(
                    "mb-1 inline-flex items-center gap-0.5 text-xs font-semibold",
                    spendDelta <= 0 ? "text-income" : "text-expense",
                  )}
                >
                  {spendDelta <= 0 ? (
                    <ArrowDownwardIcon className="h-3 w-3" />
                  ) : (
                    <ArrowUpwardIcon className="h-3 w-3" />
                  )}
                  {Math.abs(spendDelta).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseTrend} margin={CHART_CONFIG.MARGIN}>
                  <defs>
                    <linearGradient id="outcomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_THEME_COLORS.PRIMARY_CONTAINER} />
                      <stop offset="100%" stopColor={CHART_THEME_COLORS.PRIMARY} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME_COLORS.GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${CURRENCY_SYMBOL}${formatCompactCurrency(Number(v) || 0)}`}
                  />
                  <Tooltip
                    formatter={(value) =>
                      formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)
                    }
                  />
                  <Bar dataKey="expense" radius={[8, 8, 0, 0]} name={UI_TEXT.EXPENSE} maxBarSize={36}>
                    {expenseTrend.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={
                          entry.label === highlightMonthLabel ? "url(#outcomeBarGrad)" : CHART_THEME_COLORS.MUTED_BAR
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <DonutChartCard
            slices={spendSlices}
            spent={current.totalExpense}
            limit={budgetLimit || current.totalExpense || 1}
            formatCurrency={formatCurrency}
            activeLabel={activeTooltip}
          />

          <div className="rounded-card bg-white px-4 shadow-card">
            {outcomeRows.length === 0 ? (
              <EmptyState title={UI_TEXT.NO_SPENDING_DATA} />
            ) : (
              <ul className="divide-y divide-gray-50">
                {outcomeRows.map((t) => (
                  <li key={t.id}>
                    <TransactionItem transaction={t} formatCurrency={formatCurrency} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => setTab("reports")}
            className="w-full py-2 text-center text-sm font-semibold text-primary-main"
          >
            {UI_TEXT.VIEW_ALL} {UI_TEXT.REPORTS_TAB}
          </button>
        </>
      )}

      {tab === "reports" && <ReportsInsightsPanel />}

      <BudgetModal
        open={budgetModalOpen}
        onClose={() => {
          setBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        budget={editingBudget}
      />
    </div>
  );
}
