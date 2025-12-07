import {
  ACTION_TYPES,
  CURRENCY_SYMBOL,
  MONTHS,
  UI_TEXT,
  VIEW_PERIODS,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useTab } from "@context/TabContext";
import { useBudgetCalculations } from "@hooks/useBudgetCalculations";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { KeyboardArrowDown as ArrowDownIcon } from "@mui/icons-material";
import { Popover } from "@mui/material";
import { MetricCard } from "@ui/MetricCard";
import React, { useState } from "react";

const Header = () => {
  const { activeTab } = useTab();
  const { transactions, viewPeriod, selectedMonth, selectedYear, dispatch } =
    useBudget();
  const { totalIncome, totalExpense } = useBudgetCalculations(
    transactions,
    viewPeriod,
    selectedMonth,
    selectedYear
  );
  const { formatCurrency } = useCurrencyFormatter();
  const [datePickerAnchor, setDatePickerAnchor] = useState(null);
  const [tempMonth, setTempMonth] = useState(
    selectedMonth || new Date().getMonth() + 1
  );
  const [tempYear, setTempYear] = useState(
    selectedYear || new Date().getFullYear()
  );

  const getTabTitle = () => {
    const titles = {
      overview: UI_TEXT.DASHBOARD || "Dashboard",
      transactions: UI_TEXT.TRANSACTIONS,
      budgets: UI_TEXT.BUDGETS,
      bills: UI_TEXT.BILLS || "Bills",
      reports: UI_TEXT.REPORTS,
      goals: UI_TEXT.GOALS || "Goals",
    };
    return titles[activeTab] || UI_TEXT.DASHBOARD || "Dashboard";
  };

  const getDateRange = () => {
    if (viewPeriod === VIEW_PERIODS.MONTHLY && selectedMonth && selectedYear) {
      const monthName = MONTHS[selectedMonth - 1];
      return `${monthName} ${selectedYear}`;
    }
    if (viewPeriod === VIEW_PERIODS.YEARLY && selectedYear) {
      return `${selectedYear}`;
    }
    return UI_TEXT.ALL_TIME || "All Time";
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYears = () => {
    const years = [];
    const currentYear = getCurrentYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const handleDateClick = (event) => {
    setTempMonth(selectedMonth || new Date().getMonth() + 1);
    setTempYear(selectedYear || new Date().getFullYear());
    setDatePickerAnchor(event.currentTarget);
  };

  const handleDatePickerClose = () => {
    setDatePickerAnchor(null);
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setTempMonth(newMonth);
    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod: VIEW_PERIODS.MONTHLY,
        selectedMonth: newMonth,
        selectedYear: tempYear,
      },
    });
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setTempYear(newYear);
    if (viewPeriod === VIEW_PERIODS.MONTHLY) {
      dispatch({
        type: ACTION_TYPES.SET_VIEW_PERIOD,
        payload: {
          viewPeriod: VIEW_PERIODS.MONTHLY,
          selectedMonth: tempMonth,
          selectedYear: newYear,
        },
      });
    } else if (viewPeriod === VIEW_PERIODS.YEARLY) {
      dispatch({
        type: ACTION_TYPES.SET_VIEW_PERIOD,
        payload: {
          viewPeriod: VIEW_PERIODS.YEARLY,
          selectedYear: newYear,
        },
      });
    }
  };

  const handleViewPeriodChange = (e) => {
    const newViewPeriod = e.target.value;
    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod: newViewPeriod,
        selectedMonth:
          newViewPeriod === VIEW_PERIODS.MONTHLY ? tempMonth : undefined,
        selectedYear:
          newViewPeriod === VIEW_PERIODS.YEARLY ||
          newViewPeriod === VIEW_PERIODS.MONTHLY
            ? tempYear
            : undefined,
      },
    });
  };

  const openDatePicker = Boolean(datePickerAnchor);

  const metrics = [
    {
      label: UI_TEXT.TOTAL_INCOME,
      value: formatCurrency(totalIncome),
      subValue: `${CURRENCY_SYMBOL}${formatCurrency(totalIncome)}`,
    },
    {
      label: UI_TEXT.TOTAL_EXPENSES,
      value: formatCurrency(totalExpense),
      subValue: `${CURRENCY_SYMBOL}${formatCurrency(totalExpense)}`,
    },
  ];

  return (
    <div className="border-b border-gray-200 bg-white px-2 py-2 md:px-4 md:py-4">
      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:gap-0 md:items-center">
        <div className="w-full md:w-auto">
          <h1 className="mb-1 md:mb-2 text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
            {getTabTitle()}
          </h1>
          <button
            onClick={handleDateClick}
            className="flex items-center gap-1 md:gap-2 hover:bg-gray-50 rounded-md px-2 py-1 transition-colors cursor-pointer"
          >
            <span className="text-xs md:text-sm text-gray-600 font-medium">
              {getDateRange()}
            </span>
            <ArrowDownIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
          </button>
        </div>

        <div className="flex w-full items-center justify-between gap-2 md:w-auto md:gap-4 lg:gap-8">
          {metrics.map((metric, index) => (
            <React.Fragment key={metric.label}>
              <div className="flex-1 md:flex-none">
              <MetricCard
                value={metric.value}
                subValue={metric.subValue}
                label={metric.label}
                size="large"
                align="right"
              />
              </div>
              {index < metrics.length - 1 && (
                <div className="hidden h-[70px] w-px self-stretch bg-gray-200 md:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Date Picker Popover */}
      <Popover
        open={openDatePicker}
        anchorEl={datePickerAnchor}
        onClose={handleDatePickerClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          className: "mt-2 rounded-lg shadow-lg",
        }}
      >
        <div className="p-4 min-w-[280px]">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Select Period
          </h3>
          <div className="space-y-4">
            {/* View Period Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                View Period
              </label>
              <select
                value={viewPeriod}
                onChange={handleViewPeriodChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value={VIEW_PERIODS.ALL}>All Time</option>
                <option value={VIEW_PERIODS.YEARLY}>Yearly</option>
                <option value={VIEW_PERIODS.MONTHLY}>Monthly</option>
              </select>
            </div>

            {/* Month Selector (only for monthly view) */}
            {viewPeriod === VIEW_PERIODS.MONTHLY && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={tempMonth}
                  onChange={handleMonthChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {MONTHS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year Selector (for monthly and yearly views) */}
            {(viewPeriod === VIEW_PERIODS.MONTHLY ||
              viewPeriod === VIEW_PERIODS.YEARLY) && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={tempYear}
                  onChange={handleYearChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {getYears().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleDatePickerClose}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </Popover>
    </div>
  );
};

export default Header;
