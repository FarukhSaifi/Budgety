"use client";

import { useMemo, useState } from "react";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_CONFIG, DISPLAY_LIMITS, UI_TEXT } from "@constants";

import { DashboardWidget } from "@components/features/dashboard/DashboardWidget";

import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";
import { exportChartData } from "@utils/exportUtils";
import { buildRollingMonthTrend } from "@utils/periodFilter";

import { CHART_THEME_COLORS } from "@/lib/theme";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-outline-variant)",
  borderRadius: "12px",
  boxShadow: "var(--shadow-elevated)",
  color: "var(--color-on-surface)",
};

interface MonthlyTrendChartProps {
  className?: string;
}

type TrendDatum = {
  label: string;
  Income: number;
  Expense: number;
};

export default function MonthlyTrendChart({ className = "" }: MonthlyTrendChartProps) {
  const transactions = useAppSelector((s) => s.transactions.items);
  const { selectedMonth, selectedYear } = useAppSelector((s) => s.ui);
  const { formatCurrencyForChart } = useCurrencyFormatter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Rolling N-month income/expense bars (matches reference Monthly Trend)
  const chartData = useMemo((): TrendDatum[] => {
    void refreshKey;
    return buildRollingMonthTrend(transactions, selectedMonth, selectedYear, DISPLAY_LIMITS.TREND_MONTHS).map(
      ({ label, Income, Expense }) => ({ label, Income, Expense }),
    );
  }, [transactions, selectedMonth, selectedYear, refreshKey]);

  const handleExport = () => {
    const exportData = chartData.map((item) => ({
      Period: item.label,
      Income: item.Income,
      Expense: item.Expense,
      Net: item.Income - item.Expense,
    }));
    exportChartData(exportData, "monthly_trend");
  };

  const empty = chartData.every((d) => d.Income === 0 && d.Expense === 0);

  return (
    <DashboardWidget
      title={UI_TEXT.MONTHLY_TREND}
      onRefresh={() => setRefreshKey((k) => k + 1)}
      onExport={handleExport}
      className={className}
    >
      {empty ? (
        <div className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-on-surface-variant">{UI_TEXT.NO_DATA_AVAILABLE}</p>
        </div>
      ) : (
        <div style={{ height: CHART_CONFIG.DEFAULT_CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME_COLORS.GRID} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCurrencyForChart}
                tick={{ fontSize: 11, fill: CHART_THEME_COLORS.TICK }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value) => formatCurrencyForChart(Number(value))}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "var(--color-on-surface)" }}
                itemStyle={{ color: "var(--color-on-surface-variant)" }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 8,
                  color: "var(--color-on-surface-variant)",
                }}
              />
              <Bar dataKey="Expense" fill={CHART_THEME_COLORS.EXPENSE} radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Income" fill={CHART_THEME_COLORS.INCOME} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardWidget>
  );
}
