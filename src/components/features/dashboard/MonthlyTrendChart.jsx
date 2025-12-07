import {
  CHART_CONFIG,
  CURRENCY_SYMBOL,
  DISPLAY_LIMITS,
  TIMEOUTS,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { ChartContainer } from "@ui/ChartContainer";
import { Widget } from "@ui/Widget";
import { exportChartData } from "@utils/exportUtils";
import { showInfo } from "@utils/toast";
import React from "react";
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

const MonthlyTrendChart = () => {
  const { transactions, viewPeriod, selectedMonth, selectedYear } = useBudget();
  const { monthlyBreakdown } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear
  );
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  // Prepare data for the chart
  const chartData = React.useMemo(() => {
    if (viewPeriod === VIEW_PERIODS.MONTHLY) {
      // For monthly view, show daily breakdown or just current month
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

      const dailyData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth - 1, day);
        const dateStr = date.toISOString().split("T")[0];

        const dayTransactions = transactions.filter((t) => {
          if (!t.date) return false;
          return t.date.startsWith(dateStr);
        });

        const income = dayTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const expense = dayTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        dailyData.push({
          date: day,
          Income: income,
          Expense: expense,
        });
      }

      return dailyData;
    }

    // For yearly/all view, use monthly breakdown
    return monthlyBreakdown.map((month) => {
      const dateStr = `${month.year}-${String(month.month).padStart(
        2,
        "0"
      )}-01`;
      return {
        month: formatDate(dateStr, "monthYear"),
        Income: month.income,
        Expense: month.expense,
      };
    });
  }, [
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
    monthlyBreakdown,
    formatDate,
  ]);

  const handleExport = () => {
    const exportData = chartData.map((item) => ({
      Period:
        viewPeriod === VIEW_PERIODS.MONTHLY ? `Day ${item.date}` : item.month,
      Income: item.Income,
      Expense: item.Expense,
      Net: item.Income - item.Expense,
    }));
    exportChartData(exportData, "monthly_trend");
  };

  const handleViewDetails = () => {
    // Show detailed table view in a modal or info toast
    const details = chartData
      .slice(0, DISPLAY_LIMITS.PREVIEW_ITEMS)
      .map(
        (item) =>
          `${
            viewPeriod === VIEW_PERIODS.MONTHLY
              ? `Day ${item.date}`
              : item.month
          }: Income: ${CURRENCY_SYMBOL}${formatCurrency(item.Income, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}, Expense: ${CURRENCY_SYMBOL}${formatCurrency(item.Expense, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
      )
      .join("\n");
    showInfo(
      `${UI_TEXT.MONTHLY_TREND} (showing first ${
        DISPLAY_LIMITS.PREVIEW_ITEMS
      }):\n${details}${
        chartData.length > DISPLAY_LIMITS.PREVIEW_ITEMS
          ? `\n... and ${chartData.length - DISPLAY_LIMITS.PREVIEW_ITEMS} more`
          : ""
      }`,
      { autoClose: TIMEOUTS.TOAST_DETAILS }
    );
  };

  const formatCurrencyForChart = (value) => {
    return `${CURRENCY_SYMBOL}${formatCurrency(value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (chartData.length === 0) {
    return (
      <Widget
        title={UI_TEXT.MONTHLY_TREND}
        onRefresh={() => window.location.reload()}
      >
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600">{UI_TEXT.NO_DATA_AVAILABLE}</p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget
      title={UI_TEXT.MONTHLY_TREND}
      onExport={handleExport}
      onViewDetails={handleViewDetails}
      onRefresh={() => window.location.reload()}
    >
      <ChartContainer height={CHART_CONFIG.DEFAULT_CHART_HEIGHT}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={CHART_CONFIG.MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={viewPeriod === VIEW_PERIODS.MONTHLY ? "date" : "month"}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatCurrencyForChart}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => formatCurrencyForChart(value)}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="Income" fill="#28b9b5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expense" fill="#ff5049" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Widget>
  );
};

export default MonthlyTrendChart;
