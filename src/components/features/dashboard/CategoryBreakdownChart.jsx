"use client";

import {
  CHART_CONFIG,
  DISPLAY_LIMITS,
  STITCH_CHART_COLORS,
  UI_TEXT,
} from "@constants";
import { DashboardWidget } from "@components/features/dashboard/DashboardWidget";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useAppSelector } from "@store/hooks";
import { exportChartData } from "@utils/exportUtils";
import { useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  const { formatCurrencyForChart } = useCurrencyFormatter();

  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-elevated">
        <div className="mb-0.5 text-sm font-semibold text-brand-deep">
          {payload[0].name}
        </div>
        <div className="text-sm font-medium text-primary-main">
          {formatCurrencyForChart(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

const CategoryBreakdownChart = ({ className = "" }) => {
  const transactions = useAppSelector((s) => s.transactions.items);
  const { viewPeriod, selectedMonth, selectedYear } = useAppSelector((s) => s.ui);
  const { spendingByCategory } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
  );
  const { formatCurrencyForChart } = useCurrencyFormatter();
  const [refreshKey, setRefreshKey] = useState(0);

  const chartData = useMemo(() => {
    void refreshKey;
    return Object.entries(spendingByCategory)
      .map(([name, value], index) => ({
        name,
        value,
        color: STITCH_CHART_COLORS[index % STITCH_CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES);
  }, [spendingByCategory, refreshKey]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0) || 1,
    [chartData],
  );

  const handleExport = () => {
    const exportData = chartData.map((item) => ({
      Category: item.name,
      Amount: item.value,
      Percentage: `${((item.value / total) * 100).toFixed(2)}%`,
    }));
    exportChartData(exportData, "category_breakdown");
  };

  return (
    <DashboardWidget
      title={UI_TEXT.CATEGORY_BREAKDOWN}
      onRefresh={() => setRefreshKey((k) => k + 1)}
      onExport={handleExport}
      className={className}
    >
      {chartData.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center">
          <p className="text-sm text-gray-400">{UI_TEXT.NO_SPENDING_DATA}</p>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div
            className="relative mx-auto w-full max-w-[260px]"
            style={{ height: CHART_CONFIG.DEFAULT_CHART_HEIGHT - 48 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={CHART_CONFIG.PIE_INNER_RADIUS}
                  outerRadius={CHART_CONFIG.PIE_OUTER_RADIUS}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
            {chartData.map((item) => {
              const pct = ((item.value / total) * 100).toFixed(1);
              return (
                <li
                  key={item.name}
                  className="flex items-center gap-2 text-xs text-gray-600"
                  title={formatCurrencyForChart(item.value)}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">
                    {item.name}{" "}
                    <span className="text-gray-400">({pct}%)</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </DashboardWidget>
  );
};

export default CategoryBreakdownChart;
