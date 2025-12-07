export const dashboardStyles = {
  container: {
    width: "100%",
  },
  widget: {
    borderRadius: 2,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  widgetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    px: 3,
    py: 2.5,
    borderBottom: "1px solid",
    borderColor: "divider",
  },
  widgetTitle: {
    fontWeight: 600,
    fontSize: "1rem",
    color: "text.primary",
  },
  widgetContent: {
    flex: 1,
    p: 3,
    pt: 3,
    "&:last-child": {
      pb: 3,
    },
  },
  spendingCategoryContainer: {
    display: "flex",
    gap: 4,
    alignItems: "flex-start",
    minHeight: 200,
  },
  spendingCategoryTotal: {
    flex: 1,
    textAlign: "center",
    pt: 2,
  },
  spendingCategoryList: {
    flex: 1.5,
  },
  incomeOverviewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minHeight: 200,
  },
  financialSummaryContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minHeight: 200,
  },
  financialSummaryMetrics: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 2,
  },
  financialSummaryChart: {
    height: 120,
    display: "flex",
    alignItems: "flex-end",
    gap: 1.5,
    mt: 1,
  },
  chartBar: {
    flex: 1,
    borderRadius: 1.5,
    minHeight: 20,
  },
  emptyState: {
    textAlign: "center",
    py: 4,
  },
};

