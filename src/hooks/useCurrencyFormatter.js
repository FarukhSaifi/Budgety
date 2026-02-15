import {
  CURRENCY_SYMBOL,
  CURRENCY_THRESHOLDS,
  NUMBER_FORMAT,
} from "@constants";
import { useMemo } from "react";

export const useCurrencyFormatter = () => {
  const formatCurrency = useMemo(
    () =>
      (amount, options = {}) => {
        const {
          minimumFractionDigits = NUMBER_FORMAT.DECIMAL_PLACES,
          maximumFractionDigits = NUMBER_FORMAT.DECIMAL_PLACES,
          compact = false,
          symbol = CURRENCY_SYMBOL,
        } = options;

        if (compact) {
          if (amount >= CURRENCY_THRESHOLDS.MILLION) {
            return `${symbol}${(amount / CURRENCY_THRESHOLDS.MILLION).toFixed(
              1,
            )}M`;
          }
          if (amount >= CURRENCY_THRESHOLDS.THOUSAND) {
            return `${symbol}${(amount / CURRENCY_THRESHOLDS.THOUSAND).toFixed(
              1,
            )}K`;
          }
          return `${symbol}${amount.toFixed(0)}`;
        }

        return new Intl.NumberFormat("en-IN", {
          minimumFractionDigits,
          maximumFractionDigits,
        }).format(amount);
      },
    [],
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
    [],
  );

  /** For charts/tooltips: symbol + integer amount (no decimals). */
  const formatCurrencyForChart = useMemo(
    () => (value) =>
      `${CURRENCY_SYMBOL}${formatCurrency(value, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
    [formatCurrency],
  );

  return { formatCurrency, formatCompactCurrency, formatCurrencyForChart };
};
