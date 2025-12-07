import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  DATE_CONSTANTS,
  DISPLAY_LIMITS,
  NUMBER_FORMAT,
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
import { useCallback, useMemo, useState } from "react";
import BillModal from "./BillModal";

const BillReminders = () => {
  const { billReminders, dispatch } = useBudget();
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    billId: null,
  });

  const handleAdd = () => {
    setEditingBill(null);
    setIsModalOpen(true);
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBill(null);
  };

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, billId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.billId) {
      dispatch({
        type: ACTION_TYPES.DELETE_BILL_REMINDER,
        payload: deleteDialog.billId,
      });
      showSuccess("Bill reminder deleted successfully");
      setDeleteDialog({ open: false, billId: null });
    }
  };

  const handleMarkPaid = (id) => {
    dispatch({ type: ACTION_TYPES.MARK_BILL_PAID, payload: id });
    showSuccess("Bill marked as paid!");
  };

  const getDaysUntilDue = useCallback((dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / DATE_CONSTANTS.MILLISECONDS_PER_DAY);
    return diffDays;
  }, []);

  const getUpcomingBills = useMemo(() => {
    return billReminders
      .filter((bill) => !bill.isPaid)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, DISPLAY_LIMITS.UPCOMING_BILLS);
  }, [billReminders]);

  const getOverdueBills = useMemo(() => {
    return billReminders.filter((bill) => {
      if (bill.isPaid) return false;
      const daysUntilDue = getDaysUntilDue(bill.dueDate);
      return daysUntilDue < 0;
    });
  }, [billReminders, getDaysUntilDue]);

  return (
    <PageContainer>
      <SectionCard
        title={UI_TEXT.BILL_REMINDERS}
        buttonText={UI_TEXT.ADD_BILL}
        onButtonClick={handleAdd}
        buttonIcon={<i className="ion-plus-round"></i>}
        bgColor="bg-orange-500"
        buttonColor="orange"
      >
        {getOverdueBills.length > 0 && (
          <div className="mb-2 md:mb-4 p-2 md:p-4 bg-red-50 border border-red-200 rounded-lg">
            <h6 className="text-base md:text-lg font-semibold text-red-800 mb-2">
              {UI_TEXT.OVERDUE_BILLS} ({getOverdueBills.length})
            </h6>
            <div className="space-y-2">
              {getOverdueBills.map((bill) => {
                const daysOverdue = Math.abs(getDaysUntilDue(bill.dueDate));
                return (
                  <div
                    key={bill.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 md:p-3 bg-white rounded border border-red-300"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm md:text-base text-gray-800 truncate">
                        {bill.name}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        Due: {formatDate(bill.dueDate, "short")} ({daysOverdue}{" "}
                        days overdue)
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm md:text-base text-red-600 whitespace-nowrap">
                        {CURRENCY_SYMBOL}
                        {formatCurrency(bill.amount, {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bill)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title={UI_TEXT.EDIT || "Edit"}
                      >
                        <i className="ion-edit text-xl"></i>
                      </Button>
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium py-1.5 md:py-2 px-2 md:px-3 rounded transition-colors whitespace-nowrap"
                      >
                        {UI_TEXT.MARK_AS_PAID}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {getUpcomingBills.length > 0 && (
          <div className="mb-2 md:mb-4">
            <h6 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
              {UI_TEXT.UPCOMING_BILLS}
            </h6>
            <div className="space-y-2">
              {getUpcomingBills.map((bill) => {
                const daysUntilDue = getDaysUntilDue(bill.dueDate);
                const isDueSoon =
                  daysUntilDue <=
                  parseInt(
                    bill.reminderDays || DATE_CONSTANTS.DEFAULT_REMINDER_DAYS
                  );

                return (
                  <div
                    key={bill.id}
                    className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 md:p-4 rounded-lg border ${
                      isDueSoon
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h6 className="font-semibold text-sm md:text-base text-gray-800 truncate">
                          {bill.name}
                        </h6>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                          {bill.category}
                        </span>
                        {bill.isRecurring && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded whitespace-nowrap">
                            Recurring
                          </span>
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        Due: {formatDate(bill.dueDate, "short")} ({daysUntilDue}{" "}
                        days)
                        {isDueSoon && (
                          <span className="ml-2 text-yellow-600 font-medium">
                            {UI_TEXT.DUE_SOON}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-sm md:text-base text-gray-800 whitespace-nowrap">
                        {CURRENCY_SYMBOL}
                        {formatCurrency(bill.amount, {
                          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(bill)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title={UI_TEXT.EDIT || "Edit"}
                      >
                        <i className="ion-edit text-xl"></i>
                      </Button>
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm font-medium py-1.5 md:py-2 px-2 md:px-4 rounded transition-colors whitespace-nowrap"
                      >
                        {UI_TEXT.MARK_AS_PAID}
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                        title={UI_TEXT.DELETE}
                      >
                        <i className="ion-close-round text-lg md:text-xl"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {billReminders.length === 0 && (
          <EmptyState
            message={UI_TEXT.NO_BILL_REMINDERS}
            icon={<i className="ion-information-circled"></i>}
          />
        )}
      </SectionCard>

      {/* Bill Modal for Add/Edit */}
      <BillModal
        open={isModalOpen}
        onClose={handleCloseModal}
        bill={editingBill}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, billId: null })}
        onConfirm={confirmDelete}
        title={UI_TEXT.DELETE_BILL_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_BILL}
        type="warning"
        variant="danger"
        confirmText={UI_TEXT.DELETE}
      />
    </PageContainer>
  );
};

export default BillReminders;
