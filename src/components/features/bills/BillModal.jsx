import {
  ACTION_TYPES,
  DATE_CONSTANTS,
  NUMBER_FORMAT,
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  SORTED_EXPENSE_CATEGORIES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Button } from "@ui/Button";
import { FormField, FormFieldGroup } from "@ui/FormField";
import { SearchableCategorySelect } from "@ui/SearchableCategorySelect";
import { showSuccess } from "@utils/toast";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

const getInitialFormData = () => ({
  name: "",
  category: "",
  amount: "",
  dueDate: "",
  reminderDays: String(DATE_CONSTANTS.DEFAULT_REMINDER_DAYS),
  isRecurring: false,
  recurrence: "monthly",
});

const BillModal = ({ open, onClose, bill = null }) => {
  const { dispatch } = useBudget();
  const prevOpenRef = useRef(false);
  const prevBillIdRef = useRef(null);

  // Compute initial form data using useMemo
  const initialFormData = useMemo(() => {
    if (bill) {
      return {
        name: bill.name || "",
        category: bill.category || "",
        amount:
          bill.amount !== undefined && bill.amount !== null
            ? String(bill.amount)
            : "",
        dueDate: bill.dueDate || "",
        reminderDays: bill.reminderDays
          ? String(bill.reminderDays)
          : String(DATE_CONSTANTS.DEFAULT_REMINDER_DAYS),
        isRecurring: bill.isRecurring || false,
        recurrence: bill.recurrence || "monthly",
      };
    }
    return getInitialFormData();
  }, [bill]);

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  const isEditMode = !!bill;

  // Reset form data when modal opens or bill changes, using refs to avoid cascading renders
  useEffect(() => {
    const isOpening = open && !prevOpenRef.current;
    const billChanged = bill?.id !== prevBillIdRef.current;

    if (isOpening || (open && billChanged)) {
      const newFormData = getInitialFormData();
      if (bill) {
        newFormData.name = bill.name || "";
        newFormData.category = bill.category || "";
        newFormData.amount =
          bill.amount !== undefined && bill.amount !== null
            ? String(bill.amount)
            : "";
        newFormData.dueDate = bill.dueDate || "";
        newFormData.reminderDays = bill.reminderDays
          ? String(bill.reminderDays)
          : String(DATE_CONSTANTS.DEFAULT_REMINDER_DAYS);
        newFormData.isRecurring = bill.isRecurring || false;
        newFormData.recurrence = bill.recurrence || "monthly";
      }
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        setFormData(newFormData);
        setError("");
      }, 0);
    }

    prevOpenRef.current = open;
    prevBillIdRef.current = bill?.id ?? null;
  }, [open, bill]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value === "" ? "" : value,
      }));
      // Clear error when user starts typing
      if (error) setError("");
    },
    [error]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const {
      name,
      category,
      amount,
      dueDate,
      reminderDays,
      isRecurring,
      recurrence,
    } = formData;

    if (!name || !category || !amount || amount === "" || !dueDate) {
      setError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }

    const amountValue = Number(
      parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)
    );

    if (isNaN(amountValue) || amountValue <= 0) {
      setError(UI_TEXT.BILL_AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    if (isEditMode) {
      // Update existing bill
      const updatedBill = {
        ...bill,
        name,
        category,
        amount: amountValue,
        dueDate,
        reminderDays: parseInt(reminderDays, 10),
        isRecurring,
        recurrence: isRecurring ? recurrence : null,
      };

      dispatch({
        type: ACTION_TYPES.UPDATE_BILL_REMINDER,
        payload: updatedBill,
      });

      showSuccess("Bill reminder updated successfully!");
    } else {
      // Create new bill
      const newBill = {
        id: uuid(),
        name,
        category,
        amount: amountValue,
        dueDate,
        reminderDays: parseInt(reminderDays, 10),
        isRecurring,
        recurrence: isRecurring ? recurrence : null,
        isPaid: false,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: ACTION_TYPES.ADD_BILL_REMINDER, payload: newBill });
      showSuccess("Bill reminder added successfully!");
    }

    onClose();
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "m-2 sm:m-4",
      }}
    >
      <DialogTitle className="text-lg sm:text-xl font-semibold pb-3">
        {isEditMode
          ? `${UI_TEXT.EDIT} ${UI_TEXT.BILL_REMINDERS}`
          : UI_TEXT.ADD_BILL_REMINDER_TITLE}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="px-4 sm:px-6">
          <FormFieldGroup columns={2} spacing={3} className="mb-4">
            <FormField
              label={UI_TEXT.BILL_NAME}
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              required
              placeholder="e.g., Electricity Bill"
            />
            <SearchableCategorySelect
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              options={SORTED_EXPENSE_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              }))}
              placeholder="Search or select category..."
            />
            <FormField
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount || ""}
              onChange={handleChange}
              required
              inputProps={{
                min: "0",
                step: NUMBER_FORMAT.STEP_VALUE,
              }}
            />
            <FormField
              label={UI_TEXT.DUE_DATE}
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormField
              label={UI_TEXT.REMIND_ME_DAYS_BEFORE}
              name="reminderDays"
              type="number"
              value={formData.reminderDays || ""}
              onChange={handleChange}
              inputProps={{
                min: "0",
                max: DATE_CONSTANTS.MAX_REMINDER_DAYS,
              }}
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
              />
              <label className="ml-2 block text-sm text-gray-700">
                {UI_TEXT.RECURRING_BILL}
              </label>
            </div>
            {formData.isRecurring && (
              <FormField
                label="Recurrence"
                name="recurrence"
                value={formData.recurrence}
                onChange={handleChange}
                type="select"
                options={[
                  {
                    value: RECURRENCE_TYPES.MONTHLY,
                    label: RECURRENCE_LABELS[RECURRENCE_TYPES.MONTHLY],
                  },
                  {
                    value: RECURRENCE_TYPES.YEARLY,
                    label: RECURRENCE_LABELS[RECURRENCE_TYPES.YEARLY],
                  },
                ]}
              />
            )}
          </FormFieldGroup>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex items-center">
                <i className="ion-alert-circled text-red-600 text-lg mr-2"></i>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-4 sm:px-6 pb-4 sm:pb-6 gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            size="md"
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation"
          >
            {UI_TEXT.CANCEL}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation bg-orange-600 hover:bg-orange-700"
          >
            {UI_TEXT.SAVE || "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BillModal;
