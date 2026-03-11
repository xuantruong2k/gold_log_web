# Gold Log Client - Chart & Visualization Implementation Plan

**Plan Version**: 1.0.0
**Created**: January 30, 2026
**Status**: Ready for Implementation
**Dependencies**: Transaction CRUD (plan-transactions.md) must be completed

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Chart Library Selection](#chart-library-selection)
4. [Implementation Phases](#implementation-phases)
5. [Phase 1: Chart Infrastructure](#phase-1-chart-infrastructure)
6. [Phase 2: Price Timeline Chart](#phase-2-price-timeline-chart)
7. [Phase 3: Buy/Sell Ratio Chart](#phase-3-buysell-ratio-chart)
8. [Phase 4: Monthly Transaction Volume](#phase-4-monthly-transaction-volume)
9. [Phase 5: Holdings Over Time](#phase-5-holdings-over-time)
10. [Phase 6: Average Price Trend](#phase-6-average-price-trend)
11. [Phase 7: Provider Comparison Chart](#phase-7-provider-comparison-chart)
12. [Phase 8: Dashboard Analytics Integration](#phase-8-dashboard-analytics-integration)
13. [Testing & Verification](#testing--verification)
14. [Performance Optimization](#performance-optimization)

---

## Overview

This plan implements comprehensive data visualization features for the Gold Log application. Users will be able to:

- **Visualize** gold price trends over time
- **Compare** buy and sell transactions
- **Analyze** monthly transaction volumes
- **Track** portfolio holdings evolution
- **Monitor** average price trends
- **Compare** prices across providers

### Architecture Principles

- **Lightweight Library**: Use Recharts for React-friendly charts
- **Responsive Design**: Charts adapt to screen sizes
- **Interactive**: Hover tooltips, click events, zoom/pan
- **Color Consistency**: Match app theme colors
- **Performance**: Optimize for large datasets
- **Accessibility**: ARIA labels, keyboard navigation

### Key Features

- Line charts for price trends
- Pie/donut charts for ratio analysis
- Bar charts for volume comparisons
- Area charts for cumulative holdings
- Multi-series charts for provider comparison
- Downloadable chart images
- Date range filtering for charts
- Real-time data updates

---

## Prerequisites

### Completed Work

- ✅ Transaction CRUD operations (plan-transactions.md)
- ✅ Transaction list with pagination
- ✅ Dashboard page structure
- ✅ Filter system (optional but enhances charts)

### Required Installations

Install Recharts library:

```bash
npm install recharts
npm install --save-dev @types/recharts
```

Install date utilities:

```bash
npm install date-fns
```

---

## Chart Library Selection

### Why Recharts?

**Recharts** is chosen for this project because:

1. **React-Native**: Built specifically for React with component-based API
2. **Declarative**: Easy to understand JSX-based chart definitions
3. **Customizable**: Full control over appearance
4. **Responsive**: Built-in responsiveness
5. **TypeScript**: Full TypeScript support
6. **Active**: Well-maintained with large community
7. **Lightweight**: ~150KB gzipped

### Alternative Libraries Considered

- **Chart.js**: More flexible but less React-friendly
- **Victory**: Great but heavier bundle size
- **Nivo**: Beautiful but complex API
- **visx**: Lower-level, more work to implement

---

## Implementation Phases

| Phase     | Component             | Estimated Time | Priority |
| --------- | --------------------- | -------------- | -------- |
| 1         | Chart Infrastructure  | 30 min         | P0       |
| 2         | Price Timeline Chart  | 1 hour         | P0       |
| 3         | Buy/Sell Ratio Chart  | 45 min         | P0       |
| 4         | Monthly Volume Chart  | 45 min         | P0       |
| 5         | Holdings Over Time    | 1 hour         | P1       |
| 6         | Average Price Trend   | 45 min         | P1       |
| 7         | Provider Comparison   | 1 hour         | P1       |
| 8         | Dashboard Integration | 1 hour         | P0       |
| **Total** |                       | **~7 hours**   |          |

---

## Phase 1: Chart Infrastructure

### 1.1 Create Chart Types

**File**: `src/types/chart.types.ts`

```typescript
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  date: string;
  value: number;
  buyPrice?: number;
  sellPrice?: number;
  quantity?: number;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface BarChartDataPoint {
  name: string;
  value: number;
  count?: number;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  responsive?: boolean;
}

export type ChartDateRange = '7d' | '1m' | '3m' | '6m' | '1y' | 'all';
```

### 1.2 Create Chart Utilities

**File**: `src/utils/chartUtils.ts`

```typescript
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';
import type { ChartDateRange, TimeSeriesDataPoint } from '@/types/chart.types';
import type { Transaction } from '@/types/transaction.types';
import { TransactionType } from '@/types/transaction.types';

/**
 * Get date range for chart filtering
 */
export function getChartDateRange(range: ChartDateRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  let start: Date;

  switch (range) {
    case '7d':
      start = subDays(end, 7);
      break;
    case '1m':
      start = subMonths(end, 1);
      break;
    case '3m':
      start = subMonths(end, 3);
      break;
    case '6m':
      start = subMonths(end, 6);
      break;
    case '1y':
      start = subMonths(end, 12);
      break;
    case 'all':
    default:
      start = new Date(0); // Beginning of time
      break;
  }

  return { start: startOfDay(start), end };
}

/**
 * Format currency for chart display
 */
export function formatChartCurrency(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format date for chart axis
 */
export function formatChartDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd');
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  range: ChartDateRange
): Transaction[] {
  const { start, end } = getChartDateRange(range);

  return transactions.filter((tx) => {
    const txDate = new Date(tx.transactionDate);
    return txDate >= start && txDate <= end;
  });
}

/**
 * Group transactions by month
 */
export function groupTransactionsByMonth(transactions: Transaction[]): {
  [month: string]: Transaction[];
} {
  const grouped: { [month: string]: Transaction[] } = {};

  transactions.forEach((tx) => {
    const month = format(new Date(tx.transactionDate), 'yyyy-MM');
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(tx);
  });

  return grouped;
}

/**
 * Calculate cumulative quantity over time
 */
export function calculateCumulativeHoldings(transactions: Transaction[]): TimeSeriesDataPoint[] {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  let cumulative = 0;
  return sorted.map((tx) => {
    if (tx.type === TransactionType.BUY) {
      cumulative += tx.quantity;
    } else {
      cumulative -= tx.quantity;
    }

    return {
      timestamp: new Date(tx.transactionDate).getTime(),
      date: format(new Date(tx.transactionDate), 'yyyy-MM-dd'),
      value: cumulative,
      quantity: tx.quantity,
    };
  });
}

/**
 * Download chart as PNG image
 */
export function downloadChartAsImage(chartId: string, filename: string = 'chart.png') {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) return;

  // This requires html2canvas library
  // npm install html2canvas
  // For simplicity, we'll use a basic implementation
  alert('Chart download feature requires html2canvas library. Install: npm install html2canvas');
}
```

### 1.3 Create Base Chart Container

**File**: `src/components/common/ChartContainer.tsx`

```typescript
interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  actions,
}) => {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
};
```

---

## Phase 2: Price Timeline Chart

### 2.1 Create Price Timeline Component

**File**: `src/components/features/charts/PriceTimelineChart.tsx`

```typescript
import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { ChartContainer } from '@/components/common/ChartContainer';
import { filterTransactionsByDateRange, formatChartDate, formatChartCurrency } from '@/utils/chartUtils';
import { TransactionType } from '@/types/transaction.types';
import type { ChartDateRange } from '@/types/chart.types';

export const PriceTimelineChart: React.FC = () => {
  const [dateRange, setDateRange] = useState<ChartDateRange>('3m');
  const { data } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const filtered = filterTransactionsByDateRange(data.data, dateRange);

    // Sort by date
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    // Group by date and calculate average prices
    const grouped = sorted.reduce((acc, tx) => {
      const date = formatChartDate(tx.transactionDate);
      if (!acc[date]) {
        acc[date] = { date, buyPrices: [], sellPrices: [] };
      }

      if (tx.type === TransactionType.BUY) {
        acc[date].buyPrices.push(tx.pricePerUnit);
      } else {
        acc[date].sellPrices.push(tx.pricePerUnit);
      }

      return acc;
    }, {} as Record<string, { date: string; buyPrices: number[]; sellPrices: number[] }>);

    return Object.values(grouped).map((item) => ({
      date: item.date,
      buyPrice:
        item.buyPrices.length > 0
          ? item.buyPrices.reduce((sum, p) => sum + p, 0) / item.buyPrices.length
          : null,
      sellPrice:
        item.sellPrices.length > 0
          ? item.sellPrices.reduce((sum, p) => sum + p, 0) / item.sellPrices.length
          : null,
    }));
  }, [data, dateRange]);

  const dateRangeButtons: Array<{ value: ChartDateRange; label: string }> = [
    { value: '7d', label: '7D' },
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: 'all', label: 'All' },
  ];

  return (
    <ChartContainer
      title="Gold Price Timeline"
      subtitle="Average buy and sell prices over time"
      actions={
        <div className="flex gap-1">
          {dateRangeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setDateRange(btn.value)}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                dateRange === btn.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatChartCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${formatChartCurrency(value)} VND`, '']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="buyPrice"
            stroke="#10b981"
            strokeWidth={2}
            name="Buy Price"
            dot={{ fill: '#10b981' }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="sellPrice"
            stroke="#ef4444"
            strokeWidth={2}
            name="Sell Price"
            dot={{ fill: '#ef4444' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
```

---

## Phase 3: Buy/Sell Ratio Chart

### 3.1 Create Pie Chart Component

**File**: `src/components/features/charts/BuySellRatioChart.tsx`

```typescript
import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { ChartContainer } from '@/components/common/ChartContainer';
import { TransactionType } from '@/types/transaction.types';
import { formatChartCurrency } from '@/utils/chartUtils';

export const BuySellRatioChart: React.FC = () => {
  const { data } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const summary = data.data.reduce(
      (acc, tx) => {
        if (tx.type === TransactionType.BUY) {
          acc.buyCount++;
          acc.buyAmount += tx.totalAmount;
        } else {
          acc.sellCount++;
          acc.sellAmount += tx.totalAmount;
        }
        return acc;
      },
      { buyCount: 0, buyAmount: 0, sellCount: 0, sellAmount: 0 }
    );

    return [
      {
        name: `BUY (${summary.buyCount})`,
        value: summary.buyAmount,
        count: summary.buyCount,
        color: '#10b981',
      },
      {
        name: `SELL (${summary.sellCount})`,
        value: summary.sellAmount,
        count: summary.sellCount,
        color: '#ef4444',
      },
    ];
  }, [data]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer
      title="Buy vs Sell Transactions"
      subtitle="Distribution of transaction amounts"
    >
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => formatChartCurrency(value) + ' VND'}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">Total BUY</p>
          <p className="text-2xl font-bold text-green-600">
            {formatChartCurrency(chartData[0]?.value || 0)} VND
          </p>
          <p className="text-sm text-gray-500">{chartData[0]?.count || 0} transactions</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Total SELL</p>
          <p className="text-2xl font-bold text-red-600">
            {formatChartCurrency(chartData[1]?.value || 0)} VND
          </p>
          <p className="text-sm text-gray-500">{chartData[1]?.count || 0} transactions</p>
        </div>
      </div>
    </ChartContainer>
  );
};
```

---

## Phase 4: Monthly Transaction Volume

### 4.1 Create Bar Chart Component

**File**: `src/components/features/charts/MonthlyVolumeChart.tsx`

```typescript
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { ChartContainer } from '@/components/common/ChartContainer';
import { groupTransactionsByMonth, formatChartCurrency } from '@/utils/chartUtils';
import { TransactionType } from '@/types/transaction.types';

export const MonthlyVolumeChart: React.FC = () => {
  const { data } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const grouped = groupTransactionsByMonth(data.data);

    return Object.entries(grouped)
      .map(([month, transactions]) => {
        const buyAmount = transactions
          .filter((tx) => tx.type === TransactionType.BUY)
          .reduce((sum, tx) => sum + tx.totalAmount, 0);

        const sellAmount = transactions
          .filter((tx) => tx.type === TransactionType.SELL)
          .reduce((sum, tx) => sum + tx.totalAmount, 0);

        return {
          month: format(new Date(month + '-01'), 'MMM yyyy'),
          buy: buyAmount,
          sell: sellAmount,
          net: buyAmount - sellAmount,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [data]);

  return (
    <ChartContainer
      title="Monthly Transaction Volume"
      subtitle="Buy and sell amounts per month"
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatChartCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any) => formatChartCurrency(value) + ' VND'}
          />
          <Legend />
          <Bar dataKey="buy" fill="#10b981" name="Buy Amount" />
          <Bar dataKey="sell" fill="#ef4444" name="Sell Amount" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
```

---

## Phase 5: Holdings Over Time

### 5.1 Create Area Chart Component

**File**: `src/components/features/charts/HoldingsOverTimeChart.tsx`

```typescript
import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { ChartContainer } from '@/components/common/ChartContainer';
import { calculateCumulativeHoldings, formatChartDate } from '@/utils/chartUtils';

export const HoldingsOverTimeChart: React.FC = () => {
  const { data } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const cumulativeData = calculateCumulativeHoldings(data.data);

    return cumulativeData.map((point) => ({
      date: formatChartDate(point.date),
      holdings: point.value,
    }));
  }, [data]);

  const currentHoldings = chartData[chartData.length - 1]?.holdings || 0;

  return (
    <ChartContainer
      title="Holdings Over Time"
      subtitle={`Current holdings: ${currentHoldings.toFixed(2)} chỉ`}
    >
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorHoldings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Quantity (chỉ)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${value.toFixed(2)} chỉ`, 'Holdings']}
          />
          <Area
            type="monotone"
            dataKey="holdings"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorHoldings)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
```

---

## Phase 6: Average Price Trend

### 6.1 Create Average Price Chart

**File**: `src/components/features/charts/AveragePriceTrendChart.tsx`

```typescript
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { ChartContainer } from '@/components/common/ChartContainer';
import { groupTransactionsByMonth, formatChartCurrency } from '@/utils/chartUtils';
import { format } from 'date-fns';
import { TransactionType } from '@/types/transaction.types';

export const AveragePriceTrendChart: React.FC = () => {
  const { data } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const grouped = groupTransactionsByMonth(data.data);

    return Object.entries(grouped)
      .map(([month, transactions]) => {
        const buyTransactions = transactions.filter((tx) => tx.type === TransactionType.BUY);
        const avgBuyPrice =
          buyTransactions.length > 0
            ? buyTransactions.reduce((sum, tx) => sum + tx.pricePerUnit, 0) /
              buyTransactions.length
            : 0;

        return {
          month: format(new Date(month + '-01'), 'MMM yyyy'),
          avgPrice: avgBuyPrice,
        };
      })
      .filter((item) => item.avgPrice > 0)
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
  }, [data]);

  return (
    <ChartContainer
      title="Average Buy Price Trend"
      subtitle="Monthly average gold purchase price"
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatChartCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${formatChartCurrency(value)} VND`, 'Avg Price']}
          />
          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: '#f59e0b', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
```

---

## Phase 7: Provider Comparison Chart

### 7.1 Create Provider Comparison Component

**File**: `src/components/features/charts/ProviderComparisonChart.tsx`

```typescript
import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { ChartContainer } from '@/components/common/ChartContainer';
import { formatChartCurrency } from '@/utils/chartUtils';
import { TransactionType } from '@/types/transaction.types';

export const ProviderComparisonChart: React.FC = () => {
  const { data } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const chartData = useMemo(() => {
    if (!data?.data) return [];

    const providerStats = data.data.reduce((acc, tx) => {
      const provider = tx.provider || 'Unknown';
      if (!acc[provider]) {
        acc[provider] = {
          provider,
          buyCount: 0,
          avgBuyPrice: 0,
          totalBuyAmount: 0,
        };
      }

      if (tx.type === TransactionType.BUY) {
        acc[provider].buyCount++;
        acc[provider].totalBuyAmount += tx.pricePerUnit;
      }

      return acc;
    }, {} as Record<string, { provider: string; buyCount: number; avgBuyPrice: number; totalBuyAmount: number }>);

    return Object.values(providerStats)
      .map((stats) => ({
        provider: stats.provider,
        avgPrice: stats.buyCount > 0 ? stats.totalBuyAmount / stats.buyCount : 0,
        count: stats.buyCount,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 providers
  }, [data]);

  return (
    <ChartContainer
      title="Provider Price Comparison"
      subtitle="Average buy price by provider (top 10)"
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="provider" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatChartCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any, name: string) => [
              name === 'count' ? `${value} transactions` : `${formatChartCurrency(value)} VND`,
              name === 'count' ? 'Count' : 'Avg Price',
            ]}
          />
          <Legend />
          <Bar dataKey="avgPrice" fill="#8b5cf6" name="Average Price" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
```

---

## Phase 8: Dashboard Analytics Integration

### 8.1 Create Analytics Page

**File**: `src/pages/AnalyticsPage.tsx`

```typescript
import { PriceTimelineChart } from '@/components/features/charts/PriceTimelineChart';
import { BuySellRatioChart } from '@/components/features/charts/BuySellRatioChart';
import { MonthlyVolumeChart } from '@/components/features/charts/MonthlyVolumeChart';
import { HoldingsOverTimeChart } from '@/components/features/charts/HoldingsOverTimeChart';
import { AveragePriceTrendChart } from '@/components/features/charts/AveragePriceTrendChart';
import { ProviderComparisonChart } from '@/components/features/charts/ProviderComparisonChart';

export const AnalyticsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <PriceTimelineChart />
        </div>

        <BuySellRatioChart />
        <MonthlyVolumeChart />

        <div className="lg:col-span-2">
          <HoldingsOverTimeChart />
        </div>

        <AveragePriceTrendChart />
        <ProviderComparisonChart />
      </div>
    </div>
  );
};

export default AnalyticsPage;
```

### 8.2 Update Dashboard with Mini Charts

**File**: `src/pages/DashboardPage.tsx`

Add mini chart previews:

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { BuySellRatioChart } from '@/components/features/charts/BuySellRatioChart';
import { PriceTimelineChart } from '@/components/features/charts/PriceTimelineChart';

export const DashboardPage = () => {
  const { summary, isLoading } = useDashboardSummary();

  // ... existing summary cards code ...

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary Cards */}
      {/* ... existing cards ... */}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PriceTimelineChart />
        <BuySellRatioChart />
      </div>

      {/* Link to Full Analytics */}
      <div className="text-center">
        <Link
          to={ROUTES.ANALYTICS}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View All Analytics
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
};
```

### 8.3 Add Analytics Route

**File**: `src/config/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  ANALYTICS: '/analytics', // Add this
  PROFILE: '/profile',
  OAUTH_CALLBACK: '/auth/callback/:provider',
  NOT_FOUND: '*',
} as const;
```

**File**: `src/App.tsx`

Add analytics route:

```typescript
import AnalyticsPage from './pages/AnalyticsPage';

// In the Routes section, add:
<Route
  path={ROUTES.ANALYTICS}
  element={
    <ProtectedRoute>
      <MainLayout>
        <AnalyticsPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

### 8.4 Update Navigation

**File**: `src/components/layout/Header.tsx`

Add analytics link:

```typescript
<Link to={ROUTES.ANALYTICS} className="text-gray-600 hover:text-gray-900">
  Analytics
</Link>
```

---

## Testing & Verification

### Manual Testing Checklist

1. **Price Timeline Chart**:
   - [ ] Chart renders without errors
   - [ ] Date range buttons work (7D, 1M, 3M, 6M, 1Y, All)
   - [ ] Buy and sell lines are different colors
   - [ ] Hover tooltip shows correct values
   - [ ] Responsive on mobile

2. **Buy/Sell Ratio Chart**:
   - [ ] Pie chart renders with correct percentages
   - [ ] Colors match (green for buy, red for sell)
   - [ ] Legend shows correctly
   - [ ] Summary cards show correct totals

3. **Monthly Volume Chart**:
   - [ ] Bar chart renders with correct data
   - [ ] Buy bars are green, sell bars are red
   - [ ] Months are in chronological order
   - [ ] Tooltip shows correct amounts

4. **Holdings Over Time**:
   - [ ] Area chart shows cumulative holdings
   - [ ] Current holdings displayed in subtitle
   - [ ] Gradient fill renders correctly

5. **Average Price Trend**:
   - [ ] Line chart shows monthly averages
   - [ ] Only includes buy transactions
   - [ ] Months without buys are filtered out

6. **Provider Comparison**:
   - [ ] Top 10 providers displayed
   - [ ] Sorted by transaction count
   - [ ] Average prices calculated correctly

7. **Navigation**:
   - [ ] Analytics page accessible from header
   - [ ] Dashboard mini charts link to analytics
   - [ ] All charts load without errors

---

## Performance Optimization

### 1. Memoize Chart Data

```typescript
const chartData = useMemo(() => {
  // Expensive calculation
}, [dependencies]);
```

### 2. Lazy Load Charts

```typescript
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsPage />
</Suspense>
```

### 3. Limit Data Points

For large datasets, sample or aggregate:

```typescript
function sampleData(data: any[], maxPoints: number = 100) {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}
```

### 4. Debounce Date Range Changes

```typescript
const debouncedRange = useDebounce(dateRange, 300);
```

---

## Additional Features (Optional)

### 1. Chart Export

Install html2canvas:

```bash
npm install html2canvas
```

Add export button to each chart.

### 2. Interactive Drill-Down

Click chart elements to filter transactions list.

### 3. Real-Time Updates

Use React Query's refetch interval:

```typescript
const { data } = useTransactions(undefined, {
  page: 1,
  pageSize: 1000,
  refetchInterval: 60000, // Refetch every minute
});
```

### 4. Chart Themes

Add light/dark mode support:

```typescript
const chartTheme = {
  light: { background: '#fff', text: '#000' },
  dark: { background: '#1f2937', text: '#fff' },
};
```

---

## Summary

This plan implements comprehensive data visualization:

✅ **Price Timeline**: Line chart with date range filters
✅ **Buy/Sell Ratio**: Pie chart with transaction distribution
✅ **Monthly Volume**: Bar chart comparing buy/sell amounts
✅ **Holdings Over Time**: Area chart showing cumulative quantity
✅ **Average Price Trend**: Line chart of monthly average prices
✅ **Provider Comparison**: Bar chart of top 10 providers
✅ **Dashboard Integration**: Mini charts and full analytics page

**Chart Features**:

- Responsive design
- Interactive tooltips
- Date range filtering
- Color-coded data
- Legends and labels
- Export capabilities (optional)

Estimated implementation time: **~7 hours**

---

**End of plan-chart.md**
