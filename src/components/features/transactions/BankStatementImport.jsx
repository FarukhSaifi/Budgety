import {
  ACTION_TYPES,
  CATEGORY_PATTERNS,
  CURRENCY_SYMBOL,
  DISPLAY_LIMITS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NUMBER_FORMAT,
  TIMEOUTS,
  TRANSACTION_MODES,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { Add as AddIcon } from "@mui/icons-material";
import { Button } from "@ui/Button";
import { Card, CardBody, CardHeader } from "@ui/Card";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import {
  detectColumnMapping,
  detectTransactionMode,
  detectTransactionType,
  extractTransactionData,
  normalizeMode,
  parseAmount,
  parseCSVLine,
  parseDate,
} from "@utils/bankStatementParser";
import { filterDuplicates } from "@utils/duplicateDetection";
import { showError, showSuccess, showWarning } from "@utils/toast";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import * as XLSX from "xlsx";
import AddTransactionModal from "./TransactionForm";

const BankStatementImport = () => {
  const { dispatch, transactions } = useBudget();
  const { formatCurrency } = useCurrencyFormatter();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [allParsedData, setAllParsedData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [editedCategories, setEditedCategories] = useState({});
  const [columnMapping, setColumnMapping] = useState(null);
  const [duplicateIndices, setDuplicateIndices] = useState(new Set());
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);

  // Check for duplicates in parsed data whenever allParsedData or transactions change
  useEffect(() => {
    if (!allParsedData || allParsedData.length === 0) {
      setDuplicateIndices(new Set());
      return;
    }

    // Prepare transactions for duplicate check
    const preparedTransactions = allParsedData
      .map((row) => {
        const dateStr = row.date || "";
        const description = row.description || "";
        const amountStr = row.amount || "";
        const typeField = row.type || "";

        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) return null;

        const numericAmount = parseAmount(amountStr);
        if (numericAmount === 0) return null;

        const type = detectTransactionType(amountStr, typeField);

        return {
          date: date.toISOString().split("T")[0],
          description: description.trim(),
          amount: Number(numericAmount.toFixed(2)),
          type,
        };
      })
      .filter(Boolean);

    // Check for duplicates
    const { duplicates } = filterDuplicates(preparedTransactions, transactions);
    const duplicateSet = new Set(duplicates.map((d) => d.index));
    setDuplicateIndices(duplicateSet);
  }, [allParsedData, transactions]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file) => {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (isExcel) {
      parseExcel(file);
    } else {
      parseCSV(file);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          showError("CSV file appears to be empty or invalid");
          return;
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]);
        const mapping = detectColumnMapping(headers);

        // Parse data rows
        const parsedTransactions = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);

          // Skip empty rows
          if (
            values.length === 0 ||
            values.every((v) => !v || v.trim() === "")
          ) {
            continue;
          }

          const transactionData = extractTransactionData(values, mapping);
          parsedTransactions.push(transactionData);
        }

        if (parsedTransactions.length === 0) {
          alert("No valid transactions found in the file");
          return;
        }

        setColumnMapping(mapping);
        setAllParsedData(parsedTransactions);
        setPreviewData(
          parsedTransactions.slice(0, DISPLAY_LIMITS.PREVIEW_ROWS)
        );
        setEditedCategories({});
        setShowPreview(true);
      } catch {
        showError(
          "Error parsing CSV file. Please ensure it's a valid CSV file."
        );
      }
    };
    reader.readAsText(file);
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          raw: false,
        });

        if (jsonData.length < 2) {
          showError("Excel file appears to be empty or invalid");
          return;
        }

        // Get headers from first row
        const headers = jsonData[0].map((h) => String(h || "").trim());
        const mapping = detectColumnMapping(headers);

        // Parse data rows
        const parsedTransactions = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!Array.isArray(row) || row.length === 0) continue;

          const values = row.map((cell) => String(cell || "").trim());

          // Skip empty rows
          if (values.every((v) => !v || v === "")) {
            continue;
          }

          const transactionData = extractTransactionData(values, mapping);
          parsedTransactions.push(transactionData);
        }

        if (parsedTransactions.length === 0) {
          showError("No valid transactions found in the file");
          return;
        }

        setColumnMapping(mapping);
        setAllParsedData(parsedTransactions);
        setPreviewData(
          parsedTransactions.slice(0, DISPLAY_LIMITS.PREVIEW_ROWS)
        );
        setEditedCategories({});
        setShowPreview(true);
      } catch {
        showError(
          "Error parsing Excel file. Please ensure it's a valid Excel file."
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const categorizeTransaction = (description, transactionType) => {
    if (!description) {
      return transactionType === TRANSACTION_TYPES.INCOME
        ? INCOME_CATEGORIES.OTHER
        : EXPENSE_CATEGORIES.OTHER;
    }

    const desc = description.toLowerCase();
    const patterns =
      transactionType === TRANSACTION_TYPES.INCOME
        ? CATEGORY_PATTERNS.INCOME
        : CATEGORY_PATTERNS.EXPENSE;

    // Check patterns for the transaction type
    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some((keyword) => desc.includes(keyword))) {
        return category;
      }
    }

    // Default based on transaction type
    return transactionType === TRANSACTION_TYPES.INCOME
      ? INCOME_CATEGORIES.OTHER
      : EXPENSE_CATEGORIES.OTHER;
  };

  const handleImport = () => {
    let imported = 0;
    let skipped = 0;
    const skipReasons = {
      missingFields: 0,
      invalidDate: 0,
      zeroAmount: 0,
      duplicate: 0,
      dispatchError: 0,
    };

    // First, prepare all valid transactions
    const preparedTransactions = [];

    allParsedData.forEach((row, index) => {
      const dateStr = row.date || "";
      const description = row.description || "";
      const amountStr = row.amount || "";
      const typeField = row.type || "";
      const modeValue = row.mode || "";

      // Skip if essential fields are missing
      if (!dateStr || !description || !amountStr) {
        skipReasons.missingFields++;
        skipped++;
        return;
      }

      // Parse date
      const date = parseDate(dateStr);
      if (!date || isNaN(date.getTime())) {
        skipReasons.invalidDate++;
        skipped++;
        return;
      }

      // Parse amount
      const numericAmount = parseAmount(amountStr);
      if (numericAmount === 0) {
        skipReasons.zeroAmount++;
        skipped++;
        return;
      }

      // Determine transaction type
      const type = detectTransactionType(amountStr, typeField);

      // Get mode
      let mode = normalizeMode(modeValue) || detectTransactionMode(description);
      if (!mode) {
        mode = TRANSACTION_MODES.OTHER;
      }

      // Auto-categorize - use edited category if available, otherwise detect
      const editedCategory = editedCategories[index];
      const category = editedCategory
        ? editedCategory
        : categorizeTransaction(description, type);

      // Validate category matches transaction type
      const isValidCategory =
        type === TRANSACTION_TYPES.INCOME
          ? Object.values(INCOME_CATEGORIES).includes(category)
          : Object.values(EXPENSE_CATEGORIES).includes(category);

      const finalCategory = isValidCategory
        ? category
        : type === TRANSACTION_TYPES.INCOME
        ? INCOME_CATEGORIES.OTHER
        : EXPENSE_CATEGORIES.OTHER;

      const transaction = {
        id: uuid(),
        type,
        date: date.toISOString().split("T")[0],
        mode,
        description: description.trim(),
        category: finalCategory,
        amount: Number(numericAmount.toFixed(NUMBER_FORMAT.DECIMAL_PLACES)),
        createdAt: new Date().toISOString(),
        imported: true,
      };

      preparedTransactions.push(transaction);
    });

    // Filter out duplicates
    const { filtered: uniqueTransactions, duplicateCount } = filterDuplicates(
      preparedTransactions,
      transactions
    );

    skipReasons.duplicate = duplicateCount;

    // Import unique transactions
    // These transactions are added to the global state and will be automatically
    // available throughout the entire app (Dashboard, Budget, Reports, Charts, etc.)
    // via the BudgetContext. They are also persisted to localStorage.
    uniqueTransactions.forEach((transaction) => {
      try {
        dispatch({ type: ACTION_TYPES.ADD_TRANSACTION, payload: transaction });
        imported++;
      } catch {
        skipReasons.dispatchError++;
        skipped++;
      }
    });

    skipped += duplicateCount;

    // Show success message with import count
    if (imported > 0) {
      const message =
        duplicateCount > 0
          ? `Successfully imported ${imported} transaction(s). ${duplicateCount} duplicate(s) were skipped.`
          : `Successfully imported ${imported} transaction(s)!`;

      setImportedCount(imported);
      setPreviewData([]);
      setAllParsedData([]);
      setEditedCategories({});
      setColumnMapping(null);
      setShowPreview(false);
      setFile(null);

      // Show toast if duplicates were found
      if (duplicateCount > 0) {
        showWarning(message);
      } else {
        showSuccess(message);
      }

      setTimeout(() => {
        setImportedCount(0);
      }, TIMEOUTS.IMPORT_SUCCESS);
    } else {
      const reasonMsg = Object.entries(skipReasons)
        .filter(([_, count]) => count > 0)
        .map(([reason, count]) => `${reason}: ${count}`)
        .join(", ");
      showError(
        `No transactions were imported. ${skipped} transaction(s) were skipped. Reasons: ${reasonMsg}. Please check the file format and ensure dates, amounts, and required fields are present.`
      );
    }
  };

  const resetImport = () => {
    setShowPreview(false);
    setPreviewData([]);
    setAllParsedData([]);
    setEditedCategories({});
    setColumnMapping(null);
    setFile(null);
    setDuplicateIndices(new Set());
  };

  // Get count of imported transactions
  const importedTransactionsCount = transactions.filter(
    (t) => t.imported === true
  ).length;

  // Handle cleanup of all imported transactions
  const handleCleanupImported = () => {
    setShowCleanupDialog(true);
  };

  const confirmCleanup = () => {
    const count = importedTransactionsCount;
    dispatch({
      type: ACTION_TYPES.DELETE_ALL_IMPORTED_TRANSACTIONS,
    });
    showSuccess(UI_TEXT.CLEANUP_SUCCESS.replace("{count}", count.toString()));
    setShowCleanupDialog(false);
  };

  return (
    <div className="mx-auto mb-2 md:mb-4 w-full max-w-full overflow-x-hidden">
      <Card>
        <CardHeader bgColor="bg-blue-500">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4">
            <div className="flex-1 min-w-0 overflow-hidden">
              <h5 className="text-base sm:text-lg md:text-xl font-semibold text-white break-words">
                {UI_TEXT.IMPORT_BANK_STATEMENT}
              </h5>
              <p className="text-xs sm:text-sm mt-1 opacity-90 text-blue-100 break-words">
                {UI_TEXT.UPLOAD_CSV_EXCEL}
              </p>
            </div>
            {importedTransactionsCount > 0 && (
              <Button
                variant="danger"
                onClick={handleCleanupImported}
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center py-2.5 sm:py-2 touch-manipulation text-xs sm:text-sm"
              >
                <i className="ion-trash-a text-sm sm:text-base flex-shrink-0"></i>
                <span className="truncate">
                  <span className="hidden sm:inline">
                    {UI_TEXT.CLEANUP_IMPORTED_DATA}
                  </span>
                  <span className="sm:hidden">Cleanup</span>
                  <span className="ml-1">({importedTransactionsCount})</span>
                </span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody className="overflow-x-hidden">
          {importedCount > 0 && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <i className="ion-checkmark-circled text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                <span className="text-green-800 font-medium text-sm sm:text-base break-words">
                  Successfully imported {importedCount} transaction(s)!
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2 md:space-y-4 w-full max-w-full overflow-x-hidden">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                Upload Bank Statement File
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 active:border-blue-600 transition-colors touch-manipulation">
                    <i className="ion-upload text-2xl sm:text-3xl text-gray-400 mb-2"></i>
                    <p className="text-xs sm:text-sm text-gray-600 break-words px-2">
                      {file ? (
                        <span className="font-medium break-all">
                          {file.name}
                        </span>
                      ) : (
                        <span className="break-words">
                          Click to upload or drag and drop
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 break-words px-2">
                      CSV, XLS, or XLSX files
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="text-center py-2 md:py-4">
              <span className="text-sm text-gray-500 font-medium">OR</span>
            </div>

            <div>
              <Button
                type="button"
                onClick={() => setIsAddTransactionModalOpen(true)}
                variant="outline"
                fullWidth
                size="md"
                className="py-3 sm:py-2 touch-manipulation text-sm sm:text-base"
                icon={<AddIcon className="text-base sm:text-lg" />}
              >
                <span className="truncate">{UI_TEXT.ADD_TRANSACTION}</span>
              </Button>
            </div>

            <AddTransactionModal
              open={isAddTransactionModalOpen}
              onClose={() => setIsAddTransactionModalOpen(false)}
            />

            {showPreview && previewData.length > 0 && (
              <div className="mt-2 md:mt-4 w-full max-w-full overflow-x-hidden">
                <h6 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 md:mb-4 break-words">
                  <span className="block sm:inline">
                    Preview Transactions ({previewData.length} of{" "}
                    {allParsedData.length} shown)
                  </span>
                  {duplicateIndices.size > 0 && (
                    <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0 text-sm font-normal text-orange-600">
                      ({duplicateIndices.size} duplicate(s) will be skipped)
                    </span>
                  )}
                </h6>

                {columnMapping && (
                  <div className="mb-2 md:mb-4 p-2 md:p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-full overflow-x-hidden">
                    <p className="text-xs sm:text-sm text-blue-800 mb-2 break-words">
                      <strong>Detected Columns:</strong> Check the browser
                      console (F12) to see which columns were auto-detected.
                    </p>
                    <p className="text-xs text-blue-700 mt-1 break-words">
                      Tip: Ensure your file has headers like &quot;Date&quot;,
                      &quot;Description&quot;, &quot;Deposits&quot;,
                      &quot;Withdraw&quot;, &quot;Amount&quot;, etc.
                    </p>
                  </div>
                )}

                <div className="mb-2 md:mb-4 p-2 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg w-full max-w-full overflow-x-hidden">
                  <p className="text-xs sm:text-sm text-yellow-800 mb-2 break-words">
                    <strong>Note:</strong> The system will auto-detect
                    transaction types and categories. You can review and edit
                    categories before importing.
                  </p>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-center">S.No</th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Mode</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-center">Type</th>
                        <th className="px-4 py-2 text-left">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((row, _previewIndex) => {
                        const actualIndex = allParsedData.findIndex(
                          (r) => r === row
                        );

                        const dateStr = row.date || "";
                        const description = row.description || "";
                        const amountStr = row.amount || "";
                        const typeField = row.type || "";
                        const modeValue = row.mode || "";

                        const serialNumber = actualIndex + 1;
                        const amount = parseAmount(amountStr);
                        const type = detectTransactionType(
                          amountStr,
                          typeField
                        );

                        let mode =
                          normalizeMode(modeValue) ||
                          detectTransactionMode(description);
                        if (!mode) {
                          mode = TRANSACTION_MODES.OTHER;
                        }

                        const editedCategory = editedCategories[actualIndex];
                        const detectedCategory = categorizeTransaction(
                          description,
                          type
                        );
                        const category = editedCategory || detectedCategory;

                        const categoryOptions =
                          type === TRANSACTION_TYPES.INCOME
                            ? Object.values(INCOME_CATEGORIES)
                            : Object.values(EXPENSE_CATEGORIES);

                        const handleCategoryChange = (e) => {
                          const newCategory = e.target.value;
                          setEditedCategories((prev) => ({
                            ...prev,
                            [actualIndex]: newCategory,
                          }));
                        };

                        const isDuplicate = duplicateIndices.has(actualIndex);

                        return (
                          <tr
                            key={actualIndex}
                            className={`hover:bg-gray-50 ${
                              isDuplicate ? "bg-orange-50 opacity-75" : ""
                            }`}
                          >
                            <td className="px-4 py-2 text-center text-gray-600">
                              {serialNumber}
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
                            <td
                              className="px-4 py-2 max-w-xs truncate"
                              title={description}
                            >
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
                                minimumFractionDigits:
                                  NUMBER_FORMAT.DECIMAL_PLACES,
                                maximumFractionDigits:
                                  NUMBER_FORMAT.DECIMAL_PLACES,
                              })}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  type === TRANSACTION_TYPES.INCOME
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {type === TRANSACTION_TYPES.INCOME
                                  ? "Cr"
                                  : "Dr"}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={category}
                                onChange={handleCategoryChange}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                                title="Click to change category"
                              >
                                {categoryOptions.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                              {editedCategory && (
                                <i
                                  className="ion-edit ml-1 text-blue-600"
                                  title="Category edited"
                                ></i>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-2 md:space-y-3 mb-4 w-full max-w-full overflow-x-hidden">
                  {previewData.map((row, _previewIndex) => {
                    const actualIndex = allParsedData.findIndex(
                      (r) => r === row
                    );

                    const dateStr = row.date || "";
                    const description = row.description || "";
                    const amountStr = row.amount || "";
                    const typeField = row.type || "";
                    const modeValue = row.mode || "";

                    const serialNumber = actualIndex + 1;
                    const amount = parseAmount(amountStr);
                    const type = detectTransactionType(amountStr, typeField);

                    let mode =
                      normalizeMode(modeValue) ||
                      detectTransactionMode(description);
                    if (!mode) {
                      mode = TRANSACTION_MODES.OTHER;
                    }

                    const editedCategory = editedCategories[actualIndex];
                    const detectedCategory = categorizeTransaction(
                      description,
                      type
                    );
                    const category = editedCategory || detectedCategory;

                    const categoryOptions =
                      type === TRANSACTION_TYPES.INCOME
                        ? Object.values(INCOME_CATEGORIES)
                        : Object.values(EXPENSE_CATEGORIES);

                    const handleCategoryChange = (e) => {
                      const newCategory = e.target.value;
                      setEditedCategories((prev) => ({
                        ...prev,
                        [actualIndex]: newCategory,
                      }));
                    };

                    const isDuplicate = duplicateIndices.has(actualIndex);
                    const isIncome = type === TRANSACTION_TYPES.INCOME;
                    const amountColor = isIncome
                      ? "text-green-600"
                      : "text-red-600";

                    return (
                      <div
                        key={actualIndex}
                        className={`p-3 md:p-4 border rounded-lg ${
                          isDuplicate
                            ? "bg-orange-50 border-orange-200 opacity-75"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {/* Top Row: Serial Number, Badges, and Amount */}
                        <div className="flex items-start justify-between mb-3 gap-2 w-full overflow-hidden">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            {/* Serial Number and Badges Row */}
                            <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                              <span className="text-xs font-semibold text-gray-600 whitespace-nowrap flex-shrink-0">
                                #{serialNumber}
                              </span>
                              {isDuplicate && (
                                <span
                                  className="text-orange-600 flex-shrink-0"
                                  title="Duplicate transaction - will be skipped"
                                >
                                  <i className="ion-alert-circled text-sm"></i>
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${
                                  isIncome
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {isIncome ? "Cr" : "Dr"}
                              </span>
                              {mode && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded whitespace-nowrap flex-shrink-0">
                                  {mode}
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <div className="mb-2 w-full overflow-hidden">
                              <div
                                className="text-sm md:text-base font-semibold text-gray-900 break-words line-clamp-2"
                                title={description || "No description"}
                              >
                                {description || "No description"}
                              </div>
                            </div>

                            {/* Date */}
                            <div className="text-xs text-gray-500 truncate">
                              {dateStr}
                            </div>
                          </div>

                          {/* Amount - Right Aligned */}
                          {Math.abs(amount) > 0 && (
                            <div
                              className={`text-sm md:text-base font-bold whitespace-nowrap flex-shrink-0 ml-2 ${amountColor}`}
                            >
                              {isIncome ? "+" : "-"}
                              {CURRENCY_SYMBOL}
                              {formatCurrency(Math.abs(amount), {
                                minimumFractionDigits:
                                  NUMBER_FORMAT.DECIMAL_PLACES,
                                maximumFractionDigits:
                                  NUMBER_FORMAT.DECIMAL_PLACES,
                              })}
                            </div>
                          )}
                        </div>

                        {/* Category Selector */}
                        <div className="pt-3 border-t border-gray-200">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Category
                          </label>
                          <select
                            value={category}
                            onChange={handleCategoryChange}
                            className="w-full text-sm md:text-base px-3 py-2 bg-blue-50 text-blue-900 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation font-medium"
                            title="Click to change category"
                          >
                            {categoryOptions.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          {editedCategory && (
                            <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                              <i className="ion-edit text-xs"></i>
                              <span>Category edited</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
                  <Button
                    onClick={handleImport}
                    variant="primary"
                    fullWidth
                    size="md"
                    className="sm:flex-1 py-3 sm:py-2 touch-manipulation"
                    icon={<i className="ion-checkmark"></i>}
                  >
                    Import {allParsedData.length} Transaction(s)
                  </Button>
                  <Button
                    onClick={resetImport}
                    variant="secondary"
                    fullWidth
                    size="md"
                    className="sm:w-auto py-3 sm:py-2 touch-manipulation"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showPreview && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h6 className="font-semibold text-gray-800 mb-2">
                  File Format Guide:
                </h6>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Supported formats: CSV, XLS, XLSX</li>
                  <li>
                    First row should contain headers (Date, Description, Amount,
                    etc.)
                  </li>
                  <li>
                    Supported date formats: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
                  </li>
                  <li>
                    Amount can be in separate columns (Deposits/Withdraw) or a
                    single Amount column
                  </li>
                  <li>
                    System will auto-detect transaction type, mode, and category
                  </li>
                  <li>For Excel files, the first sheet will be used</li>
                </ul>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Cleanup Confirmation Dialog */}
      <ConfirmDialog
        open={showCleanupDialog}
        onClose={() => setShowCleanupDialog(false)}
        onConfirm={confirmCleanup}
        title={UI_TEXT.CLEANUP_IMPORTED_TITLE}
        message={`${UI_TEXT.CONFIRM_CLEANUP_IMPORTED} ${importedTransactionsCount} transaction(s) will be deleted.`}
        type="warning"
        variant="danger"
        confirmText={UI_TEXT.DELETE}
      />
    </div>
  );
};

export default BankStatementImport;
