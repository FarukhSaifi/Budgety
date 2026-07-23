"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
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

import { APP_ROUTES } from "@constants/routes";

import { Badge, Button, EmptyState, PeriodShiftPill, ProgressBar } from "@common";

import {
  ArrowForwardIcon,
  CheckCircleIcon,
  DownloadIcon,
  HealthAndSafetyIcon,
  InsightsIcon,
  LightbulbIcon,
  RefreshIcon,
  TrendingUpIcon,
  WarningIcon,
} from "@components/icons";

import { useAppNavigation } from "@hooks/useAppNavigation";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useUiPeriod } from "@hooks/useUiPeriod";
import { useAppSelector } from "@store/hooks";
import { cn } from "@utils/cn";
import { getCategoryChartColor } from "@utils/colorUtils";
import { getMonthYear } from "@utils/dateUtils";
import { exportChartData } from "@utils/exportUtils";
import { buildRollingMonthTrend, shiftMonthYear } from "@utils/periodFilter";
import { percentChange } from "@utils/transactionFilters";

import { CHART_THEME_COLORS } from "@/lib/theme";
import type { ViewPeriod } from "@/types";

import { formatDelta, isCurrentCalendarMonth } from "./analyticsHelpers";

type InsightTone = "danger" | "success" | "info" | "neutral";

type SmartInsight = {
  id: string;
  title: string;
  message: string;
  tone: InsightTone;
  href?: string;
  actionLabel?: string;
};

/**
 * Reports & Analysis panel — formerly ReportsScreen.
 * Mounted as the "Reports" tab on the unified Analytics page.
 */
export function ReportsInsightsPanel() {
  const navigateToTab = useAppNavigation();
  const transactions = useAppSelector((state) => state.transactions.items);
  const budgets = useAppSelector((state) => state.budgets.items);
  const { selectedMonth, selectedYear, shiftMonth } = useUiPeriod();
  const { formatCurrency, formatCurrencyForChart, formatCompactCurrency } = useCurrencyFormatter();
  const [insightKey, setInsightKey] = useState(0);

  const current = useBudgetCalculations(transactions, VIEW_PERIODS.MONTHLY as ViewPeriod, selectedMonth, selectedYear);

  const previousMonth = useMemo(() => shiftMonthYear(selectedMonth, selectedYear, -1), [selectedMonth, selectedYear]);
  const previous = useBudgetCalculations(
    transactions,
    VIEW_PERIODS.MONTHLY as ViewPeriod,
    previousMonth.month,
    previousMonth.year,
  );

  const periodLabel = isCurrentCalendarMonth(selectedMonth, selectedYear)
    ? UI_TEXT.THIS_MONTH
    : `${MONTHS[selectedMonth - 1]?.slice(0, 3) ?? ""} ${selectedYear}`;

  const netSavings = current.totalIncome - current.totalExpense;
  const spendDelta = percentChange(current.totalExpense, previous.totalExpense);

  const budgetLimit = useMemo(
    () => budgets.filter((b) => b.period === "monthly").reduce((sum, b) => sum + (b.limitAmount || 0), 0),
    [budgets],
  );

  const remaining = Math.max(0, budgetLimit - current.totalExpense);

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
    const used = (current.totalExpense / budgetLimit) * PERCENTAGE_THRESHOLDS.MAX;
    if (used >= PERCENTAGE_THRESHOLDS.MAX) return UI_TEXT.AT_RISK;
    if (used >= PERCENTAGE_THRESHOLDS.WARNING) return UI_TEXT.WATCH;
    return UI_TEXT.ON_TRACK;
  }, [budgetLimit, current.totalExpense]);

  const incomeExpenseTrend = useMemo(
    () =>
      buildRollingMonthTrend(transactions, selectedMonth, selectedYear, DISPLAY_LIMITS.TREND_MONTHS).map(
        ({ key, label, Income, Expense }) => ({
          key,
          label,
          income: Income,
          expense: Expense,
        }),
      ),
    [transactions, selectedMonth, selectedYear],
  );

  const spendingTrendDaily = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const checkpoints = [1, 8, 15, 22, daysInMonth].filter((d, i, arr) => arr.indexOf(d) === i && d <= daysInMonth);
    const cumulative = new Map<number, number>();
    for (const day of checkpoints) cumulative.set(day, 0);

    for (const t of current.filteredTransactions) {
      if (t.type !== "expense") continue;
      const my = getMonthYear(t.date);
      if (!my || my.month !== selectedMonth || my.year !== selectedYear) continue;
      const dayNum = Number(String(t.date).slice(8, 10)) || new Date(t.date).getDate();
      if (!Number.isFinite(dayNum)) continue;
      for (const checkpoint of checkpoints) {
        if (dayNum <= checkpoint) {
          cumulative.set(checkpoint, (cumulative.get(checkpoint) || 0) + (t.amount || 0));
        }
      }
    }

    return checkpoints.map((day) => ({
      label: day === 1 ? "1st" : day === 2 ? "2nd" : day === 3 ? "3rd" : `${day}th`,
      spent: cumulative.get(day) || 0,
    }));
  }, [current.filteredTransactions, selectedMonth, selectedYear]);

  const categoryLimits = useMemo(() => {
    return budgets
      .filter((b) => b.period === "monthly")
      .map((b, i) => {
        const spent = current.spendingByCategory[b.category] ?? 0;
        const limit = b.limitAmount || 0;
        const pct = limit > 0 ? (spent / limit) * PERCENTAGE_THRESHOLDS.MAX : 0;
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
    const avg = withSpend.length > 0 ? withSpend.reduce((s, m) => s + m.expense, 0) / withSpend.length : 0;
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
      const rate = (netSavings / current.totalIncome) * PERCENTAGE_THRESHOLDS.MAX;
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

  const handleExport = () => {
    if (categorySpendFallback.length > 0) {
      exportChartData(
        categorySpendFallback.map((r) => ({
          Category: r.category,
          Spent: r.spent,
          Limit: r.limit || "",
          "Percent Used": r.limit > 0 ? Math.round(r.pct) : "",
          Status: r.limit > 0 ? (r.over ? UI_TEXT.OVER_BUDGET : UI_TEXT.WITHIN_BUDGET) : "",
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

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-brand-deep md:text-xl">{UI_TEXT.REPORTS}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{UI_TEXT.REPORTS_SUBTITLE}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodShiftPill
            label={periodLabel}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            prevLabel={UI_TEXT.PREVIOUS_MONTH}
            nextLabel={UI_TEXT.NEXT_MONTH}
          />
          <Button size="sm" leftIcon={<DownloadIcon className="h-4 w-4" />} onClick={handleExport}>
            {UI_TEXT.EXPORT_CSV}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <article className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{UI_TEXT.TOTAL_SPENT}</p>
          <p className="mt-1 text-xl font-bold text-brand-deep md:text-2xl">
            {CURRENCY_SYMBOL}
            {formatCurrency(current.totalExpense)}
          </p>
          {formatDelta(spendDelta) && (
            <Badge tone={spendDelta != null && spendDelta > 0 ? "danger" : "success"} className="mt-2 rounded-md">
              {formatDelta(spendDelta)}
            </Badge>
          )}
        </article>
        <article className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card md:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{UI_TEXT.REMAINING}</p>
          <p className="mt-1 text-xl font-bold text-brand-deep md:text-2xl">
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
        <article className="col-span-2 rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card md:col-span-1 md:p-5">
          <div className="mb-2 flex items-start justify-between">
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
          <p className="text-sm font-medium text-gray-500">{UI_TEXT.BUDGET_ADHERENCE}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-brand-deep">
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

      <section className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card md:hidden md:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-brand-deep">{UI_TEXT.SPENDING_TRENDS}</h3>
          <PeriodShiftPill
            size="sm"
            label={periodLabel}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
            prevLabel={UI_TEXT.PREVIOUS_MONTH}
            nextLabel={UI_TEXT.NEXT_MONTH}
          />
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
                formatter={(value) => formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)}
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

      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-main to-primary-container p-4 text-white shadow-card md:hidden">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <InsightsIcon className="h-5 w-5" />
          </span>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            {UI_TEXT.SMART_INSIGHTS_BETA}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/95">{mobileInsight?.message}</p>
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

      <div className="hidden gap-4 md:grid md:grid-cols-1 xl:grid-cols-3">
        <section className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card backdrop-blur-sm md:p-5 xl:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.INCOME_VS_EXPENSES}</h3>
            <p className="text-sm text-gray-500">{UI_TEXT.MONTHLY_TREND}</p>
          </div>
          <div className="h-64 w-full md:h-72">
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
                  formatter={(value) => formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)}
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

        <section className="flex flex-col rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card backdrop-blur-sm md:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.SMART_INSIGHTS}</h3>
              <Badge tone="info" className="rounded-md text-[10px]">
                {UI_TEXT.SMART_INSIGHTS_BETA}
              </Badge>
            </div>
          </div>
          <ul className="flex-1 space-y-3">
            {smartInsights.map((insight) => (
              <li key={insight.id} className="rounded-xl border border-outline-variant/40 bg-surface-low/60 p-3">
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
                    <h4 className="text-sm font-bold text-brand-deep">{insight.title}</h4>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{insight.message}</p>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card backdrop-blur-sm md:p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-brand-deep md:text-lg">
              <span className="md:hidden">{UI_TEXT.CATEGORY_SPEND}</span>
              <span className="hidden md:inline">{UI_TEXT.CATEGORY_LIMITS}</span>
            </h3>
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
                        <p className="truncate text-sm font-semibold text-brand-deep">{item.category}</p>
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
                          <p className={cn("text-sm font-bold", item.over ? "text-expense" : "text-brand-deep")}>
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

        <section className="flex flex-col rounded-2xl border border-outline-variant/60 bg-card/80 p-4 shadow-card backdrop-blur-sm md:p-5">
          <h3 className="text-base font-semibold text-brand-deep md:text-lg">{UI_TEXT.EXPENSE_FORECAST}</h3>
          <p className="mb-3 text-sm text-gray-500">{UI_TEXT.NEXT_3_MONTHS_PROJECTED}</p>
          <div className="min-h-[160px] flex-1">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={expenseForecast.series} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
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
                  formatter={(value) => formatCurrencyForChart(typeof value === "number" ? value : Number(value) || 0)}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name={UI_TEXT.EXPENSE}
                  stroke={CHART_THEME_COLORS.PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#reportsForecastFill)"
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
          <div className="mt-2 space-y-1 border-t border-outline-variant/40 pt-3 text-xs text-gray-500">
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
