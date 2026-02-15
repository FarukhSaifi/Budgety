import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  NUMBER_FORMAT,
  TRANSACTION_MODES,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCategories } from "@hooks/useCategories";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { SearchableCategorySelect } from "@ui/SearchableCategorySelect";
import {
  detectTransactionMode,
  detectTransactionType,
  normalizeMode,
  parseAmount,
} from "@utils/bankStatementParser";
import { categorizeTransaction } from "@utils/transactionCategorization";
import { memo } from "react";

function ImportPreviewRowInner({
  row,
  actualIndex,
  editedCategory,
  onCategoryChange,
  isDuplicate,
  variant,
}) {
  const { dispatch } = useBudget();
  const { getByType } = useCategories();
  const { formatCurrency } = useCurrencyFormatter();
  const dateStr = row.date || "";
  const description = row.description || "";
  const amountStr = row.amount || "";
  const typeField = row.type || "";
  const modeValue = row.mode || "";

  const amount = parseAmount(amountStr);
  const type = detectTransactionType(amountStr, typeField);
  let mode = normalizeMode(modeValue) || detectTransactionMode(description);
  if (!mode) mode = TRANSACTION_MODES.OTHER;

  const detectedCategory = categorizeTransaction(description, type);
  const category = editedCategory ?? detectedCategory;
  const categoryOptions = getByType(type) || [];

  const isIncome = type === TRANSACTION_TYPES.INCOME;

  if (variant === "card") {
    const amountColor = isIncome ? "text-green-600" : "text-red-600";
    return (
      <div
        className={`p-3 md:p-4 border rounded-lg ${
          isDuplicate
            ? "bg-orange-50 border-orange-200 opacity-75"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-start justify-between mb-3 gap-2 w-full overflow-hidden">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap shrink-0">
                #{actualIndex + 1}
              </span>
              {isDuplicate && (
                <span
                  className="text-orange-600 shrink-0"
                  title="Duplicate transaction - will be skipped"
                >
                  <i className="ion-alert-circled text-sm"></i>
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap shrink-0 ${
                  isIncome
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isIncome ? "Cr" : "Dr"}
              </span>
              {mode && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded whitespace-nowrap shrink-0">
                  {mode}
                </span>
              )}
            </div>
            <div className="mb-2 w-full overflow-hidden">
              <div
                className="text-sm md:text-base font-semibold text-gray-900 wrap-break-word line-clamp-2"
                title={description || UI_TEXT.NO_DESCRIPTION}
              >
                {description || UI_TEXT.NO_DESCRIPTION}
              </div>
            </div>
            <div className="text-xs text-gray-500 truncate">{dateStr}</div>
          </div>
          {Math.abs(amount) > 0 && (
            <div
              className={`text-sm md:text-base font-bold whitespace-nowrap shrink-0 ml-2 ${amountColor}`}
            >
              {isIncome ? "+" : "-"}
              {CURRENCY_SYMBOL}
              {formatCurrency(Math.abs(amount), {
                minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
              })}
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            {UI_TEXT.CATEGORY_PLACEHOLDER}
          </label>
          <SearchableCategorySelect
            name={`category-mobile-${actualIndex}`}
            value={category}
            onChange={(e) => onCategoryChange(actualIndex, e.target.value)}
            options={categoryOptions.map((cat) => ({ value: cat, label: cat }))}
            inputClassName="[&_.MuiOutlinedInput-root]:min-h-11 [&_.MuiOutlinedInput-root]:bg-blue-50 [&_.MuiOutlinedInput-input]:text-sm [&_.MuiOutlinedInput-input]:py-3 [&_.MuiOutlinedInput-input]:px-3.5 [&_.MuiOutlinedInput-root]:[&_fieldset]:border-blue-300"
            allowAddNew
            categoryType={type}
            onAddCategory={(name, catType) =>
              dispatch({
                type: ACTION_TYPES.ADD_CATEGORY,
                payload: { name, type: catType },
              })
            }
          />
          {editedCategory && (
            <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
              <i className="ion-edit text-xs"></i>
              <span>Category edited</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Table variant
  return (
    <tr
      className={`hover:bg-gray-50 ${
        isDuplicate ? "bg-orange-50 opacity-75" : ""
      }`}
    >
      <td className="px-4 py-2 text-center text-gray-600">
        {actualIndex + 1}
        {isDuplicate && (
          <span
            className="ml-1 text-orange-600"
            title="Duplicate transaction - will be skipped"
          >
            <i className="ion-alert-circled"></i>
          </span>
        )}
      </td>
      <td className="px-4 py-2">{dateStr}</td>
      <td className="px-4 py-2 max-w-xs truncate" title={description}>
        {description}
      </td>
      <td className="px-4 py-2">
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
          {mode}
        </span>
      </td>
      <td className="px-4 py-2 text-right font-medium">
        {CURRENCY_SYMBOL}{" "}
        {formatCurrency(amount, {
          minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
          maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
        })}
      </td>
      <td className="px-4 py-2 text-center">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            isIncome ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isIncome ? "Cr" : "Dr"}
        </span>
      </td>
      <td className="px-4 py-2">
        <div className="min-w-[150px]">
          <SearchableCategorySelect
            name={`category-${actualIndex}`}
            value={category}
            onChange={(e) => onCategoryChange(actualIndex, e.target.value)}
            options={categoryOptions.map((cat) => ({ value: cat, label: cat }))}
            inputClassName="[&_.MuiOutlinedInput-root]:min-h-8 [&_.MuiOutlinedInput-input]:text-xs [&_.MuiOutlinedInput-input]:py-1.5 [&_.MuiOutlinedInput-input]:px-2.5"
            allowAddNew
            categoryType={type}
            onAddCategory={(name, catType) =>
              dispatch({
                type: ACTION_TYPES.ADD_CATEGORY,
                payload: { name, type: catType },
              })
            }
          />
        </div>
        {editedCategory && (
          <i
            className="ion-edit ml-1 text-blue-600"
            title="Category edited"
          ></i>
        )}
      </td>
    </tr>
  );
}

const ImportPreviewRow = memo(ImportPreviewRowInner);
export default ImportPreviewRow;
