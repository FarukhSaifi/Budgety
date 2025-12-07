export const themeStyles = {
  card: {
    borderRadius: 2,
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
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
  widgetContent: {
    flex: 1,
    p: 3,
    pt: 3,
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
  input: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
    },
  },
  sidebar: {
    width: 72,
    height: "100vh",
    bgcolor: "background.paper",
    borderRight: "1px solid",
    borderColor: "divider",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    py: 2,
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
  },
  header: {
    bgcolor: "background.paper",
    borderBottom: "1px solid",
    borderColor: "divider",
    px: 4,
    py: 3,
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: 2,
    borderRadius: 1.5,
    bgcolor: "grey.50",
    transition: "all 0.2s",
  },
  listItemHover: {
    "&:hover": {
      bgcolor: "grey.100",
      transform: "translateY(-1px)",
      boxShadow: 1,
    },
  },
  metricCard: {
    textAlign: "left",
  },
  metricCardCenter: {
    textAlign: "center",
  },
  metricCardRight: {
    textAlign: "right",
  },
  chartContainer: {
    width: "100%",
    height: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  formFieldGroup: {
    display: "grid",
    gap: 3,
  },
  emptyState: {
    textAlign: "center",
    py: 4,
  },
};

export const spacing = {
  xs: 0.5,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};

export const borderRadius = {
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  lg: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  xl: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
};

