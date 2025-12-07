import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  NUMBER_FORMAT,
  PERCENTAGE_THRESHOLDS,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { Button } from "@ui/Button";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import { PageContainer } from "@ui/PageContainer";
import { SectionCard } from "@ui/SectionCard";
import { showSuccess } from "@utils/toast";
import { useMemo, useState } from "react";
import BudgetModal from "./BudgetModal";

const BudgetManagement = () => {
  const { budgets, transactions, selectedMonth, selectedYear, dispatch } =
    useBudget();
  const { spendingByCategory } = useBudgetCalculations(
    transactions,
    VIEW_PERIODS.MONTHLY,
    selectedMonth,
    selectedYear
  );
  const { formatCurrency } = useCurrencyFormatter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    budgetId: null,
  });

  const handleAdd = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, budgetId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.budgetId) {
      dispatch({
        type: ACTION_TYPES.DELETE_BUDGET,
        payload: deleteDialog.budgetId,
      });
      showSuccess("Budget deleted successfully");
      setDeleteDialog({ open: false, budgetId: null });
    }
  };

  // Get current month budgets
  const currentBudgets = useMemo(() => {
    return budgets.filter(
      (budget) => budget.month === selectedMonth && budget.year === selectedYear
    );
  }, [budgets, selectedMonth, selectedYear]);

  const calculateBudgetStatus = (budget) => {
    const spent = spendingByCategory[budget.category] || 0;
    const remaining = budget.amount - spent;
    const percentage = (spent / budget.amount) * PERCENTAGE_THRESHOLDS.MAX;

    return {
      spent,
      remaining,
      percentage: Math.min(percentage, PERCENTAGE_THRESHOLDS.MAX),
      isOverBudget: spent > budget.amount,
    };
  };

  return (
    <PageContainer>
      <SectionCard
        title={UI_TEXT.BUDGETS}
        buttonText={UI_TEXT.ADD_BUDGET}
        onButtonClick={handleAdd}
        buttonIcon={<i className="ion-plus-round"></i>}
        bgColor="bg-purple-500"
        buttonColor="purple"
      >
        {currentBudgets.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-4 text-center">
            <i className="ion-information-circled mr-2 text-blue-600"></i>
            <span className="text-sm md:text-base text-blue-800">
              {UI_TEXT.NO_BUDGETS}
            </span>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-4">
            {currentBudgets.map((budget) => {
              const status = calculateBudgetStatus(budget);

              return (
                <div
                  key={budget.id}
                  className="border border-gray-200 rounded-lg p-2 md:p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h6 className="text-lg font-semibold text-gray-800">
                        {budget.category}
                      </h6>
                      <p className="text-sm text-gray-600">
                        Budget: {CURRENCY_SYMBOL}
                        {formatCurrency(budget.amount, {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title={UI_TEXT.EDIT || "Edit"}
                      >
                        <i className="ion-edit text-xl"></i>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(budget.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title={UI_TEXT.DELETE}
                      >
                        <i className="ion-close-round text-xl"></i>
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="text-gray-600">
                        {UI_TEXT.SPENT}: {CURRENCY_SYMBOL}
                        {formatCurrency(status.spent, {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </span>
                      <span
                        className={`font-semibold ${
                          status.isOverBudget
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {UI_TEXT.REMAINING}: {CURRENCY_SYMBOL}
                        {formatCurrency(Math.abs(status.remaining), {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-300 ${
                          status.isOverBudget
                            ? "bg-red-500"
                            : status.percentage >= PERCENTAGE_THRESHOLDS.WARNING
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            status.percentage,
                            PERCENTAGE_THRESHOLDS.MAX
                          )}%`,
                        }}
                      >
                        {status.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {status.isOverBudget && (
                    <div className="text-sm text-red-600 font-medium">
                      ⚠️ Over budget by {CURRENCY_SYMBOL}
                      {formatCurrency(Math.abs(status.remaining), {
                        minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Budget Modal for Add/Edit */}
      <BudgetModal
        open={isModalOpen}
        onClose={handleCloseModal}
        budget={editingBudget}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, budgetId: null })}
        onConfirm={confirmDelete}
        title={UI_TEXT.DELETE_BUDGET_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_BUDGET}
        type="warning"
        variant="danger"
        confirmText={UI_TEXT.DELETE}
      />
    </PageContainer>
  );
};

export default BudgetManagement;
