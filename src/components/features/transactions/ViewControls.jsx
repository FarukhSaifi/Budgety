import {
  ACTION_TYPES,
  MONTHS,
  UI_TEXT,
  VIEW_CONTROL_CONFIG,
  VIEW_CONTROL_VARIANTS,
  VIEW_PERIODS,
  VIEW_PERIOD_LABELS,
  VIEW_TYPES,
  VIEW_TYPE_LABELS,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useTab } from "@context/TabContext";
import {
  CalendarMonth,
  Close as CloseIcon,
  List as ListIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { Button } from "@ui/Button";
import { EnhancedCard } from "@ui/EnhancedCard";
import { FormField, FormFieldGroup } from "@ui/FormField";
import { SearchableCategorySelect } from "@ui/SearchableCategorySelect";
import { getCurrentMonthYear } from "@utils/dateUtils";
import { useMemo } from "react";

const VIEW_CONTROL_SUBTITLES = {
  [VIEW_CONTROL_VARIANTS.TRANSACTIONS]:
    UI_TEXT.VIEW_CONTROLS_SUBTITLE_TRANSACTIONS,
  [VIEW_CONTROL_VARIANTS.BUDGETS]: UI_TEXT.VIEW_CONTROLS_SUBTITLE_BUDGETS,
  [VIEW_CONTROL_VARIANTS.BILLS]: UI_TEXT.VIEW_CONTROLS_SUBTITLE_BILLS,
  [VIEW_CONTROL_VARIANTS.REPORTS]: UI_TEXT.VIEW_CONTROLS_SUBTITLE_REPORTS,
};

const DEFAULT_CONFIG = {
  showSearch: false,
  showViewType: false,
  showCategoryFilter: false,
  showPeriodFilter: true,
};

const ViewControls = ({
  variant: variantProp,
  showImportPanel = false,
  onImportClick,
}) => {
  const { activeTab } = useTab();
  const variant =
    variantProp ?? activeTab ?? VIEW_CONTROL_VARIANTS.TRANSACTIONS;
  const config = VIEW_CONTROL_CONFIG[variant] ?? DEFAULT_CONFIG;
  const isTransactions = variant === VIEW_CONTROL_VARIANTS.TRANSACTIONS;
  const showImportButton =
    isTransactions && typeof onImportClick === "function";

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

  const allCategories = useMemo(() => {
    if (!config.showCategoryFilter) return [];
    const categories = new Set();
    transactions.forEach((t) => {
      if (t.category) categories.add(t.category);
    });
    return Array.from(categories).sort();
  }, [transactions, config.showCategoryFilter]);

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

  const getCurrentYear = () => getCurrentMonthYear().year;
  const getYears = () => {
    const years = [];
    const currentYear = getCurrentYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const subtitle =
    VIEW_CONTROL_SUBTITLES[variant] ??
    UI_TEXT.VIEW_CONTROLS_SUBTITLE_TRANSACTIONS;
  const hasAnyFilter =
    config.showSearch ||
    config.showViewType ||
    config.showCategoryFilter ||
    config.showPeriodFilter ||
    showImportButton;

  if (!hasAnyFilter) return null;

  return (
    <div className="mb-2 sm:mb-4">
      <EnhancedCard title={UI_TEXT.VIEW_CONTROLS_TITLE} subtitle={subtitle}>
        {showImportButton && (
          <div className="mb-3 sm:mb-4">
            <Button
              type="button"
              variant={showImportPanel ? "primary" : "outline"}
              size="md"
              onClick={onImportClick}
              className="min-h-11 gap-2 touch-manipulation"
              icon={<UploadIcon className="shrink-0 size-5 sm:size-6" />}
            >
              {showImportPanel
                ? UI_TEXT.HIDE_IMPORT
                : UI_TEXT.IMPORT_BANK_STATEMENT}
            </Button>
          </div>
        )}
        {config.showSearch && (
          <div className="mb-3 sm:mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              {UI_TEXT.SEARCH_LABEL}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <div className="relative min-w-0 flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <SearchIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
                  className="block w-full min-h-11 pl-10 pr-10 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label={UI_TEXT.SEARCH_LABEL}
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600 min-h-0 py-0 min-w-9"
                    title={UI_TEXT.CLEAR_SEARCH}
                    aria-label={UI_TEXT.CLEAR_SEARCH}
                  >
                    <CloseIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="shrink-0 touch-manipulation whitespace-nowrap min-h-11 sm:min-h-0 w-full sm:w-auto"
                >
                  {UI_TEXT.CLEAR_SEARCH}
                </Button>
              )}
            </div>
          </div>
        )}

        {(config.showViewType || config.showCategoryFilter) && (
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start">
              {config.showViewType && (
                <div className="w-full min-w-0 lg:flex-initial">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    {UI_TEXT.VIEW_TYPE_LABEL}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        viewType === VIEW_TYPES.LIST ? "primary" : "outline"
                      }
                      size="md"
                      onClick={() => handleViewTypeChange(VIEW_TYPES.LIST)}
                      className="flex-1 sm:flex-initial min-h-11 gap-1.5 sm:gap-2 py-2.5 sm:py-2 touch-manipulation"
                    >
                      <ListIcon className="shrink-0 size-5 sm:size-6" />
                      <span className="truncate">
                        {VIEW_TYPE_LABELS[VIEW_TYPES.LIST]}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={
                        viewType === VIEW_TYPES.CALENDAR ? "primary" : "outline"
                      }
                      size="md"
                      onClick={() => handleViewTypeChange(VIEW_TYPES.CALENDAR)}
                      className="flex-1 sm:flex-initial min-h-11 gap-1.5 sm:gap-2 py-2.5 sm:py-2 touch-manipulation"
                    >
                      <CalendarMonth className="shrink-0 size-5 sm:size-6" />
                      <span className="truncate">
                        {VIEW_TYPE_LABELS[VIEW_TYPES.CALENDAR]}
                      </span>
                    </Button>
                  </div>
                </div>
              )}

              {config.showCategoryFilter && allCategories.length > 0 && (
                <div className="w-full min-w-0 lg:flex-initial lg:min-w-[280px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    {UI_TEXT.FILTER_BY_CATEGORY}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
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
                        placeholder={UI_TEXT.SEARCH_OR_SELECT_CATEGORY}
                      />
                    </div>
                    {selectedCategory && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearCategory}
                        className="shrink-0 touch-manipulation whitespace-nowrap min-h-11 sm:min-h-0 w-full sm:w-auto"
                      >
                        {UI_TEXT.CLEAR_FILTER}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {config.showPeriodFilter && (
          <FormFieldGroup
            columns={viewPeriod === VIEW_PERIODS.MONTHLY ? 3 : 2}
            spacing={3}
            className="gap-2 sm:gap-3"
          >
            <FormField
              label={UI_TEXT.VIEW_PERIOD_LABEL}
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
                  label={UI_TEXT.SELECT_MONTH}
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  type="select"
                  options={MONTHS.map((month, index) => ({
                    value: index + 1,
                    label: month,
                  }))}
                />
                <FormField
                  label={UI_TEXT.SELECT_YEAR}
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
                label={UI_TEXT.SELECT_YEAR}
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
        )}
      </EnhancedCard>
    </div>
  );
};

export default ViewControls;
