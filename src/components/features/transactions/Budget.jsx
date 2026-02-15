import EditTransactionModal from "@components/features/transactions/EditTransactionModal";
import {
  ACTION_TYPES,
  CURRENCY_FORMAT_OPTIONS,
  CURRENCY_SYMBOL,
  DEFAULT_VALUES,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";
import { Button } from "@ui/Button";
import { Card, CardBody, CardHeader } from "@ui/Card";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import { getCategoryTagStyle } from "@utils/colorUtils";
import { compareByDateThenCreatedAt, parseDate } from "@utils/dateUtils";
import { showSuccess } from "@utils/toast";
import { useMemo, useState } from "react";

const Budget = () => {
  const {
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
    selectedCategory,
    searchQuery,
    dispatch,
  } = useBudget();
  const { filteredTransactions } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear,
    searchQuery,
  );
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    transactionId: null,
  });

  // Filter transactions by category
  const categoryFilteredTransactions = useMemo(() => {
    if (!selectedCategory) return filteredTransactions;
    return filteredTransactions.filter((t) => t.category === selectedCategory);
  }, [filteredTransactions, selectedCategory]);

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, transactionId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.transactionId) {
      dispatch({
        type: ACTION_TYPES.DELETE_TRANSACTION,
        payload: deleteDialog.transactionId,
      });
      showSuccess(UI_TEXT.SUCCESS_TRANSACTION_DELETED);
      setDeleteDialog({ open: false, transactionId: null });
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  // Sort transactions by date (oldest first for bank statement format)
  const sortedTransactions = useMemo(() => {
    return [...categoryFilteredTransactions].sort((a, b) =>
      compareByDateThenCreatedAt(a, b),
    );
  }, [categoryFilteredTransactions]);

  // Calculate starting balance from all transactions before the current view period
  const startingBalance = useMemo(() => {
    if (sortedTransactions.length === 0) return DEFAULT_VALUES.BALANCE;

    const earliest = parseDate(sortedTransactions[0].date);
    if (!earliest) return DEFAULT_VALUES.BALANCE;
    const earliestStart = earliest.startOf("day");

    const previousTransactions = transactions.filter((transaction) => {
      if (!transaction.date) return false;
      const d = parseDate(transaction.date);
      return d ? d.startOf("day").isBefore(earliestStart) : false;
    });

    const sortedPrevious = [...previousTransactions].sort((a, b) =>
      compareByDateThenCreatedAt(a, b),
    );

    // Calculate running balance from previous transactions
    return sortedPrevious.reduce((balance, transaction) => {
      const amount = transaction.amount || DEFAULT_VALUES.AMOUNT;
      return transaction.type === TRANSACTION_TYPES.INCOME
        ? balance + amount
        : balance - amount;
    }, DEFAULT_VALUES.BALANCE);
  }, [transactions, sortedTransactions]);

  // Calculate running balance with starting balance
  const transactionsWithBalance = useMemo(() => {
    return sortedTransactions.reduce((acc, transaction) => {
      const amount = transaction.amount || DEFAULT_VALUES.AMOUNT;
      const previousBalance =
        acc.length > 0 ? acc[acc.length - 1].balance : startingBalance;
      const newBalance =
        transaction.type === TRANSACTION_TYPES.INCOME
          ? previousBalance + amount
          : previousBalance - amount;
      acc.push({
        ...transaction,
        balance: newBalance,
      });
      return acc;
    }, []);
  }, [sortedTransactions, startingBalance]);

  return (
    <div className="mx-auto mb-2 md:mb-4">
      <div className="mb-2 md:mb-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
          {UI_TEXT.TRANSACTIONS}
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base">
          {UI_TEXT.VIEW_AND_MANAGE_TRANSACTIONS}
        </p>
      </div>

      {categoryFilteredTransactions.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <i className="ion-information-circled text-4xl text-blue-500 mb-3"></i>
              <p className="text-gray-700 font-medium">
                {UI_TEXT.NO_TRANSACTIONS}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader bgColor="bg-blue-500">
            <h5 className="text-sm sm:text-base md:text-lg font-semibold wrap-break-word">
              <span className="block sm:inline">
                {UI_TEXT.BANK_STATEMENT} - {categoryFilteredTransactions.length}{" "}
                {UI_TEXT.TRANSACTION_S}
              </span>
              {selectedCategory && (
                <span className="block sm:inline sm:ml-1 text-xs sm:text-sm font-normal opacity-90">
                  ({UI_TEXT.FILTERED}: {selectedCategory})
                </span>
              )}
            </h5>
          </CardHeader>
          <CardBody className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                      {UI_TEXT.S_NO}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.DATE}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.MODE}
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.PARTICULARS}
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.DEPOSITS}
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.WITHDRAWALS}
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.BALANCE}
                    </th>
                    <th className="text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {UI_TEXT.ACTION}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Opening Balance Row */}
                  {startingBalance !== DEFAULT_VALUES.BALANCE &&
                    sortedTransactions.length > 0 && (
                      <tr className="bg-blue-50 border-b-2 border-blue-200">
                        <td className="whitespace-nowrap text-center text-sm text-gray-600 font-medium">
                          -
                        </td>
                        <td className="whitespace-nowrap text-sm text-gray-700 italic">
                          {UI_TEXT.OPENING_BALANCE}
                        </td>
                        <td className="whitespace-nowrap text-sm text-gray-700">
                          -
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 italic">
                          {UI_TEXT.BALANCE_BROUGHT_FORWARD}
                        </td>
                        <td className="whitespace-nowrap text-right text-sm font-semibold text-gray-600">
                          -
                        </td>
                        <td className="whitespace-nowrap text-right text-sm font-semibold text-gray-600">
                          -
                        </td>
                        <td className="whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                          {CURRENCY_SYMBOL}
                          {formatCurrency(
                            startingBalance,
                            CURRENCY_FORMAT_OPTIONS.STANDARD,
                          )}
                        </td>
                        <td className="whitespace-nowrap text-center">-</td>
                      </tr>
                    )}
                  {transactionsWithBalance.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="whitespace-nowrap text-center text-sm text-gray-600 font-medium">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date, "short")}
                      </td>
                      <td className="whitespace-nowrap text-sm text-gray-700">
                        <span className="text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {transaction.mode || UI_TEXT.NOT_AVAILABLE}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 min-w-0 max-w-[180px] sm:max-w-[220px] md:max-w-xs">
                        <div
                          className="font-medium break-all"
                          title={transaction.description}
                        >
                          {transaction.description}
                        </div>
                        {transaction.category && (
                          <div
                            className="text-xs text-gray-500 mt-0.5 break-all"
                            title={transaction.category}
                          >
                            {transaction.category}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {transaction.type === TRANSACTION_TYPES.INCOME
                          ? `${CURRENCY_SYMBOL}${formatCurrency(
                              transaction.amount,
                              CURRENCY_FORMAT_OPTIONS.STANDARD,
                            )}`
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap text-right text-sm font-semibold text-red-600">
                        {transaction.type === TRANSACTION_TYPES.EXPENSE
                          ? `${CURRENCY_SYMBOL}${formatCurrency(
                              transaction.amount,
                              CURRENCY_FORMAT_OPTIONS.STANDARD,
                            )}`
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                        {CURRENCY_SYMBOL}
                        {formatCurrency(
                          transaction.balance,
                          CURRENCY_FORMAT_OPTIONS.STANDARD,
                        )}
                      </td>
                      <td className="whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 min-w-[32px]"
                            title={UI_TEXT.EDIT}
                          >
                            <EditIcon className="size-5 sm:size-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 min-w-[32px]"
                            title={UI_TEXT.DELETE}
                          >
                            <CloseIcon className="size-5 sm:size-6" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {/* Opening Balance Card */}
              {startingBalance !== DEFAULT_VALUES.BALANCE &&
                sortedTransactions.length > 0 && (
                  <div className="p-2 md:p-4 bg-blue-50 border-b-2 border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-sm sm:text-base text-gray-800 mb-1">
                          {UI_TEXT.OPENING_BALANCE}
                        </div>
                        <div className="text-xs text-gray-600 italic">
                          {UI_TEXT.BALANCE_BROUGHT_FORWARD}
                        </div>
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-gray-800">
                        {CURRENCY_SYMBOL}
                        {formatCurrency(
                          startingBalance,
                          CURRENCY_FORMAT_OPTIONS.STANDARD,
                        )}
                      </div>
                    </div>
                  </div>
                )}
              {transactionsWithBalance.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-2 md:p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-sm sm:text-base text-gray-900 mb-1 break-all"
                        title={transaction.description}
                      >
                        {transaction.description}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        {formatDate(transaction.date, "short")}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {transaction.mode && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-xl">
                            {transaction.mode}
                          </span>
                        )}
                        {transaction.category && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded-xl border border-current"
                            style={getCategoryTagStyle(transaction.category)}
                          >
                            {transaction.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-500 hover:text-blue-700 active:text-blue-800 p-2 touch-manipulation"
                        title={UI_TEXT.EDIT}
                      >
                        <EditIcon className="size-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-500 hover:text-red-700 active:text-red-800 p-2 touch-manipulation"
                        title={UI_TEXT.DELETE}
                      >
                        <CloseIcon className="size-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 md:mt-4 pt-2 md:pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {UI_TEXT.DEPOSITS}
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-green-600 wrap-break-word">
                        {transaction.type === TRANSACTION_TYPES.INCOME
                          ? `${CURRENCY_SYMBOL}${formatCurrency(
                              transaction.amount,
                              CURRENCY_FORMAT_OPTIONS.STANDARD,
                            )}`
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {UI_TEXT.WITHDRAWALS}
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-red-600 wrap-break-word">
                        {transaction.type === TRANSACTION_TYPES.EXPENSE
                          ? `${CURRENCY_SYMBOL}${formatCurrency(
                              transaction.amount,
                              CURRENCY_FORMAT_OPTIONS.STANDARD,
                            )}`
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        {UI_TEXT.BALANCE}
                      </div>
                      <div className="text-sm sm:text-base font-semibold text-gray-800 wrap-break-word">
                        {CURRENCY_SYMBOL}
                        {formatCurrency(
                          transaction.balance,
                          CURRENCY_FORMAT_OPTIONS.STANDARD,
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        transaction={editingTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, transactionId: null })}
        onConfirm={confirmDelete}
        title={UI_TEXT.DELETE_TRANSACTION_TITLE}
        message={UI_TEXT.CONFIRM_DELETE_TRANSACTION}
        type="warning"
        variant="danger"
        confirmText={UI_TEXT.DELETE}
      />
    </div>
  );
};

export default Budget;
