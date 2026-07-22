"use client";

import {
  CHART_CONFIG,
  CURRENCY_SYMBOL,
  DATE_CONSTANTS,
  DISPLAY_LIMITS,
  MONTHS,
  PERCENTAGE_THRESHOLDS,
  STITCH_COLORS,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";
import { CHART_THEME_COLORS } from "@/lib/theme";
import { APP_ROUTES } from "@constants/routes";
import { Badge, Button, EmptyState, ProgressBar } from "@common";
import {
  ArrowDownwardIcon,
  ArrowForwardIcon,
  ArrowUpwardIcon,
  BarChartIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  HealthAndSafetyIcon,
  InsightsIcon,
  LightbulbIcon,
  RefreshIcon,
  SavingsIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  WarningIcon,
} from "@components/icons";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { setViewPeriod } from "@store/slices/uiSlice";
import { cn } from "@utils/cn";
import { getCategoryChartColor } from "@utils/colorUtils";
import { getMonthYear } from "@utils/dateUtils";
import { exportChartData } from "@utils/exportUtils";
import { percentChange } from "@utils/transactionFilters";
import type { ViewPeriod } from "@/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type InsightTone = "danger" | "success" | "info" | "neutral";

type SmartInsight = {
  id: string;
  title: string;
  message: string;
  tone: InsightTone;
  href?: string;
  actionLabel?: string;
};

function formatDelta(delta: number | null): string | null {
  if (delta == null) return null;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${Math.abs(delta).toFixed(1)}%`;
}

function isCurrentCalendarMonth(month: number, year: number): boolean {
  const now = new Date();
  return month === now.getMonth() + 1 && year === now.getFullYear();
}

export function ReportsScreen() {
  const navigateToTab = useAppNavigation();
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((state) => state.transactions.items);
  const budgets = useAppSelector((state) => state.budgets.items);
  const { selectedMonth, selectedYear } = useAppSelector((state) => state.ui);
  const { formatCurrency, formatCurrencyForChart, formatCompactCurrency } =
    useCurrencyFormatter();
  const [insightKey, setInsightKey] = useState(0);

  const current = useBudgetCalculations(
    transactions,
    VIEW_PERIODS.MONTHLY as ViewPeriod,
    selectedMonth,
    selectedYear,
  );

  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  const previous = useBudgetCalculations(
    transactions,
    VIEW_PERIODS.MONTHLY as ViewPeriod,
    prevMonth,
    prevYear,
  );

  const periodLabel = isCurrentCalendarMonth(selectedMonth, selectedYear)
    ? UI_TEXT.THIS_MONTH
    : `${MONTHS[selectedMonth - 1]?.slice(0, 3) ?? ""} ${selectedYear}`;

  const netSavings = current.totalIncome - current.totalExpense;
  const prevNetSavings = previous.totalIncome - previous.totalExpense;
  const netDelta = percentChange(netSavings, prevNetSavings);
  const spendDelta = percentChange(current.totalExpense, previous.totalExpense);

  const budgetLimit = useMemo(
    () =>
      budgets
        .filter((b) => b.period === "monthly")
        .reduce((sum, b) => sum + (b.limitAmount || 0), 0),
    [budgets],
  );

  const remaining = Math.max(0, budgetLimit - current.totalExpense);

  /** Honest adherence score from spend vs total monthly budget limits. */
  const adherenceScore = useMemo(() => {
    if (budgetLimit <= 0) return PERCENTAGE_THRESHOLDS.MAX;
    const used = current.totalExpense / budgetLimit;
    if (used <= 0.5) return 98;
    if (used <= 0.8) return Math.round(100 - used * 10);
    if (used <= 1) return Math.round(100 - used * 15);
    return Math.max(40, Math.round(100 / used));
  }, [budgetLimit, current.totalExpense]);

  const budgetHealthStatus = useMemo(() => {
    if (budgetLimit <= 0) return UI_TEXT.ON_TRACK;
    const used =
      (current.totalExpense / budgetLimit) * PERCENTAGE_THRESHOLDS.MAX;
    if (used >= PERCENTAGE_THRESHOLDS.MAX) return UI_TEXT.AT_RISK;
    if (used >= PERCENTAGE_THRESHOLDS.WARNING) return UI_TEXT.WATCH;
    return UI_TEXT.ON_TRACK;
  }, [budgetLimit, current.totalExpense]);

  const incomeExpenseTrend = useMemo(() => {
    const months: {
      key: string;
      label: string;
      income: number;
      expense: number;
    }[] = [];
    const base = new Date(selectedYear, selectedMonth - 1, 1);
    for (let i = DISPLAY_LIMITS.TREND_MONTHS - 1; i >= 0; i -= 1) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: MONTHS[d.getMonth()].slice(0, 3),
        income: 0,
        expense: 0,
      });
    }
    const index = new Map(months.map((m) => [m.key, m]));
    transactions.forEach((t) => {
      const my = getMonthYear(t.date);
      if (!my) return;
      const entry = index.get(`${my.year}-${my.month}`);
      if (!entry) return;
      if (t.type === "income") entry.income += t.amount || 0;
      else entry.expense += t.amount || 0;
    });
    return months;
  }, [transactions, selectedMonth, selectedYear]);

  const spendingTrendDaily = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const checkpoints = [1, 8, 15, 22, daysInMonth].filter(
      (d, i, arr) => arr.indexOf(d) === i && d <= daysInMonth,
    );
    return checkpoints.map((day) => {
      const spent = current.filteredTransactions
        .filter((t) => {
          if (t.type !== "expense") return false;
          const my = getMonthYear(t.date);
          if (!my) return false;
          const date = new Date(t.date);
          return (
            !Number.isNaN(date.getTime()) &&
            date.getDate() <= day &&
            my.month === selectedMonth &&
            my.year === selectedYear
          );
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      return {
        label:
          day === 1
            ? "1st"
            : day === 2
              ? "2nd"
              : day === 3
                ? "3rd"
                : `${day}th`,
        spent,
      };
    });
  }, [
    current.filteredTransactions,
    selectedMonth,
    selectedYear,
  ]);

  const categoryLimits = useMemo(() => {
    return budgets
      .filter((b) => b.period === "monthly")
      .map((b, i) => {
        const spent = current.spendingByCategory[b.category] ?? 0;
        const limit = b.limitAmount || 0;
        const pct =
          limit > 0 ? (spent / limit) * PERCENTAGE_THRESHOLDS.MAX : 0;
        return {
          category: b.category,
          spent,
          limit,
          pct,
          over: limit > 0 && spent > limit,
          color: getCategoryChartColor(b.category, i),
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES);
  }, [budgets, current.spendingByCategory]);

  const categorySpendFallback = useMemo(() => {
    if (categoryLimits.length > 0) return categoryLimits;
    return Object.entries(current.spendingByCategory)
      .map(([category, spent], i) => ({
        category,
        spent,
        limit: 0,
        pct: 0,
        over: false,
        color: getCategoryChartColor(category, i),
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES_ANALYSIS);
  }, [categoryLimits, current.spendingByCategory]);

  const expenseForecast = useMemo(() => {
    const withSpend = incomeExpenseTrend.filter((m) => m.expense > 0);
    const avg =
      withSpend.length > 0
        ? withSpend.reduce((s, m) => s + m.expense, 0) / withSpend.length
        : 0;
    const history = incomeExpenseTrend.map((m) => ({
      label: m.label,
      expense: m.expense,
      projected: false as boolean,
    }));
    const baseMonth = selectedMonth - 1;
    for (let i = 1; i <= DISPLAY_LIMITS.FORECAST_MONTHS; i += 1) {
      const idx = (baseMonth + i) % 12;
      history.push({
        label: MONTHS[idx].slice(0, 3),
        expense: Math.round(avg),
        projected: true,
      });
    }
    return {
      series: history,
      avgMonthly: avg,
      projectedAnnual: avg * DATE_CONSTANTS.MONTHS_PER_YEAR,
      nextEstimate: Math.round(avg),
    };
  }, [incomeExpenseTrend, selectedMonth]);

  const smartInsights = useMemo((): SmartInsight[] => {
    void insightKey;
    const insights: SmartInsight[] = [];

    const overItems = categoryLimits.filter((c) => c.over);
    if (overItems.length > 0) {
      const top = overItems[0];
      const overBy = top.spent - top.limit;
      insights.push({
        id: "overspend",
        title: UI_TEXT.INSIGHT_OVERSPEND_TITLE,
        message: `${top.category} is ${Math.round(top.pct)}% of its limit — over by ${CURRENCY_SYMBOL}${formatCurrency(overBy)}.`,
        tone: "danger",
        href: APP_ROUTES.budgets,
        actionLabel: UI_TEXT.REVIEW_BUDGETS,
      });
    }

    if (netSavings > 0 && current.totalIncome > 0) {
      const rate =
        (netSavings / current.totalIncome) * PERCENTAGE_THRESHOLDS.MAX;
      insights.push({
        id: "savings",
        title: UI_TEXT.INSIGHT_SAVINGS_TITLE,
        message: `You saved ${CURRENCY_SYMBOL}${formatCurrency(netSavings)} this period (${rate.toFixed(0)}% of income). Consider parking part of it toward a goal.`,
        tone: "success",
        href: APP_ROUTES.goals,
        actionLabel: UI_TEXT.VIEW_ALL,
      });
    } else if (netSavings < 0) {
      insights.push({
        id: "savings-negative",
        title: UI_TEXT.INSIGHT_SAVINGS_TITLE,
        message: `Expenses exceed income by ${CURRENCY_SYMBOL}${formatCurrency(Math.abs(netSavings))} this period. Review recent spend to rebalance.`,
        tone: "danger",
        href: APP_ROUTES.transactions,
        actionLabel: UI_TEXT.VIEW_TRANSACTIONS,
      });
    }

    const categoryShift = Object.keys(current.spendingByCategory)
      .map((category) => {
        const cur = current.spendingByCategory[category] ?? 0;
        const prev = previous.spendingByCategory[category] ?? 0;
        const change = percentChange(cur, prev);
        return { category, cur, prev, change };
      })
      .filter((c) => c.change != null && Math.abs(c.change) >= 10 && c.prev > 0)
      .sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!))[0];

    if (categoryShift && categoryShift.change != null) {
      const abs = Math.abs(categoryShift.change).toFixed(0);
      const lower = categoryShift.change < 0;
      insights.push({
        id: "shift",
        title: UI_TEXT.INSIGHT_CATEGORY_SHIFT_TITLE,
        message: lower
          ? `Nice progress — ${categoryShift.category} spending is about ${abs}% lower than last month.`
          : `${categoryShift.category} spending is about ${abs}% higher than last month.`,
        tone: lower ? "info" : "danger",
        href: APP_ROUTES.transactions,
        actionLabel: UI_TEXT.VIEW_TRANSACTIONS,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: "steady",
        title: UI_TEXT.INSIGHT_STEADY_TITLE,
        message: UI_TEXT.SMART_INSIGHTS_EMPTY,
        tone: "neutral",
      });
    }

    return insights.slice(0, DISPLAY_LIMITS.PREVIEW_ITEMS);
  }, [
    categoryLimits,
    current.spendingByCategory,
    current.totalIncome,
    formatCurrency,
    insightKey,
    netSavings,
    previous.spendingByCategory,
  ]);

  const mobileInsight = smartInsights[0];

  const shiftMonth = (delta: number) => {
    const d = new Date(selectedYear, selectedMonth - 1 + delta, 1);
    dispatch(
      setViewPeriod({
        viewPeriod: VIEW_PERIODS.MONTHLY as ViewPeriod,
        selectedMonth: d.getMonth() + 1,
        selectedYear: d.getFullYear(),
      }),
    );
  };

  const handleExport = () => {
    if (categorySpendFallback.length > 0) {
      exportChartData(
        categorySpendFallback.map((r) => ({
          Category: r.category,
          Spent: r.spent,
          Limit: r.limit || "",
          "Percent Used": r.limit > 0 ? Math.round(r.pct) : "",
          Status:
            r.limit > 0
              ? r.over
                ? UI_TEXT.OVER_BUDGET
                : UI_TEXT.WITHIN_BUDGET
              : "",
          Period: periodLabel,
          Income: current.totalIncome,
          Expense: current.totalExpense,
          "Net Savings": netSavings,
        })),
        "budgety-reports",
      );
      return;
    }
    exportChartData(
      incomeExpenseTrend.map((m) => ({
        Month: m.label,
        Income: m.income,
        Expense: m.expense,
        Period: periodLabel,
      })),
      "budgety-reports",
    );
  };

  const hasData = transactions.length > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={<BarChartIcon className="h-5 w-5" />}
        title={UI_TEXT.NO_DATA_AVAILABLE}
        description={UI_TEXT.REPORTS_SUBTITLE}
        action={
          <Button size="sm" onClick={() => navigateToTab("transactions")}>
            {UI_TEXT.VIEW_TRANSACTIONS}
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6 md:max-w-6xl md:space-y-5 lg:max-w-7xl">
      {/* Desktop header */}
      <div className="hidden items-start justify-between gap-4 md:flex">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-deep lg:text-[32px] lg:leading-10">
            {UI_TEXT.ANALYTICS_AND_REPORTS}
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base">
            {UI_TEXT.REPORTS_SUBTITLE}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-1 py-1 shadow-sm">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-surface-low"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="min-w-[6.5rem] text-center text-sm font-medium text-brand-deep">
              {periodLabel}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-surface-low"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="sm"
            leftIcon={<DownloadIcon className="h-4 w-4" />}
            onClick={handleExport}
          >
            {UI_TEXT.EXPORT_CSV}
          </Button>
        </div>
      </div>

      {/* Mobile summary chips */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <article className="rounded-2xl border border-white/60 bg-white p-4 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {UI_TEXT.TOTAL_SPENT}
          </p>
          <p className="mt-1 text-xl font-bold text-brand-deep">
            {CURRENCY_SYMBOL}
            {formatCurrency(current.totalExpense)}
          </p>
          {formatDelta(spendDelta) && (
            <Badge
              tone={spendDelta != null && spendDelta > 0 ? "danger" : "success"}
              className="mt-2 rounded-md"
            >
              {formatDelta(spendDelta)}
            </Badge>
          )}
        </article>
        <article className="rounded-2xl border border-white/60 bg-white p-4 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {UI_TEXT.REMAINING}
          </p>
          <p className="mt-1 text-xl font-bold text-brand-deep">
            {CURRENCY_SYMBOL}
            {formatCurrency(budgetLimit > 0 ? remaining : netSavings)}
          </p>
          <Badge
            tone={
              budgetHealthStatus === UI_TEXT.AT_RISK
                ? "danger"
                : budgetHealthStatus === UI_TEXT.WATCH
                  ? "warning"
                  : "success"
            }
            className="mt-2 rounded-md"
          >
            {budgetHealthStatus}
          </Badge>
        </article>
      </div>

      {/* Desktop KPI cards */}
      <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-3">
        <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
          <div className="mb-3 flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10 text-tertiary">
              <SavingsIcon className="h-5 w-5" />
            </span>
            {formatDelta(netDelta) && (
              <Badge
                tone={netDelta != null && netDelta >= 0 ? "success" : "danger"}
                className="rounded-md"
              >
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
        </article>

        <article className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
          <div className="mb-3 flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-expense/10 text-expense">
              <ShoppingCartIcon className="h-5 w-5" />
            </span>
            {formatDelta(spendDelta) && (
              <Badge
                tone={spendDelta != null && spendDelta <= 0 ? "success" : "danger"}
                className="rounded-md"
              >
                {formatDelta(spendDelta)}
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">{UI_TEXT.MONTHLY_SPEND}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
            {CURRENCY_SYMBOL}
            {formatCurrency(current.totalExpense)}
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
          <p className="text-sm font-medium text-gray-500">
            {UI_TEXT.BUDGET_ADHERENCE}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep md:text-[28px]">
            {UI_TEXT.ADHERENCE_SCORE.replace("{score}", String(adherenceScore))}
          </p>
          <ProgressBar
            value={adherenceScore}
            className="mt-3 h-1.5"
            colorClassName="bg-primary-main"
            trackClassName="bg-surface-high"
          />
        </article>
      </div>

      {/* Mobile: Spending Trends area chart */}
      <section className="rounded-2xl border border-white/60 bg-white p-4 shadow-card md:hidden">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-brand-deep">
            {UI_TEXT.SPENDING_TRENDS}
          </h2>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-gray-200 px-1 py-0.5 text-xs font-medium text-gray-600">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface-low"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <span className="px-1">{periodLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface-low"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendingTrendDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="reportsSpendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_THEME_COLORS.PRIMARY} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_THEME_COLORS.PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) =>
                  formatCurrencyForChart(
                    typeof value === "number" ? value : Number(value) || 0,
                  )
                }
              />
              <Area
                type="monotone"
                dataKey="spent"
                name={UI_TEXT.SPENT}
                stroke={CHART_THEME_COLORS.PRIMARY}
                strokeWidth={2.5}
                fill="url(#reportsSpendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Mobile: Smart Insights CTA */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-main to-primary-container p-4 text-white shadow-card md:hidden">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <InsightsIcon className="h-5 w-5" />
          </span>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {UI_TEXT.SMART_INSIGHTS_BETA}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/95">
          {mobileInsight?.message}
        </p>
        {mobileInsight?.href ? (
          <Link
            href={mobileInsight.href}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-main"
          >
            {UI_TEXT.APPLY_SUGGESTION}
            <ArrowForwardIcon className="h-4 w-4" />
          </Link>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="mt-4 bg-white text-primary-main hover:bg-white/90"
            onClick={() => navigateToTab("transactions")}
            rightIcon={<ArrowForwardIcon className="h-4 w-4" />}
          >
            {UI_TEXT.APPLY_SUGGESTION}
          </Button>
        )}
      </section>

      {/* Desktop mid row: Income vs Expenses + Smart Insights */}
      <div className="hidden gap-4 md:grid md:grid-cols-1 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5 xl:col-span-2">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-brand-deep md:text-lg">
                {UI_TEXT.INCOME_VS_EXPENSES}
              </h2>
              <p className="text-sm text-gray-500">{UI_TEXT.MONTHLY_TREND}</p>
            </div>
          </div>
          <div className="h-64 w-full md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={incomeExpenseTrend}
                margin={{ ...CHART_CONFIG.MARGIN, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={CHART_THEME_COLORS.GRID}
                  vertical={false}
                />
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
                  tickFormatter={(v) =>
                    `${CURRENCY_SYMBOL}${formatCompactCurrency(Number(v) || 0)}`
                  }
                />
                <Tooltip
                  formatter={(value) =>
                    formatCurrencyForChart(
                      typeof value === "number" ? value : Number(value) || 0,
                    )
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

        <section className="flex flex-col rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-brand-deep md:text-lg">
                {UI_TEXT.SMART_INSIGHTS}
              </h2>
              <Badge tone="info" className="rounded-md text-[10px]">
                {UI_TEXT.SMART_INSIGHTS_BETA}
              </Badge>
            </div>
          </div>
          <ul className="flex-1 space-y-3">
            {smartInsights.map((insight) => (
              <li
                key={insight.id}
                className="rounded-xl border border-gray-100 bg-surface-low/60 p-3"
              >
                <div className="flex gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      insight.tone === "danger" && "bg-red-100 text-expense",
                      insight.tone === "success" && "bg-green-100 text-income",
                      insight.tone === "info" && "bg-primary-soft text-primary-main",
                      insight.tone === "neutral" && "bg-surface-high text-on-surface-variant",
                    )}
                  >
                    {insight.tone === "danger" ? (
                      <WarningIcon className="h-4 w-4" />
                    ) : insight.tone === "success" ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <LightbulbIcon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-brand-deep">
                      {insight.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                      {insight.message}
                    </p>
                    {insight.href && insight.actionLabel && (
                      <Link
                        href={insight.href}
                        className="mt-1.5 inline-block text-xs font-semibold text-primary-main hover:underline"
                      >
                        {insight.actionLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="outline"
            className="mt-4 w-full"
            leftIcon={<RefreshIcon className="h-4 w-4" />}
            onClick={() => setInsightKey((k) => k + 1)}
          >
            {UI_TEXT.REFRESH_INSIGHTS}
          </Button>
        </section>
      </div>

      {/* Bottom: Category Limits + Expense Forecast (desktop) / Category Spend (mobile) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-brand-deep md:text-lg">
              <span className="md:hidden">{UI_TEXT.CATEGORY_SPEND}</span>
              <span className="hidden md:inline">{UI_TEXT.CATEGORY_LIMITS}</span>
            </h2>
            <button
              type="button"
              className="text-sm font-semibold text-primary-main hover:underline"
              onClick={() => navigateToTab("budgets")}
            >
              {UI_TEXT.VIEW_ALL}
            </button>
          </div>

          {categorySpendFallback.length === 0 ? (
            <EmptyState
              title={UI_TEXT.NO_SPENDING_DATA}
              description={UI_TEXT.NO_BUDGETS}
              action={
                <Button size="sm" onClick={() => navigateToTab("budgets")}>
                  {UI_TEXT.ADD_BUDGET}
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {categorySpendFallback.map((item) => (
                <li key={item.category}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${item.color}22`, color: item.color }}
                      >
                        <TrendingUpIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-brand-deep">
                          {item.category}
                        </p>
                        {item.limit > 0 && (
                          <p className="text-xs text-gray-500">
                            {CURRENCY_SYMBOL}
                            {formatCurrency(item.spent)} / {CURRENCY_SYMBOL}
                            {formatCurrency(item.limit)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {item.limit > 0 ? (
                        <>
                          <p
                            className={cn(
                              "text-sm font-bold",
                              item.over ? "text-expense" : "text-brand-deep",
                            )}
                          >
                            {Math.round(item.pct)}%
                          </p>
                          <p
                            className={cn(
                              "text-[10px] font-semibold uppercase",
                              item.over ? "text-expense" : "text-income",
                            )}
                          >
                            {item.over ? UI_TEXT.OVER_BUDGET : UI_TEXT.WITHIN_BUDGET}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-brand-deep">
                          {CURRENCY_SYMBOL}
                          {formatCurrency(item.spent)}
                        </p>
                      )}
                    </div>
                  </div>
                  <ProgressBar
                    value={item.limit > 0 ? item.pct : 0}
                    fillColor={item.over ? STITCH_COLORS.EXPENSE : item.color}
                    trackClassName="bg-surface-high"
                    className="h-2"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="hidden flex-col rounded-2xl border border-white/60 bg-white/80 p-4 shadow-card backdrop-blur-sm md:flex md:p-5">
          <h2 className="text-base font-semibold text-brand-deep md:text-lg">
            {UI_TEXT.EXPENSE_FORECAST}
          </h2>
          <p className="mb-3 text-sm text-gray-500">
            {UI_TEXT.NEXT_3_MONTHS_PROJECTED}
          </p>
          <div className="min-h-[160px] flex-1">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={expenseForecast.series}
                margin={{ top: 12, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportsForecastFill" x1="0" y1="0" x2="0" y2="1">
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
                    formatCurrencyForChart(
                      typeof value === "number" ? value : Number(value) || 0,
                    )
                  }
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name={UI_TEXT.EXPENSE}
                  stroke={CHART_THEME_COLORS.PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#reportsForecastFill)"
                  strokeDasharray="0"
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (cx == null || cy == null || !payload?.projected) return null;
                    return (
                      <circle
                        key={`fc-${index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={CHART_THEME_COLORS.PRIMARY_CONTAINER}
                        stroke={CHART_THEME_COLORS.DOT_STROKE}
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <p>
              {UI_TEXT.AVERAGE_MONTHLY_EXPENSE}:{" "}
              <span className="font-semibold text-brand-deep">
                {CURRENCY_SYMBOL}
                {formatCurrency(expenseForecast.avgMonthly)}
              </span>
            </p>
            <p>
              {UI_TEXT.PROJECTED_ANNUAL_EXPENSE}:{" "}
              <span className="font-semibold text-brand-deep">
                {CURRENCY_SYMBOL}
                {formatCurrency(expenseForecast.projectedAnnual)}
              </span>
            </p>
            <p className="font-semibold text-primary-main">
              {UI_TEXT.FORECAST_ESTIMATE.replace(
                "{amount}",
                `${CURRENCY_SYMBOL}${formatCompactCurrency(expenseForecast.nextEstimate)}`,
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
