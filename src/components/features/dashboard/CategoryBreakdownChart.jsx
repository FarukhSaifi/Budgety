import {
  CATEGORY_COLORS,
  CHART_CONFIG,
  CURRENCY_SYMBOL,
  DISPLAY_LIMITS,
  TIMEOUTS,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { ChartContainer } from "@ui/ChartContainer";
import { Widget } from "@ui/Widget";
import { exportChartData } from "@utils/exportUtils";
import { showInfo } from "@utils/toast";
import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  const { formatCurrency } = useCurrencyFormatter();

  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
        <div className="mb-1 font-semibold text-gray-900">
          {payload[0].name}
        </div>
        <div className="font-medium text-indigo-600">
          {`${CURRENCY_SYMBOL}${formatCurrency(payload[0].value, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
        </div>
      </div>
    );
  }
  return null;
};

const CategoryBreakdownChart = () => {
  const { transactions, viewPeriod, selectedMonth, selectedYear } = useBudget();
  const { spendingByCategory } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear
  );
  const { formatCurrency } = useCurrencyFormatter();

  // Prepare data for pie chart
  const chartData = React.useMemo(() => {
    return Object.entries(spendingByCategory)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || CHART_CONFIG.COLORS[0],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES);
  }, [spendingByCategory]);

  const renderLabel = (entry) => {
    const percentage = (
      (entry.value /
        Object.values(spendingByCategory).reduce((a, b) => a + b, 0)) *
      100
    ).toFixed(1);
    return `${entry.name}: ${percentage}%`;
  };

  const handleExport = () => {
    const total = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);
    const exportData = chartData.map((item) => ({
      Category: item.name,
      Amount: item.value,
      Percentage: ((item.value / total) * 100).toFixed(2) + "%",
    }));
    exportChartData(exportData, "category_breakdown");
  };

  const handleViewDetails = () => {
    const total = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);
    const previewLimit = Math.min(
      DISPLAY_LIMITS.PREVIEW_ITEMS,
      chartData.length
    );
    const details = chartData
      .slice(0, DISPLAY_LIMITS.PREVIEW_ITEMS)
      .map(
        (item) =>
          `${item.name}: ${CURRENCY_SYMBOL}${formatCurrency(item.value, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} (${((item.value / total) * 100).toFixed(1)}%)`
      )
      .join("\n");
    showInfo(
      `${UI_TEXT.CATEGORY_BREAKDOWN} (top ${previewLimit}):\n${details}${
        chartData.length > DISPLAY_LIMITS.PREVIEW_ITEMS
          ? `\n... and ${
              chartData.length - DISPLAY_LIMITS.PREVIEW_ITEMS
            } more categories`
          : ""
      }`,
      { autoClose: TIMEOUTS.TOAST_DETAILS }
    );
  };

  if (chartData.length === 0) {
    return (
      <Widget
        title={UI_TEXT.CATEGORY_BREAKDOWN}
        onRefresh={() => window.location.reload()}
      >
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600">{UI_TEXT.NO_SPENDING_DATA}</p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget
      title={UI_TEXT.CATEGORY_BREAKDOWN}
      onExport={handleExport}
      onViewDetails={handleViewDetails}
      onRefresh={() => window.location.reload()}
    >
      <ChartContainer height={CHART_CONFIG.DEFAULT_CHART_HEIGHT}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={CHART_CONFIG.PIE_OUTER_RADIUS}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Widget>
  );
};

export default CategoryBreakdownChart;
