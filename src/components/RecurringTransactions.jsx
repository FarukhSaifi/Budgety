import { showSuccess } from "@utils/toast";
import { useState } from "react";
import { v4 as uuid } from "uuid";
import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  UI_TEXT,
} from "../constants";
import { useBudget } from "../context/BudgetContext";
import { useCurrencyFormatter } from "../hooks/useCurrencyFormatter";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { EmptyState } from "./ui/EmptyState";
import { FormActions } from "./ui/FormActions";
import { FormContainer } from "./ui/FormContainer";
import { PageContainer } from "./ui/PageContainer";
import { SectionCard } from "./ui/SectionCard";

const RecurringTransactions = () => {
  const { recurringTransactions, dispatch } = useBudget();
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    category: "",
    amount: "",
    recurrence: RECURRENCE_TYPES.MONTHLY,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    transactionId: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type" && { category: "" }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const {
      type,
      description,
      category,
      amount,
      recurrence,
      startDate,
      endDate,
    } = formData;

    if (
      !type ||
      !description ||
      !category ||
      !amount ||
      !recurrence ||
      !startDate
    ) {
      return;
    }

    const newRecurring = {
      id: uuid(),
      type,
      description,
      category,
      amount: Number(parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
      recurrence,
      startDate,
      endDate: endDate || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    dispatch({
      type: ACTION_TYPES.ADD_RECURRING_TRANSACTION,
      payload: newRecurring,
    });

    setFormData({
      type: "",
      description: "",
      category: "",
      amount: "",
      recurrence: RECURRENCE_TYPES.MONTHLY,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setShowForm(false);
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

  const getCategoryOptions = () => {
    if (formData.type === TRANSACTION_TYPES.INCOME) {
      return Object.values(INCOME_CATEGORIES);
    }
    if (formData.type === TRANSACTION_TYPES.EXPENSE) {
      return Object.values(EXPENSE_CATEGORIES);
    }
    return [];
  };

  return (
    <PageContainer>
      <SectionCard
        title={UI_TEXT.RECURRING_TRANSACTIONS}
        buttonText={UI_TEXT.ADD_RECURRING}
        onButtonClick={() => setShowForm(!showForm)}
        buttonIcon={<i className="ion-plus-round"></i>}
        bgColor="bg-indigo-500"
        buttonColor="indigo"
      >
        {showForm && (
          <FormContainer title={UI_TEXT.ADD_RECURRING_TRANSACTION_TITLE}>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mb-2 md:mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Choose</option>
                    <option value={TRANSACTION_TYPES.INCOME}>
                      {TRANSACTION_TYPE_LABELS[TRANSACTION_TYPES.INCOME]}
                    </option>
                    <option value={TRANSACTION_TYPES.EXPENSE}>
                      {TRANSACTION_TYPE_LABELS[TRANSACTION_TYPES.EXPENSE]}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={!formData.type}
                  >
                    <option value="">Choose</option>
                    {getCategoryOptions().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    name="amount"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step={NUMBER_FORMAT.STEP_VALUE}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    name="recurrence"
                    value={formData.recurrence}
                    onChange={handleChange}
                    required
                  >
                    {Object.values(RECURRENCE_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {RECURRENCE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <FormActions
                onSave={handleSubmit}
                onCancel={() => setShowForm(false)}
                saveColor="indigo"
              />
            </form>
          </FormContainer>
        )}

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
