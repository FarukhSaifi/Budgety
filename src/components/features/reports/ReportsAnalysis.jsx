import { useMemo } from "react";
import {
  Bar,
  BarChart,
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
  PERCENTAGE_THRESHOLDS,
  TRANSACTION_TYPES,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";

const ReportsAnalysis = () => {
  const { transactions, budgets, selectedMonth, selectedYear } = useBudget();
  const {
    totalIncome,
    totalExpense,
    balance,
    spendingByCategory,
    monthlyBreakdown,
  } = useBudgetCalculations(
    transactions,
    VIEW_PERIODS.YEARLY,
    selectedMonth,
    selectedYear
  );
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  const formatCurrencyForChart = (value) => {
    return `${CURRENCY_SYMBOL}${formatCurrency(value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Budget vs Actual Analysis
  const budgetVsActual = useMemo(() => {
    const currentBudgets = budgets.filter(
      (b) => b.month === selectedMonth && b.year === selectedYear
    );

    return currentBudgets.map((budget) => {
      const actual = spendingByCategory[budget.category] || 0;
      const variance = budget.amount - actual;
      const variancePercent =
        (variance / budget.amount) * PERCENTAGE_THRESHOLDS.MAX;

      return {
        category: budget.category,
        budget: budget.amount,
        actual,
        variance,
        variancePercent,
        isOverBudget: actual > budget.amount,
      };
    });
  }, [budgets, spendingByCategory, selectedMonth, selectedYear]);

  // Spending Trends (last 6 months)
  const spendingTrends = useMemo(() => {
    const trends = [];
    const currentDate = new Date(selectedYear, selectedMonth - 1, 1);

    for (let i = DISPLAY_LIMITS.TREND_MONTHS - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const monthTransactions = transactions.filter((t) => {
        if (!t.date) return false;
        const tDate = new Date(t.date);
        return tDate.getMonth() + 1 === month && tDate.getFullYear() === year;
      });

      const income = monthTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const expense = monthTransactions
        .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      trends.push({
        month: formatDate(date.toISOString().split("T")[0], "monthYear"),
        income,
        expense,
        savings: income - expense,
      });
    }

    return trends;
  }, [transactions, selectedMonth, selectedYear, formatDate]);

  // Category Analysis
  const categoryAnalysis = useMemo(() => {
    return Object.entries(spendingByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpense) * PERCENTAGE_THRESHOLDS.MAX,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, DISPLAY_LIMITS.TOP_CATEGORIES_ANALYSIS);
  }, [spendingByCategory, totalExpense]);

  // Expense Forecast (based on average)
  const expenseForecast = useMemo(() => {
    if (monthlyBreakdown.length < DISPLAY_LIMITS.FORECAST_MONTHS) return null;

    const recentExpenses = monthlyBreakdown
      .slice(-DISPLAY_LIMITS.FORECAST_MONTHS)
      .map((m) => m.expense);
    const average =
      recentExpenses.reduce((a, b) => a + b, 0) / recentExpenses.length;

    return {
      average,
      projected: average * DATE_CONSTANTS.MONTHS_PER_YEAR,
      trend:
        recentExpenses[recentExpenses.length - 1] > recentExpenses[0]
          ? "increasing"
          : "decreasing",
    };
  }, [monthlyBreakdown]);

  return (
    <div className="mx-auto mb-2 md:mb-4">
      <div className="mb-2 md:mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">{UI_TEXT.REPORTS}</h3>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          {UI_TEXT.COMPREHENSIVE_FINANCIAL_ANALYSIS}
        </p>
      </div>

      {/* Budget vs Actual */}
      {budgetVsActual.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-2 md:mb-4">
          <div className="bg-purple-500 text-white px-2 md:px-4 py-2 md:py-4 rounded-t-lg">
            <h5 className="text-base md:text-lg font-semibold">
              {UI_TEXT.BUDGET_VS_ACTUAL}
            </h5>
          </div>
          <div className="p-2 md:p-4 overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-left">Category</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right">Budget</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right">Actual</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right">Variance</th>
                    <th className="px-2 md:px-4 py-2 md:py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {budgetVsActual.map((item) => (
                    <tr key={item.category} className="hover:bg-gray-50">
                      <td className="px-2 md:px-4 py-2 md:py-3 font-medium">{item.category}</td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right">
                        {CURRENCY_SYMBOL}
                        {formatCurrencyForChart(item.budget)}
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right">
                        {CURRENCY_SYMBOL}
                        {formatCurrencyForChart(item.actual)}
                      </td>
                      <td
                        className={`px-2 md:px-4 py-2 md:py-3 text-right font-semibold ${
                          item.isOverBudget ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {item.isOverBudget ? "-" : "+"}
                        {CURRENCY_SYMBOL}
                        {formatCurrencyForChart(Math.abs(item.variance))} (
                        {item.variancePercent.toFixed(1)}%)
                      </td>
                      <td className="px-2 md:px-4 py-2 md:py-3 text-right">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isOverBudget
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {item.isOverBudget
                            ? UI_TEXT.OVER_BUDGET
                            : UI_TEXT.UNDER_BUDGET}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Spending Trends */}
      {spendingTrends.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-2 md:mb-4">
          <div className="bg-blue-500 text-white px-2 md:px-4 py-2 md:py-4 rounded-t-lg">
            <h5 className="text-base md:text-lg font-semibold">{UI_TEXT.SPENDING_TRENDS}</h5>
          </div>
          <div className="p-2 md:p-4">
            <ResponsiveContainer
              width="100%"
              height={CHART_CONFIG.DEFAULT_CHART_HEIGHT}
            >
              <LineChart data={spendingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCurrencyForChart} />
                <Tooltip formatter={(value) => formatCurrencyForChart(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#28b9b5"
                  strokeWidth={2}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ff5049"
                  strokeWidth={2}
                  name="Expense"
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#2ecc71"
                  strokeWidth={2}
                  name="Savings"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Analysis */}
      {categoryAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow-md mb-2 md:mb-4">
          <div className="bg-green-500 text-white px-2 md:px-4 py-2 md:py-4 rounded-t-lg">
            <h5 className="text-base md:text-lg font-semibold">
              {UI_TEXT.CATEGORY_ANALYSIS}
            </h5>
          </div>
          <div className="p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
              <div>
                <ResponsiveContainer
                  width="100%"
                  height={CHART_CONFIG.DEFAULT_CHART_HEIGHT}
                >
                  <BarChart data={categoryAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis tickFormatter={formatCurrencyForChart} />
                    <Tooltip
                      formatter={(value) => formatCurrencyForChart(value)}
                    />
                    <Bar dataKey="amount" fill="#ff5049" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoryAnalysis.map((item) => (
                  <div
                    key={item.category}
                    className="border-l-4 border-red-500 pl-4"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-800">
                        {item.category}
                      </span>
                      <span className="font-bold text-gray-800">
                        {CURRENCY_SYMBOL}
                        {formatCurrencyForChart(item.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {item.percentage.toFixed(1)}% of total expenses
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Forecast */}
      {expenseForecast && (
        <div className="bg-white rounded-lg shadow-md mb-2 md:mb-4">
          <div className="bg-yellow-500 text-white px-2 md:px-4 py-2 md:py-4 rounded-t-lg">
            <h5 className="text-base md:text-lg font-semibold">
              {UI_TEXT.EXPENSE_FORECAST}
            </h5>
          </div>
          <div className="p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">
                  Average Monthly Expense
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {CURRENCY_SYMBOL}
                  {formatCurrencyForChart(expenseForecast.average)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600 mb-1">
                  {UI_TEXT.PROJECTED_ANNUAL_EXPENSE}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {CURRENCY_SYMBOL}
                  {formatCurrencyForChart(expenseForecast.projected)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-gray-600 mb-1">
                  {UI_TEXT.TREND}
                </div>
                <div className="text-2xl font-bold text-purple-600 capitalize">
                  {expenseForecast.trend}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">
            {UI_TEXT.TOTAL_INCOME_LABEL}
          </div>
          <div className="text-lg md:text-2xl font-bold text-green-600">
            {CURRENCY_SYMBOL}
            {formatCurrencyForChart(totalIncome)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">
            {UI_TEXT.TOTAL_EXPENSES_LABEL}
          </div>
          <div className="text-lg md:text-2xl font-bold text-red-600">
            {CURRENCY_SYMBOL}
            {formatCurrencyForChart(totalExpense)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">
            {UI_TEXT.NET_BALANCE}
          </div>
          <div
            className={`text-lg md:text-2xl font-bold ${
              balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {CURRENCY_SYMBOL}
            {formatCurrencyForChart(Math.abs(balance))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-2 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 mb-1">
            {UI_TEXT.SAVINGS_RATE}
          </div>
          <div className="text-lg md:text-2xl font-bold text-blue-600">
            {totalIncome > 0
              ? ((balance / totalIncome) * PERCENTAGE_THRESHOLDS.MAX).toFixed(1)
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalysis;
