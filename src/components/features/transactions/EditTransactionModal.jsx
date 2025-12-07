import {
  ACTION_TYPES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TRANSACTION_MODES,
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
import React, { useMemo, useState } from "react";

const EditTransactionModal = ({ open, onClose, transaction }) => {
  const { dispatch } = useBudget();

  // Derive initial form data from transaction
  const initialFormData = useMemo(() => {
    if (!transaction) {
      return {
        type: "",
        date: "",
        mode: TRANSACTION_MODES.CASH,
        description: "",
        category: "",
        amount: "",
      };
    }
    return {
      type: transaction.type || "",
      date: transaction.date || "",
      mode: transaction.mode || TRANSACTION_MODES.CASH,
      description: transaction.description || "",
      category: transaction.category || "",
      amount: transaction.amount || "",
    };
  }, [transaction]);

  const [formData, setFormData] = useState(initialFormData);

  // Update form data when transaction changes
  React.useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

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
    const { type, date, mode, description, category, amount } = formData;

    if (!type || !date || !description || !category || !amount) {
      return;
    }

    const updatedTransaction = {
      ...transaction,
      type,
      date,
      mode: mode || TRANSACTION_MODES.CASH,
      description: description.trim(),
      category,
      amount: Number(parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
    };

    dispatch({
      type: ACTION_TYPES.UPDATE_TRANSACTION,
      payload: updatedTransaction,
    });

    showSuccess("Transaction updated successfully!");
    onClose();
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

  if (!transaction) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "m-2 sm:m-4",
      }}
    >
      <DialogTitle className="text-lg sm:text-xl font-semibold pb-3">
        {UI_TEXT.EDIT_TRANSACTION || "Edit Transaction"}
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
            <FormField
              label={UI_TEXT.DATE_PLACEHOLDER}
              name="date"
              value={formData.date}
              onChange={handleChange}
              type="date"
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormField
              label="Mode"
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              type="select"
              required
              options={Object.values(TRANSACTION_MODES).map((mode) => ({
                value: mode,
                label: mode,
              }))}
            />
            <FormField
              label={UI_TEXT.CATEGORY_PLACEHOLDER}
              name="category"
              value={formData.category}
              onChange={handleChange}
              type="select"
              required
              disabled={!formData.type}
              options={[
                { value: "", label: UI_TEXT.CHOOSE },
                ...getCategoryOptions().map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
            <FormField
              label={UI_TEXT.DESCRIPTION_PLACEHOLDER}
              name="description"
              value={formData.description}
              onChange={handleChange}
              type="text"
              required
              fullWidth
            />
            <FormField
              label={UI_TEXT.AMOUNT_PLACEHOLDER}
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              type="number"
              required
              inputProps={{ min: "0", step: NUMBER_FORMAT.STEP_VALUE }}
            />
          </FormFieldGroup>
        </DialogContent>
        <DialogActions className="px-4 sm:px-6 pb-4 sm:pb-6 gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            size="md"
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation"
          >
            {UI_TEXT.CANCEL}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation"
          >
            {UI_TEXT.SAVE || "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditTransactionModal;
