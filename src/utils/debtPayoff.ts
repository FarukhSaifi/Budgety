import type { Debt, DebtStrategy } from "@/types";

/**
 * Sort debts by payoff strategy:
 * - Snowball: lowest balance first (psychological wins)
 * - Avalanche: highest interest rate first (mathematically optimal)
 */
export function sortDebts(debts: Debt[], strategy: DebtStrategy): Debt[] {
  return [...debts].sort((a, b) =>
    strategy === "snowball" ? a.balance - b.balance : b.interestRate - a.interestRate,
  );
}

/**
 * Estimate how many months to pay off all debts using minimum payments plus
 * an optional extra monthly payment (applied via the debt-roll/cascade method).
 *
 * When a debt is paid off its freed minimum rolls into the extra pool and is
 * applied to the next priority debt, amplifying pay-down speed over time.
 *
 * Returns `Infinity` if the minimum payments cannot cover accruing interest on
 * any debt, or if payoff exceeds a 50-year horizon.
 */
export function estimateMonthsToPayoff(
  debts: Debt[],
  strategy: DebtStrategy,
  extraPayment = 0,
): number {
  if (debts.length === 0) return 0;

  const sorted = sortDebts(debts, strategy);
  const balances = sorted.map((d) => Math.max(0, d.balance));
  const rates = sorted.map((d) => d.interestRate / 100 / 12);
  const mins = sorted.map((d) => Math.max(0, d.minimumPayment));

  const MAX_MONTHS = 600;
  let extraPool = extraPayment;
  let month = 0;

  while (month < MAX_MONTHS) {
    if (balances.every((b) => b < 0.01)) break;

    month++;

    // Accrue monthly interest on all active debts
    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0) balances[i] += balances[i] * rates[i];
    }

    // Priority debt: first index still carrying a balance
    const priority = balances.findIndex((b) => b >= 0.01);

    for (let i = 0; i < balances.length; i++) {
      if (balances[i] < 0.01) {
        balances[i] = 0;
        continue;
      }

      const pay = mins[i] + (i === priority ? extraPool : 0);

      // Safety: if payment cannot cover interest the debt will never be paid
      if (i === priority && rates[i] > 0 && pay <= balances[i] * rates[i]) {
        return Infinity;
      }

      if (pay >= balances[i]) {
        // Paid off — cascade freed minimum into extra pool
        if (i === priority) extraPool += mins[i];
        balances[i] = 0;
      } else {
        balances[i] -= pay;
      }
    }
  }

  return balances.some((b) => b >= 0.01) ? Infinity : month;
}

/**
 * Return the projected debt-free calendar date given a number of months,
 * or `null` when the estimate is infinite.
 */
export function debtFreeDate(months: number): Date | null {
  if (!Number.isFinite(months)) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + Math.ceil(months));
  return d;
}

/** Format the debt-free date as a human-readable string (e.g. "Mar 2028"). */
export function formatDebtFreeDate(months: number): string {
  const date = debtFreeDate(months);
  if (!date) return "Never (payments don't cover interest)";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
