import { CURRENCY_THRESHOLDS } from "@constants";
import { useMemo } from "react";

export const useCurrencyFormatter = () => {
  const formatCurrency = useMemo(
    () =>
      (amount, options = {}) => {
        const {
          minimumFractionDigits = 2,
          maximumFractionDigits = 2,
          compact = false,
          symbol = "₹",
        } = options;

        if (compact) {
          if (amount >= CURRENCY_THRESHOLDS.MILLION) {
            return `${symbol}${(amount / CURRENCY_THRESHOLDS.MILLION).toFixed(
              1
            )}M`;
          }
          if (amount >= CURRENCY_THRESHOLDS.THOUSAND) {
            return `${symbol}${(amount / CURRENCY_THRESHOLDS.THOUSAND).toFixed(
              1
            )}K`;
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
      if (amount >= CURRENCY_THRESHOLDS.MILLION) {
        return `${(amount / CURRENCY_THRESHOLDS.MILLION).toFixed(1)}M`;
      }
      if (amount >= CURRENCY_THRESHOLDS.THOUSAND) {
        return `${(amount / CURRENCY_THRESHOLDS.THOUSAND).toFixed(1)}K`;
      }
      return amount.toFixed(0);
    },
    []
  );

  return { formatCurrency, formatCompactCurrency };
};
