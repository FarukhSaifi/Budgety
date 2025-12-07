import {
  ACTION_TYPES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  SORTED_EXPENSE_CATEGORIES,
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
import { SearchableCategorySelect } from "@ui/SearchableCategorySelect";
import { hasDuplicate } from "@utils/duplicateDetection";
import { showError, showSuccess } from "@utils/toast";
import { useState } from "react";
import { v4 as uuid } from "uuid";

const getInitialFormData = () => ({
  type: "",
  date: new Date().toISOString().split("T")[0],
  mode: TRANSACTION_MODES.CASH,
  description: "",
  category: "",
  amount: "",
});

const AddTransactionModal = ({ open, onClose }) => {
  const { dispatch, transactions } = useBudget();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(getInitialFormData());

  // Reset form when modal closes
  const handleClose = () => {
    setFormData(getInitialFormData());
    setError("");
    onClose();
  };

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
    setError("");
    const { type, date, mode, description, category, amount } = formData;

    if (!type || !date || !description || !category || !amount) {
      setError("Please fill in all required fields.");
      return;
    }

    const newTransaction = {
      id: uuid(),
      type,
      date,
      mode: mode || TRANSACTION_MODES.CASH,
      description: description.trim(),
      category,
      amount: Number(parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
      createdAt: new Date().toISOString(),
    };

    // Check for duplicates
    if (hasDuplicate(newTransaction, transactions)) {
      const errorMsg =
        "This transaction already exists. A duplicate transaction with the same date, description, amount, and type was found.";
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    dispatch({ type: ACTION_TYPES.ADD_TRANSACTION, payload: newTransaction });

    setFormData(getInitialFormData());
    setError("");
    showSuccess("Transaction added successfully!");
    handleClose();
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

  return (
    <Dialog
      key={open ? "open" : "closed"}
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: "m-2 sm:m-4",
      }}
    >
      <DialogTitle className="text-lg sm:text-xl font-semibold pb-3">
        {UI_TEXT.ADD_TRANSACTION}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="px-4 sm:px-6">
          <FormFieldGroup columns={2} spacing={3} className="mb-4">
            <FormField
              label={UI_TEXT.TYPE_LABEL}
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
              label={UI_TEXT.MODE_LABEL}
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
              placeholder="Search or select category..."
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
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation"
          >
            {UI_TEXT.ADD_TRANSACTION}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddTransactionModal;
