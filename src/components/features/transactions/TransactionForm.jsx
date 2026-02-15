import {
  ACTION_TYPES,
  DIALOG_CONFIG,
  NUMBER_FORMAT,
  TRANSACTION_MODES,
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
import { hasDuplicate } from "@utils/duplicateDetection";
import { showError, showSuccess } from "@utils/toast";
import { useState } from "react";
import { v4 as uuid } from "uuid";

const getInitialFormData = () => ({
  type: "",
  date: todayStorage(),
  mode: TRANSACTION_MODES.CASH,
  description: "",
  category: "",
  amount: "",
});

const AddTransactionModal = ({ open, onClose }) => {
  const { dispatch, transactions } = useBudget();
  const { getByType } = useCategories();
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
      setError(UI_TEXT.PLEASE_FILL_ALL_FIELDS);
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
      createdAt: nowISO(),
    };

    if (hasDuplicate(newTransaction, transactions)) {
      setError(UI_TEXT.DUPLICATE_TRANSACTION);
      showError(UI_TEXT.DUPLICATE_TRANSACTION);
      return;
    }

    dispatch({ type: ACTION_TYPES.ADD_TRANSACTION, payload: newTransaction });

    setFormData(getInitialFormData());
    setError("");
    showSuccess(UI_TEXT.SUCCESS_TRANSACTION_ADDED);
    handleClose();
  };

  const getCategoryOptions = () => getByType(formData.type) || [];

  const formId = "add-transaction-form";

  return (
    <Dialog
      key={open ? "open" : "closed"}
      open={open}
      onClose={handleClose}
      title={UI_TEXT.ADD_TRANSACTION}
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
            {UI_TEXT.ADD_TRANSACTION}
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
          <DatePicker
            label={UI_TEXT.DATE_PLACEHOLDER}
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
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
      </form>
    </Dialog>
  );
};

export default AddTransactionModal;
