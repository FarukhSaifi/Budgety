import { CURRENCY_SYMBOL, CURRENCY_THRESHOLDS, NUMBER_FORMAT } from "@constants";
import { useMemo } from "react";

export interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
  symbol?: string;
}

export interface CurrencyFormatter {
  formatCurrency: (amount: number, options?: CurrencyFormatOptions) => string;
  formatCompactCurrency: (amount: number) => string;
  formatCurrencyForChart: (value: number) => string;
}

/**
 * Currency formatting hook (₹, en-IN). Reused across every feature so the
 * currency symbol / decimals live in one place (@constants).
 */
export const useCurrencyFormatter = (): CurrencyFormatter => {
  const formatCurrency = useMemo(
    () =>
      (amount: number, options: CurrencyFormatOptions = {}): string => {
        const {
          minimumFractionDigits = NUMBER_FORMAT.DECIMAL_PLACES,
          maximumFractionDigits = NUMBER_FORMAT.DECIMAL_PLACES,
          compact = false,
          symbol = CURRENCY_SYMBOL,
        } = options;

        const value = Number.isFinite(amount) ? amount : 0;

        if (compact) {
          if (Math.abs(value) >= CURRENCY_THRESHOLDS.MILLION) {
            return `${symbol}${(value / CURRENCY_THRESHOLDS.MILLION).toFixed(1)}M`;
          }
          if (Math.abs(value) >= CURRENCY_THRESHOLDS.THOUSAND) {
            return `${symbol}${(value / CURRENCY_THRESHOLDS.THOUSAND).toFixed(1)}K`;
          }
          return `${symbol}${value.toFixed(0)}`;
        }

        return new Intl.NumberFormat("en-IN", {
          minimumFractionDigits,
          maximumFractionDigits,
        }).format(value);
      },
    [],
  );

  const formatCompactCurrency = useMemo(
    () =>
      (amount: number): string => {
        const value = Number.isFinite(amount) ? amount : 0;
        if (Math.abs(value) >= CURRENCY_THRESHOLDS.MILLION) {
          return `${(value / CURRENCY_THRESHOLDS.MILLION).toFixed(1)}M`;
        }
        if (Math.abs(value) >= CURRENCY_THRESHOLDS.THOUSAND) {
          return `${(value / CURRENCY_THRESHOLDS.THOUSAND).toFixed(1)}K`;
        }
        return value.toFixed(0);
      },
    [],
  );

  const formatCurrencyForChart = useMemo(
    () =>
      (value: number): string =>
        `${CURRENCY_SYMBOL}${formatCurrency(value, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`,
    [formatCurrency],
  );

  return { formatCurrency, formatCompactCurrency, formatCurrencyForChart };
};
