import {
  ACTION_TYPES,
  MONTHS,
  UI_TEXT,
  VIEW_PERIODS,
  VIEW_PERIOD_LABELS,
  VIEW_TYPES,
  VIEW_TYPE_LABELS,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import {
  CalendarMonth,
  Close as CloseIcon,
  List as ListIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { Button } from "@ui/Button";
import { EnhancedCard } from "@ui/EnhancedCard";
import { FormField, FormFieldGroup } from "@ui/FormField";
import { SearchableCategorySelect } from "@ui/SearchableCategorySelect";
import { useMemo } from "react";

const ViewControls = () => {
  const {
    viewPeriod,
    selectedMonth,
    selectedYear,
    viewType,
    selectedCategory,
    searchQuery,
    transactions,
    dispatch,
  } = useBudget();

  // Get all unique categories from transactions
  const allCategories = useMemo(() => {
    const categories = new Set();
    transactions.forEach((t) => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories).sort();
  }, [transactions]);

  const handleViewPeriodChange = (e) => {
    const newViewPeriod = e.target.value;
    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod: newViewPeriod,
        selectedMonth:
          newViewPeriod === VIEW_PERIODS.MONTHLY ? selectedMonth : undefined,
        selectedYear:
          newViewPeriod === VIEW_PERIODS.YEARLY ||
          newViewPeriod === VIEW_PERIODS.MONTHLY
            ? selectedYear
            : undefined,
      },
    });
  };

  const handleMonthChange = (e) => {
    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod,
        selectedMonth: parseInt(e.target.value),
        selectedYear,
      },
    });
  };

  const handleYearChange = (e) => {
    dispatch({
      type: ACTION_TYPES.SET_VIEW_PERIOD,
      payload: {
        viewPeriod,
        selectedMonth,
        selectedYear: parseInt(e.target.value),
      },
    });
  };

  const handleViewTypeChange = (newViewType) => {
    dispatch({
      type: ACTION_TYPES.SET_VIEW_TYPE,
      payload: newViewType,
    });
  };

  const handleCategoryChange = (e) => {
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_CATEGORY,
      payload: e.target.value,
    });
  };

  const handleClearCategory = () => {
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_CATEGORY,
      payload: "",
    });
  };

  const handleSearchChange = (e) => {
    dispatch({
      type: ACTION_TYPES.SET_SEARCH_QUERY,
      payload: e.target.value,
    });
  };

  const handleClearSearch = () => {
    dispatch({
      type: ACTION_TYPES.SET_SEARCH_QUERY,
      payload: "",
    });
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

  return (
    <div className="mb-2 md:mb-4">
      <EnhancedCard
        title="View Controls"
        subtitle="Filter transactions by period"
      >
        {/* Search Bar */}
        <div className="mb-2 md:mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {UI_TEXT.SEARCH_LABEL}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
                className="block w-full pl-10 pr-10 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  title={UI_TEXT.CLEAR_SEARCH}
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="flex-shrink-0 touch-manipulation whitespace-nowrap"
              >
                {UI_TEXT.CLEAR_SEARCH}
              </Button>
            )}
          </div>
        </div>

        {/* View Type Toggle and Category Filter - Side by Side */}
        <div className="mb-2 md:mb-4">
          <div className="flex flex-col lg:flex-row gap-2 md:gap-4 lg:items-start">
            {/* View Type Toggle */}
            <div className="flex-1 lg:flex-initial">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleViewTypeChange(VIEW_TYPES.LIST)}
                  className={`flex-1 sm:flex-initial flex justify-center items-center gap-2 py-2.5 sm:py-2 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 touch-manipulation ${
                    viewType === VIEW_TYPES.LIST
                      ? "bg-blue-600 text-white border-2 border-blue-600 shadow-sm"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                  }`}
                >
                  <ListIcon className="text-base sm:text-lg" />
                  <span>{VIEW_TYPE_LABELS[VIEW_TYPES.LIST]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewTypeChange(VIEW_TYPES.CALENDAR)}
                  className={`flex-1 sm:flex-initial flex justify-center items-center gap-2 py-2.5 sm:py-2 px-4 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 touch-manipulation ${
                    viewType === VIEW_TYPES.CALENDAR
                      ? "bg-blue-600 text-white border-2 border-blue-600 shadow-sm"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100"
                  }`}
                >
                  <CalendarMonth className="text-base sm:text-lg" />
                  <span>{VIEW_TYPE_LABELS[VIEW_TYPES.CALENDAR]}</span>
                </button>
              </div>
            </div>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="flex-1 lg:flex-initial lg:min-w-[280px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {UI_TEXT.FILTER_BY_CATEGORY}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 min-w-0">
                    <SearchableCategorySelect
                      label=""
                      name="category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      options={[
                        { value: "", label: UI_TEXT.ALL_CATEGORIES },
                        ...allCategories.map((cat) => ({
                          value: cat,
                          label: cat,
                        })),
                      ]}
                      placeholder="Search or select category..."
                    />
                  </div>
                  {selectedCategory && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearCategory}
                      className="flex-shrink-0 touch-manipulation whitespace-nowrap"
                    >
                      {UI_TEXT.CLEAR_FILTER}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <FormFieldGroup
          columns={viewPeriod === VIEW_PERIODS.MONTHLY ? 3 : 2}
          spacing={3}
        >
          <FormField
            label="View Period"
            value={viewPeriod}
            onChange={handleViewPeriodChange}
            type="select"
            options={Object.values(VIEW_PERIODS).map((period) => ({
              value: period,
              label: VIEW_PERIOD_LABELS[period],
            }))}
          />
          {viewPeriod === VIEW_PERIODS.MONTHLY && (
            <>
              <FormField
                label="Month"
                value={selectedMonth}
                onChange={handleMonthChange}
                type="select"
                options={MONTHS.map((month, index) => ({
                  value: index + 1,
                  label: month,
                }))}
              />
              <FormField
                label="Year"
                value={selectedYear}
                onChange={handleYearChange}
                type="select"
                options={getYears().map((year) => ({
                  value: year,
                  label: year.toString(),
                }))}
              />
            </>
          )}
          {viewPeriod === VIEW_PERIODS.YEARLY && (
            <FormField
              label="Year"
              value={selectedYear}
              onChange={handleYearChange}
              type="select"
              options={getYears().map((year) => ({
                value: year,
                label: year.toString(),
              }))}
            />
          )}
        </FormFieldGroup>
      </EnhancedCard>
    </div>
  );
};

export default ViewControls;
