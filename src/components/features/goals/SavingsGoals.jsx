import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  NUMBER_FORMAT,
  PERCENTAGE_THRESHOLDS,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import { EmptyState } from "@ui/EmptyState";
import { FormActions } from "@ui/FormActions";
import { FormContainer } from "@ui/FormContainer";
import { PageContainer } from "@ui/PageContainer";
import { SectionCard } from "@ui/SectionCard";
import { showSuccess } from "@utils/toast";
import { useState } from "react";
import { v4 as uuid } from "uuid";

const SavingsGoals = () => {
  const { savingsGoals, dispatch } = useBudget();
  const { formatCurrency } = useCurrencyFormatter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    goalId: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, targetAmount, currentAmount } = formData;

    if (!name || !targetAmount) {
      return;
    }

    const newGoal = {
      id: uuid(),
      name,
      targetAmount: Number(
        parseFloat(targetAmount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)
      ),
      currentAmount: Number(
        parseFloat(currentAmount || 0).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)
      ),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: ACTION_TYPES.ADD_SAVINGS_GOAL, payload: newGoal });

    setFormData({
      name: "",
      targetAmount: "",
      currentAmount: "",
    });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, goalId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.goalId) {
      dispatch({
        type: ACTION_TYPES.DELETE_SAVINGS_GOAL,
        payload: deleteDialog.goalId,
      });
      showSuccess("Savings goal deleted successfully");
      setDeleteDialog({ open: false, goalId: null });
    }
  };

  const handleUpdateCurrentAmount = (id, newAmount) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_SAVINGS_GOAL,
      payload: {
        id,
        currentAmount: Number(
          parseFloat(newAmount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)
        ),
      },
    });
  };

  const calculateProgress = (current, target) => {
    if (target === 0) return PERCENTAGE_THRESHOLDS.MIN;
    return Math.min(
      (current / target) * PERCENTAGE_THRESHOLDS.MAX,
      PERCENTAGE_THRESHOLDS.MAX
    );
  };

  return (
    <PageContainer>
      <SectionCard
        title={UI_TEXT.SAVINGS_GOALS}
        buttonText={UI_TEXT.ADD_GOAL}
        onButtonClick={() => setShowForm(!showForm)}
        buttonIcon={<i className="ion-plus-round"></i>}
        bgColor="bg-green-500"
        buttonColor="green"
      >
        {showForm && (
          <FormContainer title={UI_TEXT.ADD_NEW_SAVINGS_GOAL_TITLE}>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-4">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="name"
                  placeholder={UI_TEXT.GOAL_NAME}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="targetAmount"
                  placeholder={UI_TEXT.TARGET_AMOUNT}
                  value={formData.targetAmount}
                  onChange={handleChange}
                  required
                  min="0"
                  step={NUMBER_FORMAT.STEP_VALUE}
                />
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  name="currentAmount"
                  placeholder={UI_TEXT.CURRENT_AMOUNT}
                  value={formData.currentAmount}
                  onChange={handleChange}
                  min="0"
                  step={NUMBER_FORMAT.STEP_VALUE}
                />
              </div>
              <FormActions
                onSave={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setFormData({
                    name: "",
                    targetAmount: "",
                    currentAmount: "",
                  });
                }}
                saveColor="green"
              />
            </form>
          </FormContainer>
        )}

        {savingsGoals.length === 0 ? (
          <EmptyState
            message={UI_TEXT.NO_GOALS}
            icon={<i className="ion-information-circled"></i>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            {savingsGoals.map((goal) => {
              const progress = calculateProgress(
                goal.currentAmount,
                goal.targetAmount
              );
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div
                  key={goal.id}
                  className="border border-gray-200 rounded-lg p-2 md:p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="text-lg font-semibold text-gray-800">
                      {goal.name}
                    </h6>
                    <button
                      className="text-red-500 hover:text-red-700 p-1 transition-colors"
                      onClick={() => handleDelete(goal.id)}
                      title={UI_TEXT.DELETE}
                    >
                      <i className="ion-close-round text-xl"></i>
                    </button>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between mb-2 text-sm text-gray-600">
                      <span>
                        {UI_TEXT.CURRENT_AMOUNT}: {CURRENCY_SYMBOL}
                        {formatCurrency(goal.currentAmount, {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </span>
                      <span>
                        {UI_TEXT.TARGET_AMOUNT}: {CURRENCY_SYMBOL}
                        {formatCurrency(goal.targetAmount, {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-300 ${
                          progress >= PERCENTAGE_THRESHOLDS.MAX
                            ? "bg-green-500"
                            : "bg-cyan-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      >
                        {progress.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <small className="text-gray-600">
                      {remaining > 0
                        ? `${
                            UI_TEXT.REMAINING
                          }: ${CURRENCY_SYMBOL}${formatCurrency(remaining, {
                            minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                            maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          })}`
                        : UI_TEXT.GOAL_ACHIEVED}
                    </small>
                    <input
                      type="number"
                      className="w-28 px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder={UI_TEXT.UPDATE_AMOUNT}
                      min="0"
                      step={NUMBER_FORMAT.STEP_VALUE}
                      onBlur={(e) => {
                        if (e.target.value) {
                          handleUpdateCurrentAmount(goal.id, e.target.value);
                          e.target.value = "";
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.target.blur();
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total Savings Summary */}
        {savingsGoals.length > 0 && (
          <div className="mt-2 md:mt-4 p-2 md:p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 text-center">
              <div>
                <h6 className="text-gray-600 mb-1 font-medium">
                  {UI_TEXT.TOTAL_GOALS}
                </h6>
                <h4 className="text-2xl font-bold text-gray-800">
                  {savingsGoals.length}
                </h4>
              </div>
              <div>
                <h6 className="text-gray-600 mb-1 font-medium">
                  {UI_TEXT.TOTAL_TARGET}
                </h6>
                <h4 className="text-2xl font-bold text-gray-800">
                  {CURRENCY_SYMBOL}
                  {formatCurrency(
                    savingsGoals.reduce(
                      (sum, goal) => sum + goal.targetAmount,
                      0
                    ),
                    {
                      minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                      maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                    }
                  )}
                </h4>
              </div>
              <div>
                <h6 className="text-gray-600 mb-1 font-medium">
                  {UI_TEXT.TOTAL_SAVED}
                </h6>
                <h4 className="text-2xl font-bold text-green-600">
                  {CURRENCY_SYMBOL}
                  {formatCurrency(
                    savingsGoals.reduce(
                      (sum, goal) => sum + goal.currentAmount,
                      0
                    ),
                    {
                      minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                      maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                    }
                  )}
                </h4>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, goalId: null })}
        onConfirm={confirmDelete}
        title={UI_TEXT.DELETE_GOAL_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_GOAL}
        type="warning"
        variant="danger"
        confirmText={UI_TEXT.DELETE}
      />
    </PageContainer>
  );
};

export default SavingsGoals;
