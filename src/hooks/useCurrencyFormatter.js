import { useMemo } from "react";

export const useCurrencyFormatter = () => {
  const formatCurrency = useMemo(
    () => (amount, options = {}) => {
      const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        compact = false,
        symbol = "₹",
      } = options;

      if (compact) {
        if (amount >= 1000000) {
          return `${symbol}${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
          return `${symbol}${(amount / 1000).toFixed(1)}K`;
        }
        return `${symbol}${amount.toFixed(0)}`;
      }

      return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount);
    },
    []
  );

  const formatCompactCurrency = useMemo(
    () => (amount) => {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
      }
      if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
      }
      return amount.toFixed(0);
    },
    []
  );

  return { formatCurrency, formatCompactCurrency };
};

