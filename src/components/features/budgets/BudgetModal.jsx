import {
  ACTION_TYPES,
  NUMBER_FORMAT,
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
import { showSuccess } from "@utils/toast";
import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

const getInitialFormData = (selectedMonth, selectedYear, budget = null) => {
  if (budget) {
    return {
      category: budget.category || "",
      amount:
        budget.amount !== undefined && budget.amount !== null
          ? String(budget.amount)
          : "",
      month: budget.month ? String(budget.month) : String(selectedMonth || ""),
      year: budget.year ? String(budget.year) : String(selectedYear || ""),
    };
  }
  return {
    category: "",
    amount: "",
    month: selectedMonth ? String(selectedMonth) : "",
    year: selectedYear ? String(selectedYear) : "",
  };
};

const BudgetModal = ({ open, onClose, budget = null }) => {
  const { dispatch, selectedMonth, selectedYear } = useBudget();

  // Compute initial form data using useMemo - this will reset when budget or selectedMonth/Year changes
  const initialFormData = useMemo(
    () => getInitialFormData(selectedMonth, selectedYear, budget),
    [selectedMonth, selectedYear, budget]
  );

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  const isEditMode = !!budget;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? "" : value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const { category, amount, month, year } = formData;

    if (
      !category ||
      !amount ||
      amount === "" ||
      !month ||
      month === "" ||
      !year ||
      year === ""
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const amountValue = Number(
      parseFloat(amount).toFixed(NUMBER_FORMAT.DECIMAL_PLACES)
    );
    const monthValue = parseInt(month, 10);
    const yearValue = parseInt(year, 10);

    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Budget amount must be greater than 0.");
      return;
    }

    if (
      isNaN(monthValue) ||
      monthValue < NUMBER_FORMAT.MIN_MONTH ||
      monthValue > NUMBER_FORMAT.MAX_MONTH
    ) {
      setError(
        `Month must be between ${NUMBER_FORMAT.MIN_MONTH} and ${NUMBER_FORMAT.MAX_MONTH}.`
      );
      return;
    }

    if (
      isNaN(yearValue) ||
      yearValue < NUMBER_FORMAT.MIN_YEAR ||
      yearValue > NUMBER_FORMAT.MAX_YEAR
    ) {
      setError(
        `Year must be between ${NUMBER_FORMAT.MIN_YEAR} and ${NUMBER_FORMAT.MAX_YEAR}.`
      );
      return;
    }

    if (isEditMode) {
      // Update existing budget
      const updatedBudget = {
        ...budget,
        category,
        amount: amountValue,
        month: monthValue,
        year: yearValue,
      };

      dispatch({
        type: ACTION_TYPES.UPDATE_BUDGET,
        payload: updatedBudget,
      });

      showSuccess("Budget updated successfully!");
    } else {
      // Create new budget
      const newBudget = {
        id: uuid(),
        category,
        amount: amountValue,
        month: monthValue,
        year: yearValue,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: ACTION_TYPES.ADD_BUDGET, payload: newBudget });
      showSuccess("Budget added successfully!");
    }

    onClose();
  };

  const handleClose = () => {
    setFormData(getInitialFormData(selectedMonth, selectedYear));
    setError("");
    onClose();
  };

  // Use key to reset form when budget changes
  const modalKey = useMemo(() => {
    return budget?.id ?? `new-${selectedMonth}-${selectedYear}`;
  }, [budget?.id, selectedMonth, selectedYear]);

  return (
    <Dialog
      key={modalKey}
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
          ? `${UI_TEXT.EDIT} ${UI_TEXT.BUDGETS}`
          : UI_TEXT.ADD_NEW_BUDGET_TITLE}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent className="px-4 sm:px-6">
          <FormFieldGroup columns={2} spacing={3} className="mb-4">
            <FormField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              type="select"
              required
              options={[
                { value: "", label: UI_TEXT.CHOOSE || "Choose..." },
                ...SORTED_EXPENSE_CATEGORIES.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
            />
            <FormField
              label={UI_TEXT.BUDGET_LIMIT}
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
              label="Month"
              name="month"
              type="number"
              value={formData.month || ""}
              onChange={handleChange}
              required
              inputProps={{
                min: NUMBER_FORMAT.MIN_MONTH,
                max: NUMBER_FORMAT.MAX_MONTH,
              }}
            />
            <FormField
              label="Year"
              name="year"
              type="number"
              value={formData.year || ""}
              onChange={handleChange}
              required
              inputProps={{
                min: NUMBER_FORMAT.MIN_YEAR,
                max: NUMBER_FORMAT.MAX_YEAR,
              }}
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
            className="flex-1 sm:flex-initial py-2.5 sm:py-2 touch-manipulation bg-purple-600 hover:bg-purple-700"
          >
            {UI_TEXT.SAVE || "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BudgetModal;
