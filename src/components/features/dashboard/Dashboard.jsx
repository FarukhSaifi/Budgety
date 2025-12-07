import { useBudget } from "@context/BudgetContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { lazy, Suspense } from "react";

// Lazy load dashboard components for further code splitting
const SummaryCards = lazy(() => import("./SummaryCards"));
const MonthlyTrendChart = lazy(() => import("./MonthlyTrendChart"));
const CategoryBreakdownChart = lazy(() => import("./CategoryBreakdownChart"));
const RecentTransactions = lazy(() =>
  import("../transactions/RecentTransactions")
);

// Loading fallback components - declared outside to avoid recreation during render
const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg border border-gray-200">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-2"></div>
      <p className="text-gray-500 text-xs">Loading chart...</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { transactions, viewPeriod, selectedMonth, selectedYear } = useBudget();
  const { totalIncome, totalExpense, netSavings } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear
  );

  return (
    <div className="w-full space-y-2 md:space-y-4">
      {/* Summary Cards */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 mb-2 md:mb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        }
      >
        <SummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          balance={netSavings}
        />
      </Suspense>

      {/* Charts and Recent Transactions Row */}
      <div className="grid grid-cols-1 gap-2 md:gap-4 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <Suspense fallback={<ChartLoadingFallback />}>
          <MonthlyTrendChart />
        </Suspense>

        {/* Category Breakdown Chart */}
        <Suspense fallback={<ChartLoadingFallback />}>
          <CategoryBreakdownChart />
        </Suspense>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 gap-2 md:gap-4 lg:grid-cols-2">
        <Suspense
          fallback={
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-6 bg-gray-100 rounded w-1/3 mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-50 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <RecentTransactions transactions={transactions} limit={5} />
        </Suspense>
      </div>
    </div>
  );
};

export default Dashboard;
