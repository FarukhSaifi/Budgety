"use client";

import {
  CHART_CONFIG,
  DISPLAY_LIMITS,
  MONTHS,
  STITCH_COLORS,
  UI_TEXT,
} from "@constants";
import { DashboardWidget } from "@components/features/dashboard/DashboardWidget";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";
import { getMonthYear } from "@utils/dateUtils";
import { exportChartData } from "@utils/exportUtils";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MonthlyTrendChart = ({ className = "" }) => {
  const transactions = useAppSelector((s) => s.transactions.items);
  const { selectedMonth, selectedYear } = useAppSelector((s) => s.ui);
  const { formatCurrencyForChart } = useCurrencyFormatter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Rolling N-month income/expense bars (matches reference Monthly Trend)
  const chartData = useMemo(() => {
    void refreshKey;
    const months = [];
    const anchor = new Date(selectedYear, selectedMonth - 1, 1);
    for (let i = DISPLAY_LIMITS.TREND_MONTHS - 1; i >= 0; i -= 1) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: MONTHS[d.getMonth()].slice(0, 3),
        Income: 0,
        Expense: 0,
      });
    }
    const index = new Map(months.map((m) => [m.key, m]));
    transactions.forEach((t) => {
      const my = getMonthYear(t.date);
      if (!my) return;
      const entry = index.get(`${my.year}-${my.month}`);
      if (!entry) return;
      if (t.type === "income") entry.Income += t.amount || 0;
      else entry.Expense += t.amount || 0;
    });
    return months.map(({ label, Income, Expense }) => ({
      label,
      Income,
      Expense,
    }));
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
          <p className="text-sm text-gray-400">{UI_TEXT.NO_DATA_AVAILABLE}</p>
        </div>
      ) : (
        <div style={{ height: CHART_CONFIG.DEFAULT_CHART_HEIGHT }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8EAF2"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatCurrencyForChart}
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value) => formatCurrencyForChart(Number(value))}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E8EAF2",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(19,27,46,0.08)",
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="Expense"
                fill={STITCH_COLORS.EXPENSE}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="Income"
                fill={STITCH_COLORS.INCOME}
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardWidget>
  );
};

export default MonthlyTrendChart;
