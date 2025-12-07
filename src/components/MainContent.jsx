import { VIEW_TYPES } from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useTab } from "@context/TabContext";
import { lazy, Suspense } from "react";

// Lazy load components for code splitting - organized by features
const Dashboard = lazy(() => import("./features/dashboard/Dashboard"));
const Budget = lazy(() => import("./features/transactions/Budget"));
const BudgetManagement = lazy(() =>
  import("./features/budgets/BudgetManagement")
);
const BankStatementImport = lazy(() =>
  import("./features/transactions/BankStatementImport")
);
const CalendarView = lazy(() => import("./features/transactions/CalendarView"));
const PaymentsCalendarView = lazy(() =>
  import("./features/bills/PaymentsCalendarView")
);
const RecurringTransactions = lazy(() =>
  import("./features/bills/RecurringTransactions")
);
const BillReminders = lazy(() => import("./features/bills/BillReminders"));
const ReportsAnalysis = lazy(() =>
  import("./features/reports/ReportsAnalysis")
);
const SavingsGoals = lazy(() => import("./features/goals/SavingsGoals"));
const ViewControls = lazy(() => import("./features/transactions/ViewControls"));

// Loading fallback component - declared outside to avoid recreation during render
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
      <p className="text-gray-600 text-sm">Loading...</p>
    </div>
  </div>
);

const MainContent = () => {
  const { viewType } = useBudget();
  const { activeTab } = useTab();

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
      case "transactions":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ViewControls />
            <BankStatementImport />
            {viewType === VIEW_TYPES.CALENDAR ? <CalendarView /> : <Budget />}
          </Suspense>
        );
      case "budgets":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ViewControls />
            <BudgetManagement />
          </Suspense>
        );
      case "bills":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ViewControls />
            <PaymentsCalendarView />
            <RecurringTransactions />
            <BillReminders />
          </Suspense>
        );
      case "reports":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ViewControls />
            <ReportsAnalysis />
          </Suspense>
        );
      case "goals":
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SavingsGoals />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        );
    }
  };

  return <div>{renderContent()}</div>;
};

export default MainContent;
