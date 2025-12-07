import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  DATE_CONSTANTS,
  MONTHS,
  NUMBER_FORMAT,
  RECURRENCE_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Button } from "@ui/Button";
import { Card, CardBody, CardHeader } from "@ui/Card";
import { showSuccess } from "@utils/toast";
import { useCallback, useMemo, useState } from "react";

const PaymentsCalendarView = () => {
  const {
    billReminders,
    recurringTransactions,
    selectedMonth,
    selectedYear,
    dispatch,
  } = useBudget();
  const [selectedDate, setSelectedDate] = useState(null);
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();

  // Helper function to calculate days until due
  const getDaysUntilDue = useCallback((dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / DATE_CONSTANTS.MILLISECONDS_PER_DAY);
  }, []);

  // Get bills for the selected month/year
  const monthBills = useMemo(() => {
    return billReminders.filter((bill) => {
      if (!bill.dueDate) return false;
      const date = new Date(bill.dueDate);
      return (
        date.getMonth() + 1 === selectedMonth &&
        date.getFullYear() === selectedYear
      );
    });
  }, [billReminders, selectedMonth, selectedYear]);

  // Get recurring transactions that should appear in this month
  const monthRecurring = useMemo(() => {
    return recurringTransactions.filter((recurring) => {
      if (!recurring.startDate) return false;
      if (!recurring.isActive) return false;

      const startDate = new Date(recurring.startDate);
      const startMonth = startDate.getMonth() + 1;
      const startYear = startDate.getFullYear();

      // Check if recurring transaction has started
      if (selectedYear < startYear) return false;
      if (selectedYear === startYear && selectedMonth < startMonth)
        return false;

      // Check if recurring transaction has ended
      if (recurring.endDate) {
        const endDate = new Date(recurring.endDate);
        const endMonth = endDate.getMonth() + 1;
        const endYear = endDate.getFullYear();
        if (selectedYear > endYear) return false;
        if (selectedYear === endYear && selectedMonth > endMonth) return false;
      }

      // Check recurrence pattern
      if (recurring.recurrence === RECURRENCE_TYPES.MONTHLY) {
        return true; // Monthly appears every month
      }
      if (recurring.recurrence === RECURRENCE_TYPES.YEARLY) {
        return startMonth === selectedMonth; // Yearly appears in same month
      }
      if (recurring.recurrence === RECURRENCE_TYPES.WEEKLY) {
        // Weekly - check if any week falls in this month
        return true; // Simplified - show all weekly
      }
      if (recurring.recurrence === RECURRENCE_TYPES.DAILY) {
        return true; // Daily appears every day
      }

      return false;
    });
  }, [recurringTransactions, selectedMonth, selectedYear]);

  // Group payments by date
  const paymentsByDate = useMemo(() => {
    const grouped = {};

    // Add bills
    monthBills.forEach((bill) => {
      const date = new Date(bill.dueDate);
      const dateKey = date.getDate();
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          bills: [],
          recurring: [],
          totalAmount: 0,
          overdueCount: 0,
          upcomingCount: 0,
        };
      }
      grouped[dateKey].bills.push(bill);
      grouped[dateKey].totalAmount += bill.amount || 0;

      const daysUntilDue = getDaysUntilDue(bill.dueDate);
      if (daysUntilDue < 0) {
        grouped[dateKey].overdueCount++;
      } else if (
        daysUntilDue <=
        (bill.reminderDays || DATE_CONSTANTS.DEFAULT_REMINDER_DAYS)
      ) {
        grouped[dateKey].upcomingCount++;
      }
    });

    // Add recurring transactions (simplified - show on 1st of month for monthly)
    monthRecurring.forEach((recurring) => {
      const dateKey =
        recurring.recurrence === RECURRENCE_TYPES.MONTHLY
          ? 1
          : new Date(recurring.startDate).getDate();
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          bills: [],
          recurring: [],
          totalAmount: 0,
          overdueCount: 0,
          upcomingCount: 0,
        };
      }
      grouped[dateKey].recurring.push(recurring);
      grouped[dateKey].totalAmount += recurring.amount || 0;
    });

    return grouped;
  }, [monthBills, monthRecurring, getDaysUntilDue]);

  // Get calendar days for the selected month
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const month = selectedMonth - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [selectedMonth, selectedYear]);

  const getDatePayments = (day) => {
    if (!day || !paymentsByDate[day]) return { bills: [], recurring: [] };
    return paymentsByDate[day];
  };

  const navigateMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === "prev") {
      newMonth -= 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 12) {
        newMonth = 1;
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

  const handleMarkPaid = (billId) => {
    dispatch({ type: ACTION_TYPES.MARK_BILL_PAID, payload: billId });
    showSuccess("Bill marked as paid");
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const isCurrentMonth =
    selectedMonth === today.getMonth() + 1 &&
    selectedYear === today.getFullYear();

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    const billsTotal = monthBills
      .filter((bill) => !bill.isPaid)
      .reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const recurringTotal = monthRecurring.reduce(
      (sum, rec) => sum + (rec.amount || 0),
      0
    );
    const overdueTotal = monthBills
      .filter((bill) => {
        if (bill.isPaid) return false;
        return getDaysUntilDue(bill.dueDate) < 0;
      })
      .reduce((sum, bill) => sum + (bill.amount || 0), 0);

    return {
      total: billsTotal + recurringTotal,
      bills: billsTotal,
      recurring: recurringTotal,
      overdue: overdueTotal,
    };
  }, [monthBills, monthRecurring, getDaysUntilDue]);

  return (
    <div className="mx-auto mb-2 md:mb-4">
      <Card>
        <CardHeader bgColor="bg-orange-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {UI_TEXT.PAYMENTS_CALENDAR}
              </h2>
              <p className="text-sm text-orange-100">
                {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="bg-white text-orange-600 hover:bg-orange-50 border-white"
              >
                {UI_TEXT.TODAY}
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="text-white hover:bg-orange-600"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="text-white hover:bg-orange-600"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 mb-2 md:mb-4">
            <div className="bg-orange-50 p-2 md:p-4 rounded-lg border border-orange-200">
              <div className="text-xs md:text-sm text-gray-600 mb-1">
                {UI_TEXT.TOTAL_PAYMENTS}
              </div>
              <div className="text-base md:text-xl lg:text-2xl font-bold text-orange-600">
                {CURRENCY_SYMBOL}
                {formatCurrency(monthlyTotals.total, {
                  minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                  maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                })}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-gray-600 mb-1">
                {UI_TEXT.OVERDUE}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {CURRENCY_SYMBOL}
                {formatCurrency(monthlyTotals.overdue, {
                  minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                  maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                })}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-gray-600 mb-1">{UI_TEXT.BILLS}</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {CURRENCY_SYMBOL}
                {formatCurrency(monthlyTotals.bills, {
                  minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                  maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                })}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">
                {UI_TEXT.RECURRING}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {CURRENCY_SYMBOL}
                {formatCurrency(monthlyTotals.recurring, {
                  minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                  maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                })}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-700 py-2 text-sm sm:text-base"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-24 sm:h-32 border border-transparent rounded-lg"
                    ></div>
                  );
                }

                const dayPayments = paymentsByDate[day];
                const hasPayments = !!dayPayments;
                const isToday =
                  isCurrentMonth &&
                  day === today.getDate() &&
                  selectedMonth === today.getMonth() + 1 &&
                  selectedYear === today.getFullYear();
                const isSelected = selectedDate === day;

                // Determine cell color based on payment status
                let cellBgColor = "bg-white";
                let borderColor = "border-gray-200";
                if (hasPayments) {
                  if (dayPayments.overdueCount > 0) {
                    cellBgColor = "bg-red-50";
                    borderColor = "border-red-300";
                  } else if (dayPayments.upcomingCount > 0) {
                    cellBgColor = "bg-yellow-50";
                    borderColor = "border-yellow-300";
                  } else {
                    cellBgColor = "bg-orange-50";
                    borderColor = "border-orange-200";
                  }
                }

                return (
                  <div
                    key={day}
                    onClick={() =>
                      setSelectedDate(selectedDate === day ? null : day)
                    }
                    className={`
                      h-24 sm:h-32 border-2 rounded-lg p-1 sm:p-2 cursor-pointer transition-all
                      ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : borderColor
                      }
                      ${isToday ? "ring-2 ring-green-400 ring-offset-1" : ""}
                      ${cellBgColor}
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-sm sm:text-base font-semibold ${
                            isToday
                              ? "text-green-600"
                              : isSelected
                              ? "text-blue-600"
                              : "text-gray-800"
                          }`}
                        >
                          {day}
                        </span>
                        {hasPayments && (
                          <span className="text-xs font-bold text-orange-600">
                            {formatCurrency(dayPayments.totalAmount, {
                              compact: true,
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        )}
                      </div>
                      {hasPayments && (
                        <div className="flex-1 flex flex-col justify-end space-y-0.5">
                          {dayPayments.overdueCount > 0 && (
                            <div className="text-xs text-red-600 font-medium truncate">
                              ⚠️ {dayPayments.overdueCount} overdue
                            </div>
                          )}
                          {dayPayments.upcomingCount > 0 && (
                            <div className="text-xs text-yellow-600 font-medium truncate">
                              ⏰ {dayPayments.upcomingCount} due soon
                            </div>
                          )}
                          {dayPayments.bills.length > 0 && (
                            <div className="text-xs text-gray-600 font-medium">
                              {dayPayments.bills.length} bill
                              {dayPayments.bills.length > 1 ? "s" : ""}
                            </div>
                          )}
                          {dayPayments.recurring.length > 0 && (
                            <div className="text-xs text-blue-600 font-medium">
                              {dayPayments.recurring.length} recurring
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Payments */}
          {selectedDate && getDatePayments(selectedDate).bills.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg sm:text-xl font-semibold text-gray-800">
                  {UI_TEXT.PAYMENTS_FOR} {selectedDate}{" "}
                  {MONTHS[selectedMonth - 1]} {selectedYear}
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
                {/* Bills */}
                {getDatePayments(selectedDate).bills.map((bill) => {
                  const daysUntilDue = getDaysUntilDue(bill.dueDate);
                  const isOverdue = daysUntilDue < 0;
                  const isDueSoon =
                    daysUntilDue >= 0 &&
                    daysUntilDue <=
                      (bill.reminderDays ||
                        DATE_CONSTANTS.DEFAULT_REMINDER_DAYS);

                  return (
                    <div
                      key={bill.id}
                      className={`
                        flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-lg border-l-4 shadow-sm
                        ${
                          bill.isPaid
                            ? "bg-gray-50 border-gray-400 opacity-60"
                            : isOverdue
                            ? "bg-red-50 border-red-500"
                            : isDueSoon
                            ? "bg-yellow-50 border-yellow-500"
                            : "bg-orange-50 border-orange-500"
                        }
                      `}
                    >
                      <div className="flex-1 mb-2 sm:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">
                            {bill.name}
                          </span>
                          {bill.isPaid && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              {UI_TEXT.PAID}
                            </span>
                          )}
                          {!bill.isPaid && isOverdue && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              {UI_TEXT.OVERDUE}
                            </span>
                          )}
                          {!bill.isPaid && isDueSoon && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              {UI_TEXT.DUE_SOON}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          {bill.category && (
                            <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                              {bill.category}
                            </span>
                          )}
                          <span className="text-xs">
                            {UI_TEXT.DUE} {formatDate(bill.dueDate, "short")}
                          </span>
                          {!bill.isPaid && (
                            <span className="text-xs">
                              {isOverdue
                                ? `${Math.abs(daysUntilDue)} ${
                                    UI_TEXT.DAYS_OVERDUE
                                  }`
                                : `${daysUntilDue} ${UI_TEXT.DAYS_LEFT}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`
                            text-lg sm:text-xl font-bold whitespace-nowrap
                            ${bill.isPaid ? "text-gray-500" : "text-orange-600"}
                          `}
                        >
                          {CURRENCY_SYMBOL}
                          {formatCurrency(bill.amount, {
                            minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                            maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                          })}
                        </div>
                        {!bill.isPaid && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleMarkPaid(bill.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {UI_TEXT.MARK_AS_PAID}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Recurring Transactions */}
                {getDatePayments(selectedDate).recurring.map((recurring) => (
                  <div
                    key={recurring.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 shadow-sm"
                  >
                    <div className="flex-1 mb-2 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {recurring.description || UI_TEXT.RECURRING_PAYMENT}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {recurring.recurrence}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        {recurring.category && (
                          <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                            {recurring.category}
                          </span>
                        )}
                        <span className="text-xs">
                          {recurring.type === "expense" ? "Expense" : "Income"}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`
                        text-lg sm:text-xl font-bold whitespace-nowrap
                        ${
                          recurring.type === "expense"
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      `}
                    >
                      {recurring.type === "expense" ? "-" : "+"}{" "}
                      {CURRENCY_SYMBOL}
                      {formatCurrency(recurring.amount, {
                        minimumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                        maximumFractionDigits: NUMBER_FORMAT.DECIMAL_PLACES,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedDate &&
            getDatePayments(selectedDate).bills.length === 0 &&
            getDatePayments(selectedDate).recurring.length === 0 && (
              <div className="mt-6 border-t pt-6 text-center py-8">
                <i className="ion-calendar text-4xl text-gray-400 mb-3"></i>
                <p className="text-gray-600 font-medium">
                  No payments for {selectedDate} {MONTHS[selectedMonth - 1]}{" "}
                  {selectedYear}
                </p>
              </div>
            )}

          {/* No Payments for Month */}
          {monthBills.length === 0 && monthRecurring.length === 0 && (
            <div className="text-center py-8">
              <i className="ion-calendar text-4xl text-gray-400 mb-3"></i>
              <p className="text-gray-600 font-medium">
                {UI_TEXT.NO_PAYMENTS_FOR} {MONTHS[selectedMonth - 1]}{" "}
                {selectedYear}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {UI_TEXT.ADD_BILLS_TO_CALENDAR}
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentsCalendarView;
