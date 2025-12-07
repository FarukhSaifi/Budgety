export const uiStyles = {
  metricCard: {
    textAlign: "left",
  },
  metricCardCenter: {
    textAlign: "center",
  },
  metricCardRight: {
    textAlign: "right",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: 2,
    borderRadius: 1.5,
    bgcolor: "grey.50",
    cursor: "default",
    transition: "all 0.2s",
  },
  listItemClickable: {
    cursor: "pointer",
    "&:hover": {
      bgcolor: "grey.100",
      transform: "translateY(-1px)",
      boxShadow: 1,
    },
  },
  listItemContent: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  listItemText: {
    flex: 1,
    minWidth: 0,
  },
  listItemActions: {
    display: "flex",
    alignItems: "center",
    gap: 1,
    ml: 2,
  },
  listItemGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
  },
  chartContainer: {
    width: "100%",
    height: 300,
    minHeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  },
  widgetActions: {
    display: "flex",
    gap: 0.5,
  },
  widgetIconButton: {
    width: 32,
    height: 32,
    color: "text.secondary",
  },
  widgetContent: {
    flex: 1,
    p: 3,
    "&:last-child": {
      pb: 3,
    },
  },
  enhancedCard: {
    borderRadius: 2,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
  },
  enhancedCardHeader: {
    px: 3,
    py: 2,
  },
  enhancedCardHeaderGradient: {
    color: "white",
  },
  enhancedCardHeaderNormal: {
    borderBottom: "1px solid",
    borderColor: "divider",
  },
  enhancedCardContent: {
    p: 3,
    "&:last-child": {
      pb: 3,
    },
  },
  button: {
    textTransform: "none",
    borderRadius: 2,
    padding: "8px 16px",
    fontWeight: 500,
  },
  chip: {
    height: 24,
    fontSize: "0.75rem",
  },
};

