import {
  CURRENCY_SYMBOL,
  DISPLAY_LIMITS,
  TRANSACTION_MODES,
  TRANSACTION_TYPES,
  UI_TEXT,
} from "@constants";
import { useBudget } from "@context/BudgetContext";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { useDateFormatter } from "@hooks/useDateFormatter";
import { ListItem, ListItemGroup } from "@ui/ListItem";
import { Widget } from "@ui/Widget";
import { filterTransactionsBySearch } from "@utils/searchUtils";
import React, { useState } from "react";
import EditTransactionModal from "./EditTransactionModal";

const RecentTransactions = ({
  transactions,
  limit = DISPLAY_LIMITS.PREVIEW_ITEMS,
}) => {
  const { searchQuery } = useBudget();
  const { formatCurrency } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  // Truncate long text
  const truncateText = (
    text,
    maxLength = DISPLAY_LIMITS.DESCRIPTION_LENGTH
  ) => {
    if (!text) return "No description";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Get payment mode tag color
  const getPaymentModeTag = (mode) => {
    if (!mode) return null;

    const modeColors = {
      [TRANSACTION_MODES.UPI]: {
        label: "UPI",
        color: "primary",
        variant: "filled",
      },
      [TRANSACTION_MODES.CARD]: {
        label: "Card",
        color: "primary",
        variant: "filled",
      },
      [TRANSACTION_MODES.CASH]: {
        label: "Cash",
        color: "default",
        variant: "filled",
      },
      [TRANSACTION_MODES.NET_BANKING]: {
        label: "Net Banking",
        color: "primary",
        variant: "filled",
      },
      [TRANSACTION_MODES.WALLET]: {
        label: "Wallet",
        color: "primary",
        variant: "filled",
      },
      [TRANSACTION_MODES.NEFT]: {
        label: "NEFT",
        color: "default",
        variant: "filled",
      },
      [TRANSACTION_MODES.IMPS]: {
        label: "IMPS",
        color: "default",
        variant: "filled",
      },
      [TRANSACTION_MODES.RTGS]: {
        label: "RTGS",
        color: "default",
        variant: "filled",
      },
      [TRANSACTION_MODES.BANK_TRANSFER]: {
        label: "Bank Transfer",
        color: "default",
        variant: "filled",
      },
    };

    const tagConfig = modeColors[mode] || {
      label: mode,
      color: "default",
      variant: "filled",
    };

    return {
      label: tagConfig.label,
      variant: tagConfig.variant,
      color: tagConfig.color,
    };
  };

  // Get recent transactions sorted by date (newest first) and apply search filter
  const recentTransactions = React.useMemo(() => {
    let filtered = transactions;

    // Apply search filter if search query exists
    if (searchQuery && searchQuery.trim() !== "") {
      filtered = filterTransactionsBySearch(filtered, searchQuery);
    }

    return [...filtered]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return dateB - dateA;
      })
      .slice(0, limit);
  }, [transactions, limit, searchQuery]);

  if (recentTransactions.length === 0) {
    return (
      <Widget title={UI_TEXT.RECENT_TRANSACTIONS}>
        <div className="py-8 text-center">
          <p className="text-sm text-gray-600">{UI_TEXT.NO_TRANSACTIONS}</p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget title={UI_TEXT.RECENT_TRANSACTIONS}>
      <ListItemGroup spacing="gap-2 md:gap-4">
        {recentTransactions.map((transaction) => {
          const isIncome = transaction.type === TRANSACTION_TYPES.INCOME;
          const amountColor = isIncome ? "text-green-600" : "text-red-600";
          const amountPrefix = isIncome ? "+" : "-";
          const truncatedDescription = truncateText(
            transaction.description,
            DISPLAY_LIMITS.DESCRIPTION_LENGTH
          );
          const paymentModeTag = getPaymentModeTag(transaction.mode);
          const chips = [];

          // Add payment mode tag
          if (paymentModeTag) {
            chips.push(paymentModeTag);
          }

          // Add category as a chip if available
          if (transaction.category) {
            chips.push({
              label: transaction.category,
              variant: "outlined",
              color: "default",
            });
          }

          const amount = Number(transaction.amount) || 0;
          const formattedAmount = formatCurrency(Math.abs(amount), {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          });

          return (
            <ListItem
              key={transaction.id}
              primary={
                <span
                  className="block truncate"
                  title={transaction.description || "No description"}
                >
                  {truncatedDescription}
                </span>
              }
              secondary={formatDate(transaction.date, "short")}
              chips={chips}
              endIcon={
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <span
                    className={`font-semibold text-sm whitespace-nowrap ${amountColor}`}
                  >
                    {amountPrefix}
                    {CURRENCY_SYMBOL}
                    {formattedAmount}
                  </span>
                </div>
              }
              onClick={() => handleEdit(transaction)}
              className="touch-manipulation"
            />
          );
        })}
      </ListItemGroup>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        transaction={editingTransaction}
      />
    </Widget>
  );
};

export default RecentTransactions;
