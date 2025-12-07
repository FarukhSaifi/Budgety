export const transactionStyles = {
  container: {
    width: "100%",
  },
  tableContainer: {
    elevation: 0,
  },
  tableHead: {
    bgcolor: "grey.50",
  },
  tableHeadCell: {
    fontWeight: 600,
  },
  tableRow: {
    "&:hover": {
      bgcolor: "action.hover",
    },
  },
  transactionCard: {
    mb: 2,
    borderRadius: 2,
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    },
  },
  transactionCardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    mb: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    mb: 1,
  },
  transactionDate: {
    mb: 2,
  },
  transactionChips: {
    display: "flex",
    gap: 1,
    mt: 1,
    flexWrap: "wrap",
  },
  transactionAmounts: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 2,
    pt: 2,
    borderTop: "1px solid",
    borderColor: "divider",
  },
  amountLabel: {
    mb: 1,
  },
  amountValue: {
    fontWeight: 600,
  },
  emptyState: {
    textAlign: "center",
    py: 8,
  },
};

