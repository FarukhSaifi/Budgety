import ImportPreviewRow from "@components/features/transactions/ImportPreviewRow";
import AddTransactionModal from "@components/features/transactions/TransactionForm";
import { ACTION_TYPES, ERROR_MESSAGES, TIMEOUTS, UI_TEXT } from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useDuplicateIndices } from "@hooks/useDuplicateIndices";
import { Add as AddIcon } from "@mui/icons-material";
import { Button } from "@ui/Button";
import { Card, CardBody, CardHeader } from "@ui/Card";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import {
  detectColumnMapping,
  extractTransactionData,
  parseCSVLine,
} from "@utils/bankStatementParser";
import { filterDuplicates } from "@utils/duplicateDetection";
import {
  prepareTransactionsForImport,
  validateColumnMapping,
} from "@utils/importHelpers";
import { parsePDF } from "@utils/pdfParser";
import { showError, showInfo, showSuccess, showWarning } from "@utils/toast";
import { useCallback, useState } from "react";
import * as XLSX from "xlsx";

function setPreviewFromParsed(parsedTransactions, mapping, setters) {
  const {
    setColumnMapping,
    setAllParsedData,
    setPreviewData,
    setEditedCategories,
    setShowPreview,
  } = setters;
  setColumnMapping(mapping);
  setAllParsedData(parsedTransactions);
  setPreviewData(parsedTransactions);
  setEditedCategories({});
  setShowPreview(true);
}

const BankStatementImport = () => {
  const { dispatch, transactions } = useBudget();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [allParsedData, setAllParsedData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [editedCategories, setEditedCategories] = useState({});
  const [columnMapping, setColumnMapping] = useState(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] =
    useState(false);

  const duplicateIndices = useDuplicateIndices(allParsedData, transactions);

  const setParsedState = useCallback(
    (parsed, mapping) =>
      setPreviewFromParsed(parsed, mapping, {
        setColumnMapping,
        setAllParsedData,
        setPreviewData,
        setEditedCategories,
        setShowPreview,
      }),
    [],
  );

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file) => {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isPDF = fileName.endsWith(".pdf");

    if (isPDF) {
      await parsePDFFile(file);
    } else if (isExcel) {
      parseExcel(file);
    } else {
      parseCSV(file);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onerror = () => {
      showError(ERROR_MESSAGES.CSV_READ_FAILED);
    };
    reader.onload = (e) => {
      try {
        let text = e.target.result;

        // Handle different line endings (CRLF, LF, CR)
        text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

        // Split by lines and filter empty lines
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          showError(ERROR_MESSAGES.CSV_EMPTY);
          return;
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]);

        // Check if headers are valid
        if (headers.length === 0 || headers.every((h) => !h || !h.trim())) {
          showError(ERROR_MESSAGES.CSV_NO_HEADERS);
          return;
        }

        const mapping = detectColumnMapping(headers);
        const validation = validateColumnMapping(mapping);
        if (!validation.valid) {
          showError(
            ERROR_MESSAGES.CSV_MISSING_COLUMNS.replace(
              "{missing}",
              validation.missingColumns.join(", "),
            ).replace("{found}", headers.join(", ")),
          );
          return;
        }

        const parsedTransactions = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const values = parseCSVLine(line);
          if (
            values.length === 0 ||
            values.every(
              (v) => !v || (typeof v === "string" && v.trim() === ""),
            )
          )
            continue;
          parsedTransactions.push(extractTransactionData(values, mapping));
        }

        if (parsedTransactions.length === 0) {
          showError(ERROR_MESSAGES.CSV_NO_TRANSACTIONS);
          return;
        }

        setParsedState(parsedTransactions, mapping);
      } catch (error) {
        showError(
          ERROR_MESSAGES.CSV_PARSE_ERROR.replace("{message}", error.message),
        );
      }
    };
    // Try to read with UTF-8 encoding, fallback to default
    reader.readAsText(file, "UTF-8");
  };

  const parsePDFFile = async (file) => {
    try {
      showInfo("Extracting data from PDF... This may take a moment.");

      const parsedTransactions = await parsePDF(file);

      if (parsedTransactions.length === 0) {
        showError(ERROR_MESSAGES.PDF_NO_VALID_TRANSACTIONS);
        return;
      }

      const mapping = {
        date: 0,
        description: 1,
        amount: 2,
        type: 3,
        mode: 4,
        balance: 5,
      };
      setParsedState(parsedTransactions, mapping);
    } catch (error) {
      showError(
        ERROR_MESSAGES.PDF_PARSE_ERROR.replace("{message}", error.message),
      );
    }
  };

  const parseExcel = (file) => {
    const reader = new FileReader();
    reader.onerror = () => {
      showError(ERROR_MESSAGES.EXCEL_READ_FAILED);
    };
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        let workbook;

        try {
          workbook = XLSX.read(data, { type: "array" });
        } catch (readError) {
          showError(
            ERROR_MESSAGES.EXCEL_PARSE_ERROR.replace(
              "{message}",
              readError.message,
            ),
          );
          return;
        }

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          showError(ERROR_MESSAGES.EXCEL_NO_SHEETS);
          return;
        }

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          showError(ERROR_MESSAGES.EXCEL_FIRST_SHEET);
          return;
        }

        // Convert to JSON with header row
        let jsonData;
        try {
          jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            raw: false,
            blankrows: false,
          });
        } catch (jsonError) {
          showError(
            ERROR_MESSAGES.EXCEL_CONVERT_ERROR.replace(
              "{message}",
              jsonError.message,
            ),
          );
          return;
        }

        if (!jsonData || jsonData.length < 2) {
          showError(ERROR_MESSAGES.EXCEL_EMPTY);
          return;
        }

        // Get headers from first row
        const headers = jsonData[0].map((h) => String(h || "").trim());

        // Check if headers are valid
        if (headers.length === 0 || headers.every((h) => !h)) {
          showError(ERROR_MESSAGES.EXCEL_NO_HEADERS);
          return;
        }

        const mapping = detectColumnMapping(headers);
        const validation = validateColumnMapping(mapping);
        if (!validation.valid) {
          showError(
            ERROR_MESSAGES.EXCEL_MISSING_COLUMNS.replace(
              "{missing}",
              validation.missingColumns.join(", "),
            ).replace("{found}", headers.join(", ")),
          );
          return;
        }

        const parsedTransactions = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!Array.isArray(row) || row.length === 0) continue;
          const values = row.map((cell) => {
            if (cell === null || cell === undefined) return "";
            if (typeof cell === "number") return String(cell);
            return String(cell || "").trim();
          });
          if (values.every((v) => !v || v === "")) continue;
          parsedTransactions.push(extractTransactionData(values, mapping));
        }

        if (parsedTransactions.length === 0) {
          showError(ERROR_MESSAGES.EXCEL_NO_TRANSACTIONS);
          return;
        }

        setParsedState(parsedTransactions, mapping);
      } catch (error) {
        showError(
          ERROR_MESSAGES.EXCEL_PARSE_ERROR_FALLBACK.replace(
            "{message}",
            error.message,
          ),
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = () => {
    const { preparedTransactions, skipReasons } = prepareTransactionsForImport(
      allParsedData,
      editedCategories,
    );

    const { filtered: uniqueTransactions, duplicateCount } = filterDuplicates(
      preparedTransactions,
      transactions,
    );

    let imported = 0;
    let skipped =
      skipReasons.missingFields +
      skipReasons.invalidDate +
      skipReasons.zeroAmount +
      duplicateCount;

    if (uniqueTransactions.length > 0) {
      try {
        dispatch({
          type: ACTION_TYPES.ADD_TRANSACTIONS_BULK,
          payload: uniqueTransactions,
        });
        imported = uniqueTransactions.length;
      } catch {
        skipped += uniqueTransactions.length;
      }
    }

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

      duplicateCount > 0 ? showWarning(message) : showSuccess(message);
      setTimeout(() => setImportedCount(0), TIMEOUTS.IMPORT_SUCCESS);
    } else {
      const reasonMsg = Object.entries(skipReasons)
        .filter(([, count]) => count > 0)
        .map(([reason, count]) => `${reason}: ${count}`)
        .join(", ");
      showError(
        ERROR_MESSAGES.IMPORT_NONE_SKIPPED.replace(
          "{skipped}",
          String(skipped),
        ).replace("{reasons}", reasonMsg),
      );
    }
  };

  const handleCategoryChange = useCallback((index, value) => {
    setEditedCategories((prev) => ({ ...prev, [index]: value }));
  }, []);

  const resetImport = () => {
    setShowPreview(false);
    setPreviewData([]);
    setAllParsedData([]);
    setEditedCategories({});
    setColumnMapping(null);
    setFile(null);
  };

  // Get count of imported transactions
  const importedTransactionsCount = transactions.filter(
    (t) => t.imported === true,
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
              <h5 className="text-base sm:text-lg md:text-xl font-semibold text-white wrap-break-word">
                {UI_TEXT.IMPORT_BANK_STATEMENT}
              </h5>
              <p className="text-xs sm:text-sm mt-1 opacity-90 text-blue-100 wrap-break-word">
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
                <i className="ion-trash-a text-sm sm:text-base shrink-0"></i>
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
                <i className="ion-checkmark-circled text-green-600 text-lg sm:text-xl shrink-0"></i>
                <span className="text-green-800 font-medium text-sm sm:text-base wrap-break-word">
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
                    <p className="text-xs sm:text-sm text-gray-600 wrap-break-word px-2">
                      {file ? (
                        <span className="font-medium break-all">
                          {file.name}
                        </span>
                      ) : (
                        <span className="wrap-break-word">
                          Click to upload or drag and drop
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 wrap-break-word px-2">
                      CSV, XLS, XLSX, or PDF files
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
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
                <h6 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 md:mb-4 wrap-break-word">
                  <span className="block sm:inline">
                    Preview Transactions ({previewData.length} record
                    {previewData.length !== 1 ? "s" : ""})
                  </span>
                  {duplicateIndices.size > 0 && (
                    <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0 text-sm font-normal text-orange-600">
                      ({duplicateIndices.size} duplicate(s) will be skipped)
                    </span>
                  )}
                </h6>

                {columnMapping && (
                  <div className="mb-2 md:mb-4 p-2 md:p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-full overflow-x-hidden">
                    <p className="text-xs sm:text-sm text-blue-800 mb-2 wrap-break-word">
                      <strong>Detected Columns:</strong> Check the browser
                      console (F12) to see which columns were auto-detected.
                    </p>
                    <p className="text-xs text-blue-700 mt-1 wrap-break-word">
                      Tip: Ensure your file has headers like &quot;Date&quot;,
                      &quot;Description&quot;, &quot;Deposits&quot;,
                      &quot;Withdraw&quot;, &quot;Amount&quot;, etc.
                    </p>
                  </div>
                )}

                <div className="mb-2 md:mb-4 p-2 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg w-full max-w-full overflow-x-hidden">
                  <p className="text-xs sm:text-sm text-yellow-800 mb-2 wrap-break-word">
                    <strong>Note:</strong> The system will auto-detect
                    transaction types and categories. You can review and edit
                    categories before importing.
                  </p>
                </div>

                {/* Desktop Table View - scrollable */}
                <div className="hidden lg:block mb-4 max-h-[50vh] overflow-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 z-10">
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
                      {previewData.map((row) => {
                        const actualIndex = allParsedData.findIndex(
                          (r) => r === row,
                        );
                        return (
                          <ImportPreviewRow
                            key={actualIndex}
                            row={row}
                            actualIndex={actualIndex}
                            editedCategory={editedCategories[actualIndex]}
                            onCategoryChange={handleCategoryChange}
                            isDuplicate={duplicateIndices.has(actualIndex)}
                            variant="table"
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View - scrollable */}
                <div className="lg:hidden mb-4 max-h-[50vh] overflow-y-auto overflow-x-hidden space-y-2 md:space-y-3 w-full max-w-full border border-gray-200 rounded-lg p-2">
                  {previewData.map((row) => {
                    const actualIndex = allParsedData.findIndex(
                      (r) => r === row,
                    );
                    return (
                      <ImportPreviewRow
                        key={actualIndex}
                        row={row}
                        actualIndex={actualIndex}
                        editedCategory={editedCategories[actualIndex]}
                        onCategoryChange={handleCategoryChange}
                        isDuplicate={duplicateIndices.has(actualIndex)}
                        variant="card"
                      />
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
