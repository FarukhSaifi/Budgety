import {
  ACTION_TYPES,
  DIALOG_CONFIG,
  NUMBER_FORMAT,
  RECURRENCE_LABELS,
  RECURRENCE_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCategories } from "@hooks/useCategories";
import { Button } from "@ui/Button";
import { DatePicker } from "@ui/DatePicker";
import { Dialog } from "@ui/Dialog";
import { FormField, FormFieldGroup } from "@ui/FormField";
import { SearchableCategorySelect } from "@ui/SearchableCategorySelect";
import { nowISO, todayStorage } from "@utils/dateUtils";
import { showSuccess } from "@utils/toast";
import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

const getInitialFormData = () => ({
  type: "",
  description: "",
  category: "",
  amount: "",
  recurrence: RECURRENCE_TYPES.MONTHLY,
  startDate: todayStorage(),
  endDate: "",
});

const RecurringTransactionModal = ({ open, onClose, recurring = null }) => {
  const { dispatch } = useBudget();
  const { getByType } = useCategories();
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
        startDate: recurring.startDate || todayStorage(),
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
        newFormData.startDate = recurring.startDate || todayStorage();
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

  const getCategoryOptions = () => getByType(formData.type) || [];

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
      parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES),
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

      showSuccess(UI_TEXT.SUCCESS_RECURRING_UPDATED);
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
        createdAt: nowISO(),
      };

      dispatch({
        type: ACTION_TYPES.ADD_RECURRING_TRANSACTION,
        payload: newRecurring,
      });
      showSuccess(UI_TEXT.SUCCESS_RECURRING_ADDED);
    }

    onClose();
  };

  const handleClose = () => {
    setFormData(getInitialFormData());
    setError("");
    onClose();
  };

  const formId = "recurring-transaction-form";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={
        isEditMode
          ? `${UI_TEXT.EDIT} ${UI_TEXT.RECURRING_TRANSACTIONS}`
          : UI_TEXT.ADD_RECURRING_TRANSACTION_TITLE
      }
      maxWidth="md"
      actions={
        <>
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
            form={formId}
            variant="primary"
            size="md"
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation"
          >
            {UI_TEXT.SAVE || "Save"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <FormFieldGroup
          columns={2}
          spacing={3}
          className={DIALOG_CONFIG.FORM_GROUP_CLASS}
        >
          <FormField
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            type="select"
            required
            options={[
              { value: "", label: UI_TEXT.CHOOSE },
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
          <SearchableCategorySelect
            label={UI_TEXT.CATEGORY_PLACEHOLDER}
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            disabled={!formData.type}
            options={getCategoryOptions().map((category) => ({
              value: category,
              label: category,
            }))}
            placeholder={UI_TEXT.SEARCH_OR_SELECT_CATEGORY}
            allowAddNew
            categoryType={formData.type}
            onAddCategory={(name, type) =>
              dispatch({
                type: ACTION_TYPES.ADD_CATEGORY,
                payload: { name, type },
              })
            }
          />
          <FormField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            type="text"
            required
            fullWidth
            placeholder={UI_TEXT.DESCRIPTION_PLACEHOLDER}
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
          <DatePicker
            label={UI_TEXT.START_DATE}
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
          <DatePicker
            label={UI_TEXT.END_DATE_OPTIONAL}
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
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
      </form>
    </Dialog>
  );
};

export default RecurringTransactionModal;
