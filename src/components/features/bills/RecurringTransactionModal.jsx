import {
  ACTION_TYPES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  SORTED_EXPENSE_CATEGORIES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
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
import { showSuccess } from "@utils/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

const getInitialFormData = () => ({
  type: "",
  description: "",
  category: "",
  amount: "",
  recurrence: RECURRENCE_TYPES.MONTHLY,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
});

const RecurringTransactionModal = ({ open, onClose, recurring = null }) => {
  const { dispatch } = useBudget();
  const prevOpenRef = useRef(false);
  const prevRecurringIdRef = useRef(null);

  // Compute initial form data using useMemo
  const initialFormData = useMemo(() => {
    if (recurring) {
      return {
        type: recurring.type || "",
        description: recurring.description || "",
        category: recurring.category || "",
        amount:
          recurring.amount !== undefined && recurring.amount !== null
            ? String(recurring.amount)
            : "",
        recurrence: recurring.recurrence || RECURRENCE_TYPES.MONTHLY,
        startDate:
          recurring.startDate || new Date().toISOString().split("T")[0],
        endDate: recurring.endDate || "",
      };
    }
    return getInitialFormData();
  }, [recurring]);

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  const isEditMode = !!recurring;

  // Reset form data when modal opens or recurring changes, using refs to avoid cascading renders
  useEffect(() => {
    const isOpening = open && !prevOpenRef.current;
    const recurringChanged = recurring?.id !== prevRecurringIdRef.current;

    if (isOpening || (open && recurringChanged)) {
      const newFormData = getInitialFormData();
      if (recurring) {
        newFormData.type = recurring.type || "";
        newFormData.description = recurring.description || "";
        newFormData.category = recurring.category || "";
        newFormData.amount =
          recurring.amount !== undefined && recurring.amount !== null
            ? String(recurring.amount)
            : "";
        newFormData.recurrence =
          recurring.recurrence || RECURRENCE_TYPES.MONTHLY;
        newFormData.startDate =
          recurring.startDate || new Date().toISOString().split("T")[0];
        newFormData.endDate = recurring.endDate || "";
      }
      // Use setTimeout to avoid cascading renders
      setTimeout(() => {
        setFormData(newFormData);
        setError("");
      }, 0);
    }

    prevOpenRef.current = open;
    prevRecurringIdRef.current = recurring?.id ?? null;
  }, [open, recurring, initialFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : value,
      ...(name === "type" && { category: "" }),
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const getCategoryOptions = () => {
    if (formData.type === TRANSACTION_TYPES.INCOME) {
      return Object.values(INCOME_CATEGORIES);
    }
    if (formData.type === TRANSACTION_TYPES.EXPENSE) {
      return SORTED_EXPENSE_CATEGORIES;
    }
    return [];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

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
      amount === "" ||
      !recurrence ||
      !startDate
    ) {
      setError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
      return;
    }

    const amountValue = Number(
      parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)
    );

    if (isNaN(amountValue) || amountValue <= 0) {
      setError(UI_TEXT.AMOUNT_MUST_BE_GREATER_THAN_ZERO);
      return;
    }

    if (isEditMode) {
      // Update existing recurring transaction
      const updatedRecurring = {
        ...recurring,
        type,
        description: description.trim(),
        category,
        amount: amountValue,
        recurrence,
        startDate,
        endDate: endDate || null,
      };

      dispatch({
        type: ACTION_TYPES.UPDATE_RECURRING_TRANSACTION,
        payload: updatedRecurring,
      });

      showSuccess("Recurring transaction updated successfully!");
    } else {
      // Create new recurring transaction
      const newRecurring = {
        id: uuid(),
        type,
        description: description.trim(),
        category,
        amount: amountValue,
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
      showSuccess("Recurring transaction added successfully!");
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
          ? `${UI_TEXT.EDIT} ${UI_TEXT.RECURRING_TRANSACTIONS}`
          : UI_TEXT.ADD_RECURRING_TRANSACTION_TITLE}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="px-4 sm:px-6">
          <FormFieldGroup columns={2} spacing={3} className="mb-4">
            <FormField
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              type="select"
              required
              options={[
                { value: "", label: UI_TEXT.CHOOSE || "Choose..." },
                {
                  value: TRANSACTION_TYPES.INCOME,
                  label: TRANSACTION_TYPE_LABELS[TRANSACTION_TYPES.INCOME],
                },
                {
                  value: TRANSACTION_TYPES.EXPENSE,
                  label: TRANSACTION_TYPE_LABELS[TRANSACTION_TYPES.EXPENSE],
                },
              ]}
            />
            <FormField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              type="select"
              required
              disabled={!formData.type}
              options={[
                { value: "", label: UI_TEXT.CHOOSE || "Choose..." },
                ...getCategoryOptions().map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
            <FormField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              type="text"
              required
              fullWidth
              placeholder="Description"
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
              label="Recurrence"
              name="recurrence"
              value={formData.recurrence}
              onChange={handleChange}
              type="select"
              required
              options={Object.values(RECURRENCE_TYPES).map((type) => ({
                value: type,
                label: RECURRENCE_LABELS[type],
              }))}
            />
            <FormField
              label={UI_TEXT.START_DATE}
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormField
              label={UI_TEXT.END_DATE_OPTIONAL}
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
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
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation bg-indigo-600 hover:bg-indigo-700"
          >
            {UI_TEXT.SAVE || "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RecurringTransactionModal;
