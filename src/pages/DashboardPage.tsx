import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';

export const DashboardPage = () => {
  const { summary, isLoading, priceData, priceError } = useDashboardSummary();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  const getPLColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPLSign = (amount: number) => {
    return amount > 0 ? '+' : '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Row 1: Basic Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Current Holdings</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {summary.currentHoldings.toFixed(2)} chỉ
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Invested</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(summary.totalInvested)} VND
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Buy Price</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(summary.averageBuyPrice)} VND
          </p>
        </div>

        {/* Row 2: Portfolio Value & P&L */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Current Portfolio Value</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(summary.currentPortfolioValue)} VND
          </p>
          {priceData ? (
            <p className="mt-1 text-xs text-gray-500">
              @ {formatCurrency(priceData.sellPrice)} VND/chỉ (SJC)
            </p>
          ) : priceError ? (
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ Price unavailable - using historical data
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              Loading current price...
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Unrealized P&L</h3>
          <p className={`mt-2 text-3xl font-bold ${getPLColor(summary.unrealizedPL)}`}>
            {getPLSign(summary.unrealizedPL)}{formatCurrency(Math.abs(summary.unrealizedPL))} VND
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {priceError ? 'Based on historical data' : 'From current holdings'}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total P&L</h3>
          <p className={`mt-2 text-3xl font-bold ${getPLColor(summary.totalPL)}`}>
            {getPLSign(summary.totalPL)}{formatCurrency(Math.abs(summary.totalPL))} VND
          </p>
          <p className={`mt-1 text-sm font-semibold ${getPLColor(summary.plPercentage)}`}>
            {getPLSign(summary.plPercentage)}{summary.plPercentage.toFixed(2)}%
          </p>
        </div>

        {/* Row 3: Additional Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Sold</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(summary.totalSold)} VND
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {summary.soldQuantity.toFixed(2)} chỉ sold
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Realized P&L</h3>
          <p className={`mt-2 text-3xl font-bold ${getPLColor(summary.realizedPL)}`}>
            {getPLSign(summary.realizedPL)}{formatCurrency(Math.abs(summary.realizedPL))} VND
          </p>
          <p className="mt-1 text-xs text-gray-500">
            From sold transactions
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.transactionCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            to={ROUTES.TRANSACTIONS}
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            View All Transactions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
