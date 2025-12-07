import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  NUMBER_FORMAT,
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { Button } from "@ui/Button";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import { EmptyState } from "@ui/EmptyState";
import { PageContainer } from "@ui/PageContainer";
import { SectionCard } from "@ui/SectionCard";
import { showSuccess } from "@utils/toast";
import { useState } from "react";
import RecurringTransactionModal from "./RecurringTransactionModal";

const RecurringTransactions = () => {
  const { recurringTransactions, dispatch } = useBudget();
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    transactionId: null,
  });

  const handleAdd = () => {
    setEditingRecurring(null);
    setIsModalOpen(true);
  };

  const handleEdit = (recurring) => {
    setEditingRecurring(recurring);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecurring(null);
  };

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, transactionId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.transactionId) {
      dispatch({
        type: ACTION_TYPES.DELETE_RECURRING_TRANSACTION,
        payload: deleteDialog.transactionId,
      });
      showSuccess("Recurring transaction deleted successfully");
      setDeleteDialog({ open: false, transactionId: null });
    }
  };

  const toggleActive = (id, isActive) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_RECURRING_TRANSACTION,
      payload: { id, isActive: !isActive },
    });
    showSuccess(
      `Recurring transaction ${
        !isActive ? "activated" : "paused"
      } successfully!`
    );
  };

  const getNextOccurrence = (recurring) => {
    const startDate = new Date(recurring.startDate);
    const now = new Date();
    let nextDate = new Date(startDate);

    while (nextDate <= now) {
      const newDate = new Date(nextDate);
      switch (recurring.recurrence) {
        case RECURRENCE_TYPES.DAILY:
          newDate.setDate(newDate.getDate() + 1);
          break;
        case RECURRENCE_TYPES.WEEKLY:
          newDate.setDate(newDate.getDate() + 7);
          break;
        case RECURRENCE_TYPES.MONTHLY:
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case RECURRENCE_TYPES.YEARLY:
          newDate.setFullYear(newDate.getFullYear() + 1);
          break;
        default:
          return null;
      }
      nextDate = newDate;
    }

    if (recurring.endDate && nextDate > new Date(recurring.endDate)) {
      return null;
    }

    return nextDate;
  };

  return (
    <PageContainer>
      <SectionCard
        title={UI_TEXT.RECURRING_TRANSACTIONS}
        buttonText={UI_TEXT.ADD_RECURRING}
        onButtonClick={handleAdd}
        buttonIcon={<i className="ion-plus-round"></i>}
        bgColor="bg-indigo-500"
        buttonColor="indigo"
      >
        {recurringTransactions.length === 0 ? (
          <EmptyState
            message={UI_TEXT.NO_RECURRING_TRANSACTIONS}
            icon={<i className="ion-information-circled"></i>}
          />
        ) : (
          <div className="space-y-2 md:space-y-4">
            {recurringTransactions.map((recurring) => {
              const nextOccurrence = getNextOccurrence(recurring);

              return (
                <div
                  key={recurring.id}
                  className={`border rounded-lg p-2 md:p-4 ${
                    recurring.isActive
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h6 className="text-base md:text-lg font-semibold text-gray-800 truncate">
                          {recurring.description}
                        </h6>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            recurring.type === TRANSACTION_TYPES.INCOME
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {recurring.type === TRANSACTION_TYPES.INCOME
                            ? "+"
                            : "-"}
                          {CURRENCY_SYMBOL}
                          {formatCurrency(recurring.amount, {
                            minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                            maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Category:</span>{" "}
                          {recurring.category}
                        </div>
                        <div>
                          <span className="font-medium">Recurrence:</span>{" "}
                          {RECURRENCE_LABELS[recurring.recurrence]}
                        </div>
                        {nextOccurrence && (
                          <div>
                            <span className="font-medium">
                              Next Occurrence:
                            </span>{" "}
                            {formatDate(
                              nextOccurrence.toISOString().split("T")[0],
                              "short"
                            )}
                          </div>
                        )}
                        {recurring.endDate && (
                          <div>
                            <span className="font-medium">Ends:</span>{" "}
                            {formatDate(recurring.endDate, "short")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(recurring)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title={UI_TEXT.EDIT || "Edit"}
                      >
                        <i className="ion-edit text-xl"></i>
                      </Button>
                      <button
                        className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                          recurring.isActive
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                        onClick={() =>
                          toggleActive(recurring.id, recurring.isActive)
                        }
                      >
                        {recurring.isActive ? UI_TEXT.PAUSE : UI_TEXT.ACTIVATE}
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                        onClick={() => handleDelete(recurring.id)}
                        title={UI_TEXT.DELETE}
                      >
                        <i className="ion-close-round text-lg md:text-xl"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Recurring Transaction Modal for Add/Edit */}
      <RecurringTransactionModal
        open={isModalOpen}
        onClose={handleCloseModal}
        recurring={editingRecurring}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, transactionId: null })}
        onConfirm={confirmDelete}
        title={UI_TEXT.DELETE_RECURRING_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_RECURRING}
        type="warning"
        variant="danger"
        confirmText={UI_TEXT.DELETE}
      />
    </PageContainer>
  );
};

export default RecurringTransactions;
