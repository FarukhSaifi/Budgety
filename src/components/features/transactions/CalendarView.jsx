import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  DEFAULT_VALUES,
  MONTHS,
  NUMBER_FORMAT,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Button } from "@ui/Button";
import { Card, CardBody, CardHeader } from "@ui/Card";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import { filterTransactionsBySearch } from "@utils/searchUtils";
import { showSuccess } from "@utils/toast";
import { useMemo, useState } from "react";
import EditTransactionModal from "./EditTransactionModal";

const CalendarView = () => {
  const { transactions, selectedMonth, selectedYear, searchQuery, dispatch } =
    useBudget();
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    transactionId: null,
  });
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  // Get transactions for the selected month/year and apply search filter
  const monthTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      if (!transaction.date) return false;
      const date = new Date(transaction.date);
      return (
        date.getMonth() + 1 === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });

    // Apply search filter if search query exists
    if (searchQuery && searchQuery.trim() !== "") {
      filtered = filterTransactionsBySearch(filtered, searchQuery);
    }

    return filtered;
  }, [transactions, selectedMonth, selectedYear, searchQuery]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const grouped = {};
    monthTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const dateKey = date.getDate();
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          income: [],
          expense: [],
          totalIncome: 0,
          totalExpense: 0,
        };
      }
      if (transaction.type === TRANSACTION_TYPES.INCOME) {
        grouped[dateKey].income.push(transaction);
        grouped[dateKey].totalIncome += transaction.amount || DEFAULT_VALUES.AMOUNT;
      } else {
        grouped[dateKey].expense.push(transaction);
        grouped[dateKey].totalExpense += transaction.amount || DEFAULT_VALUES.AMOUNT;
      }
    });
    return grouped;
  }, [monthTransactions]);

  // Get calendar days for the selected month
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth - 1; // JavaScript months are 0-indexed
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [selectedMonth, selectedYear]);

  const getDateTransactions = (day) => {
    if (!day || !transactionsByDate[day]) return [];
    return [
      ...transactionsByDate[day].income,
      ...transactionsByDate[day].expense,
    ].sort((a, b) => {
      // Sort by creation time, newest first
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });
  };

  const getDayBalance = (day) => {
    if (!day || !transactionsByDate[day]) return DEFAULT_VALUES.BALANCE;
    return (
      transactionsByDate[day].totalIncome - transactionsByDate[day].totalExpense
    );
  };

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth < NUMBER_FORMAT.MIN_MONTH) {
        newMonth = NUMBER_FORMAT.MAX_MONTH;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > NUMBER_FORMAT.MAX_MONTH) {
        newMonth = NUMBER_FORMAT.MIN_MONTH;
        newYear += 1;
      }
    }

    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod: "monthly",
        selectedMonth: newMonth,
        selectedYear: newYear,
      },
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod: "monthly",
        selectedMonth: today.getMonth() + 1,
        selectedYear: today.getFullYear(),
      },
    });
    setSelectedDate(today.getDate());
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isCurrentMonth =
    selectedMonth === today.getMonth() + 1 &&
    selectedYear === today.getFullYear();

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const income = monthTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);
    const expense = monthTransactions
      .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
      .reduce((sum, t) => sum + (t.amount || DEFAULT_VALUES.AMOUNT), DEFAULT_VALUES.BALANCE);
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [monthTransactions]);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id) => {
    setDeleteDialog({ open: true, transactionId: id });
  };

  const confirmDelete = () => {
    if (deleteDialog.transactionId) {
      dispatch({
        type: ACTION_TYPES.DELETE_TRANSACTION,
        payload: deleteDialog.transactionId,
      });
      showSuccess("Transaction deleted successfully");
      setDeleteDialog({ open: false, transactionId: null });
    }
  };

  return (
    <div className="mx-auto mb-6">
      <Card>
        <CardHeader bgColor="bg-blue-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {UI_TEXT.CALENDAR_VIEW}
              </h2>
              <p className="text-sm text-blue-100">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="bg-white text-blue-600 hover:bg-blue-50 border-white"
              >
                {UI_TEXT.TODAY}
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="text-white hover:bg-blue-600"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="text-white hover:bg-blue-600"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-1">Total Income</div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {CURRENCY_SYMBOL}
                {formatCurrency(monthlyTotals.income)}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {CURRENCY_SYMBOL}
                {formatCurrency(monthlyTotals.expense)}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Net Balance</div>
              <div
                className={`text-xl sm:text-2xl font-bold ${
                  monthlyTotals.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {CURRENCY_SYMBOL}
                {formatCurrency(Math.abs(monthlyTotals.balance))}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {/* Day Headers */}
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-700 py-2 text-sm sm:text-base"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-16 sm:h-20 md:h-28 border border-transparent rounded-lg"
                    ></div>
                  );
                }

                const dayTransactions = transactionsByDate[day];
                const hasTransactions = !!dayTransactions;
                const balance = getDayBalance(day);
                const isToday =
                  isCurrentMonth &&
                  day === today.getDate() &&
                  selectedMonth === today.getMonth() + 1 &&
                  selectedYear === today.getFullYear();
                const isSelected = selectedDate === day;

                return (
                  <div
                    key={day}
                    onClick={() =>
                      setSelectedDate(selectedDate === day ? null : day)
                    }
                    className={`
                      h-16 sm:h-20 md:h-28 border-2 rounded-lg p-1 sm:p-2 cursor-pointer transition-all touch-manipulation active:scale-95
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 active:border-gray-400 active:shadow-sm"
                      }
                      ${isToday ? "ring-2 ring-green-400 ring-offset-1" : ""}
                      ${hasTransactions ? "bg-gray-50" : "bg-white"}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <span
                          className={`text-xs sm:text-sm md:text-base font-semibold ${
                            isToday
                              ? "text-green-600"
                              : isSelected
                              ? "text-blue-600"
                              : "text-gray-800"
                          }`}
                        >
                          {day}
                        </span>
                        {hasTransactions && (
                          <span
                            className={`text-[10px] sm:text-xs font-bold ${
                              balance >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {balance >= 0 ? "+" : ""}
                            {formatCurrency(Math.abs(balance), {
                              compact: true,
                            })}
                          </span>
                        )}
                      </div>
                      {hasTransactions && (
                        <div className="flex-1 flex flex-col justify-end space-y-0.5">
                          {dayTransactions.totalIncome > 0 && (
                            <div className="text-[10px] sm:text-xs text-green-600 font-medium truncate">
                              +
                              {formatCurrency(dayTransactions.totalIncome, {
                                compact: true,
                              })}
                            </div>
                          )}
                          {dayTransactions.totalExpense > 0 && (
                            <div className="text-[10px] sm:text-xs text-red-600 font-medium truncate">
                              -
                              {formatCurrency(dayTransactions.totalExpense, {
                                compact: true,
                              })}
                            </div>
                          )}
                          <div className="text-[10px] sm:text-xs text-gray-500 font-medium">
                            {dayTransactions.income.length +
                              dayTransactions.expense.length}{" "}
                            txn
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Transactions */}
          {selectedDate && getDateTransactions(selectedDate).length > 0 && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Transactions for {selectedDate} {MONTHS[selectedMonth - 1]}{" "}
                  {selectedYear}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-600"
                >
                  {UI_TEXT.CLOSE}
                </Button>
              </div>
              <div className="space-y-3">
                {getDateTransactions(selectedDate).map((transaction) => {
                  const isIncome =
                    transaction.type === TRANSACTION_TYPES.INCOME;
                  return (
                    <div
                      key={transaction.id}
                      className={`
                        flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 rounded-lg border-l-4 shadow-sm gap-2 md:gap-4
                        ${
                          isIncome
                            ? "bg-green-50 border-green-500"
                            : "bg-red-50 border-red-500"
                        }
                      `}
                    >
                      <div className="flex-1 mb-2 sm:mb-0 min-w-0">
                        <div className="font-semibold text-sm md:text-base text-gray-800 mb-1 break-words">
                          {transaction.description || "No description"}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-600">
                          {transaction.category && (
                            <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                              {transaction.category}
                            </span>
                          )}
                          {transaction.mode && (
                            <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                              {transaction.mode}
                            </span>
                          )}
                          <span className="text-xs">
                            {formatDate(transaction.date, "short")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                          className={`
                            text-base md:text-lg font-bold whitespace-nowrap
                            ${isIncome ? "text-green-600" : "text-red-600"}
                          `}
                        >
                          {isIncome ? "+" : "-"} {CURRENCY_SYMBOL}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-500 hover:text-blue-700 active:text-blue-800 p-1.5 md:p-2 touch-manipulation"
                            title={UI_TEXT.EDIT}
                          >
                            <i className="ion-edit text-base md:text-lg"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-500 hover:text-red-700 active:text-red-800 p-1.5 md:p-2 touch-manipulation"
                            title={UI_TEXT.DELETE}
                          >
                            <i className="ion-close-round text-base md:text-lg"></i>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedDate && getDateTransactions(selectedDate).length === 0 && (
            <div className="mt-6 border-t pt-6 text-center py-8">
              <i className="ion-calendar text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-600 font-medium">
                No transactions for {selectedDate} {MONTHS[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
            </div>
          )}

          {/* No Transactions for Month */}
          {monthTransactions.length === 0 && (
            <div className="text-center py-8">
              <i className="ion-calendar text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-600 font-medium">
                No transactions for {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Add transactions to see them on the calendar
              </p>
            </div>
          )}
        </CardBody>
      </Card>

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

export default CalendarView;
