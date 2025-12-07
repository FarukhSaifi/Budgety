import { CURRENCY_SYMBOL } from "@constants";
import { useCurrencyFormatter } from "@hooks/useCurrencyFormatter";
import { AccountBalance, TrendingDown, TrendingUp } from "@mui/icons-material";
import { MetricCard } from "@ui/MetricCard";
import { Widget } from "@ui/Widget";

const SummaryCards = ({ totalIncome, totalExpense, balance }) => {
  const { formatCurrency } = useCurrencyFormatter();

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 mb-2 md:mb-4">
      {/* Total Balance Card */}
      <Widget title="Total Balance">
        <MetricCard
          value={`${CURRENCY_SYMBOL}${formatCurrency(balance)}`}
          label="Available Balance"
          icon={AccountBalance}
          color={balance >= 0 ? "text-green-600" : "text-red-600"}
          size="large"
          align="center"
        />
      </Widget>

      {/* Total Income Card */}
      <Widget title="Total Income">
        <MetricCard
          value={`${CURRENCY_SYMBOL}${formatCurrency(totalIncome)}`}
          label="This Period"
          icon={TrendingUp}
          color="text-green-600"
          size="large"
          align="center"
        />
      </Widget>

      {/* Total Expenses Card */}
      <Widget title="Total Expenses">
        <MetricCard
          value={`${CURRENCY_SYMBOL}${formatCurrency(totalExpense)}`}
          label="This Period"
          icon={TrendingDown}
          color="text-red-600"
          size="large"
          align="center"
        />
      </Widget>
    </div>
  );
};

export default SummaryCards;
