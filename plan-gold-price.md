# Gold Price Feature Implementation Plan

**Version**: 1.0.0
**Created**: January 31, 2026
**Status**: Planning
**Priority**: P1 (High Priority)
**Dependencies**: [plan-init-codebase.md](./plan-init-codebase.md) must be completed first

---

## Prerequisites

**⚠️ IMPORTANT**: This plan assumes the following infrastructure is already in place:

✅ **Completed from plan-init-codebase.md**:

- Project initialized with Vite + React + TypeScript
- TailwindCSS configured and working
- ESLint, Prettier, and Husky set up
- Directory structure created (`src/api/`, `src/types/`, `src/hooks/`, etc.)
- Axios client configured (`src/api/client.ts`)
- React Query client set up (`src/api/queryClient.ts`)
- Type transformers pattern established (`src/api/transformers.ts`)
- API types pattern established (`src/api/types.ts`)
- Routing configured with React Router
- `MainLayout` component exists
- Testing infrastructure (Vitest) configured
- Base types defined (`common.types.ts`, `user.types.ts`, `transaction.types.ts`)

✅ **Project Status**:

- Development server running at `http://localhost:3000`
- All tests passing
- TypeScript strict mode enabled
- Production build working

If any of the above are not complete, refer to [plan-init-codebase.md](./plan-init-codebase.md) first.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [Architecture Design](#architecture-design)
5. [Implementation Steps](#implementation-steps)
6. [UI/UX Design](#uiux-design)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)
9. [Future Enhancements](#future-enhancements)

---

## Overview

### Feature Description

Implement real-time gold price display from multiple providers (SJC, PNJ, SBJ, WORLD_GOLD) to help users:

- View current buy/sell prices from different providers
- Compare prices across providers
- Make informed transaction decisions
- See price trends and updates

### Business Value

- **User Benefit**: Users can see current market prices before creating transactions
- **Decision Support**: Price comparison helps users choose the best provider
- **Market Awareness**: Real-time prices keep users informed about gold market trends
- **Transaction Context**: Display relevant prices when creating transactions

### Current State

According to API documentation:

- ✅ Backend API endpoints are available
- ⚠️ Phase 1: Returns mock data for client integration
- 🔮 Phase 2: Real provider integration (future)

### Success Criteria

- [ ] Display current prices from all providers
- [ ] Show price updates with timestamps
- [ ] Allow filtering/searching by provider
- [ ] Display prices in appropriate units (CHI, LUONG, OZ)
- [ ] Handle loading and error states gracefully
- [ ] Auto-refresh prices at configurable intervals
- [ ] Responsive design for mobile and desktop

---

## API Endpoints

### 1. Get All Current Prices

**Endpoint**: `GET /api/v1/prices/current`

**Authentication**: None (public endpoint)

**Response Structure**:

```typescript
interface AllPricesResponse {
  timestamp: string; // ISO 8601
  providers: CurrentPrice[];
}

interface CurrentPrice {
  provider: 'SJC' | 'PNJ' | 'SBJ' | 'WORLD_GOLD';
  buy_price: number;
  sell_price: number;
  unit: 'CHI' | 'LUONG' | 'OZ';
  unit_display_name: string;
  currency: 'VND' | 'USD';
  updated_at: string; // ISO 8601
}
```

**Example Response**:

```json
{
  "timestamp": "2026-01-31T14:30:00Z",
  "providers": [
    {
      "provider": "SJC",
      "buy_price": 7450000,
      "sell_price": 7500000,
      "unit": "CHI",
      "unit_display_name": "Chỉ",
      "currency": "VND",
      "updated_at": "2026-01-31T14:25:00Z"
    }
  ]
}
```

### 2. Get Price by Provider

**Endpoint**: `GET /api/v1/prices/provider/{providerName}`

**Authentication**: None (public endpoint)

**Path Parameters**:

- `providerName`: `SJC` | `PNJ` | `SBJ` | `WORLD_GOLD` (case-sensitive)

**Response Structure**:

```typescript
interface CurrentPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}
```

**Error Response** (404):

```json
{
  "error": "PROVIDER_NOT_FOUND",
  "message": "Provider 'UNKNOWN' not found",
  "timestamp": "2026-01-31T14:30:00Z"
}
```

---

## Data Models

### Frontend Type Definitions

**File**: `src/types/price.types.ts`

```typescript
/**
 * Gold price provider names
 */
export enum GoldProvider {
  SJC = 'SJC',
  PNJ = 'PNJ',
  SBJ = 'SBJ',
  WORLD_GOLD = 'WORLD_GOLD',
}

/**
 * Current gold price from a provider (domain model)
 */
export interface GoldPrice {
  provider: GoldProvider;
  buyPrice: number;
  sellPrice: number;
  unit: GoldUnit;
  unitDisplayName: string;
  currency: string;
  updatedAt: string;
  spread?: number; // Calculated: sellPrice - buyPrice
  spreadPercentage?: number; // Calculated: (spread / buyPrice) * 100
}

/**
 * Response containing all current prices
 */
export interface AllPricesResponse {
  timestamp: string;
  prices: GoldPrice[];
}

/**
 * Price comparison data
 */
export interface PriceComparison {
  unit: GoldUnit;
  currency: string;
  lowestBuyPrice: GoldPrice;
  highestBuyPrice: GoldPrice;
  lowestSellPrice: GoldPrice;
  highestSellPrice: GoldPrice;
  averageBuyPrice: number;
  averageSellPrice: number;
}
```

### API Type Definitions

**File**: `src/api/types.ts` (additions)

```typescript
/**
 * API response for current price (snake_case from backend)
 */
export interface ApiCurrentPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}

/**
 * API response for all current prices
 */
export interface ApiAllPricesResponse {
  timestamp: string;
  providers: ApiCurrentPrice[];
}
```

### Transformers

**File**: `src/api/transformers.ts` (additions)

```typescript
import { GoldPrice, AllPricesResponse } from '@/types/price.types';
import { GoldProvider, GoldUnit } from '@/types';

/**
 * Transform API price to domain price model
 */
export function apiPriceToGoldPrice(apiPrice: ApiCurrentPrice): GoldPrice {
  const spread = apiPrice.sell_price - apiPrice.buy_price;
  const spreadPercentage = (spread / apiPrice.buy_price) * 100;

  return {
    provider: apiPrice.provider as GoldProvider,
    buyPrice: apiPrice.buy_price,
    sellPrice: apiPrice.sell_price,
    unit: apiPrice.unit as GoldUnit,
    unitDisplayName: apiPrice.unit_display_name,
    currency: apiPrice.currency,
    updatedAt: apiPrice.updated_at,
    spread,
    spreadPercentage,
  };
}

/**
 * Transform API all prices response to domain model
 */
export function apiAllPricesToAllPricesResponse(
  apiResponse: ApiAllPricesResponse
): AllPricesResponse {
  return {
    timestamp: apiResponse.timestamp,
    prices: apiResponse.providers.map(apiPriceToGoldPrice),
  };
}
```

---

## Architecture Design

### Component Hierarchy

```
GoldPricesPage
├── PageHeader
│   ├── Title: "Gold Prices"
│   ├── RefreshButton
│   └── LastUpdated
├── PriceFilters (optional)
│   ├── ProviderFilter
│   └── UnitFilter
├── PriceComparison (summary card)
│   ├── BestBuyPrice
│   ├── BestSellPrice
│   └── AveragePrices
└── PriceList
    ├── PriceCard (SJC)
    ├── PriceCard (PNJ)
    ├── PriceCard (SBJ)
    └── PriceCard (WORLD_GOLD)
```

### State Management

#### React Query for Server State

```typescript
// src/hooks/useGoldPrices.ts
import { useQuery } from '@tanstack/react-query';
import { priceApi } from '@/api/price.api';

/**
 * Fetch all current gold prices
 */
export function useGoldPrices(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['goldPrices', 'current'],
    queryFn: () => priceApi.getAllCurrentPrices(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: options?.refetchInterval || 60 * 1000, // 1 minute default
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch price from specific provider
 */
export function useProviderPrice(provider: GoldProvider) {
  return useQuery({
    queryKey: ['goldPrices', 'provider', provider],
    queryFn: () => priceApi.getProviderPrice(provider),
    staleTime: 30 * 1000,
    enabled: !!provider,
  });
}
```

#### Local UI State

```typescript
// Component-level state for filtering, sorting
const [selectedProvider, setSelectedProvider] = useState<GoldProvider | null>(null);
const [sortBy, setSortBy] = useState<'provider' | 'buyPrice' | 'sellPrice'>('provider');
```

### API Client

**File**: `src/api/price.api.ts`

```typescript
import { apiClient } from './client';
import { apiAllPricesToAllPricesResponse, apiPriceToGoldPrice } from './transformers';
import type { AllPricesResponse, GoldPrice } from '@/types/price.types';
import type { ApiAllPricesResponse, ApiCurrentPrice } from './types';
import { GoldProvider } from '@/types';

export const priceApi = {
  /**
   * Get all current prices from all providers
   */
  async getAllCurrentPrices(): Promise<AllPricesResponse> {
    const response = await apiClient.get<ApiAllPricesResponse>('/prices/current');
    return apiAllPricesToAllPricesResponse(response.data);
  },

  /**
   * Get current price from specific provider
   */
  async getProviderPrice(provider: GoldProvider): Promise<GoldPrice> {
    const response = await apiClient.get<ApiCurrentPrice>(`/prices/provider/${provider}`);
    return apiPriceToGoldPrice(response.data);
  },
};
```

---

## Implementation Steps

### Phase 1: Foundation (Day 1)

**Goal**: Set up price-specific data layer building on existing infrastructure

**Note**: This phase assumes `src/api/client.ts`, `src/api/queryClient.ts`, and the transformers pattern are already established from plan-init-codebase.md.

#### Step 1.1: Create Price Type Definitions

**File**: `src/types/price.types.ts` (NEW FILE)

- [ ] Create new file `src/types/price.types.ts`
- [ ] Define `GoldProvider` enum
- [ ] Define `GoldPrice` interface (domain model, camelCase)
- [ ] Define `AllPricesResponse` interface
- [ ] Export types from `src/types/index.ts` (add to existing exports)

**Note**: Follow the same pattern as existing `transaction.types.ts` - domain types use camelCase.

#### Step 1.2: Extend API Layer

**Additions to existing files**:

- [ ] Add `ApiCurrentPrice` and `ApiAllPricesResponse` to **existing** `src/api/types.ts`
- [ ] Add `apiPriceToGoldPrice()` and `apiAllPricesToAllPricesResponse()` to **existing** `src/api/transformers.ts`
- [ ] Create **new** `src/api/price.api.ts` with API client functions (uses existing `apiClient` from `client.ts`)
- [ ] Write unit tests for new transformers in `src/api/transformers.test.ts`

**Note**: Reuse existing `apiClient` instance - do NOT create a new axios instance.

#### Step 1.3: Create Custom Hooks

**File**: `src/hooks/useGoldPrices.ts` (NEW FILE)

- [ ] Create new file `src/hooks/useGoldPrices.ts`
- [ ] Implement `useGoldPrices()` hook using React Query (uses existing `queryClient`)
- [ ] Implement `useProviderPrice()` hook
- [ ] Configure auto-refresh with `refetchInterval`
- [ ] Add proper TypeScript types for all hooks

**Note**: Follow the pattern from existing `useTransactions.ts` hook.

**Deliverable**: Working API integration with typed responses, building on existing API infrastructure

---

### Phase 2: Core UI Components (Day 2)

**Goal**: Build price-specific UI components

**Note**: This phase assumes `MainLayout`, `Header`, and common components exist from plan-init-codebase.md. We're only creating price-specific components.

#### Step 2.1: Price Card Component

**File**: `src/components/features/prices/PriceCard.tsx`

```typescript
interface PriceCardProps {
  price: GoldPrice;
  onSelect?: () => void;
}

export const PriceCard: React.FC<PriceCardProps> = ({ price, onSelect }) => {
  const isInternational = price.provider === GoldProvider.WORLD_GOLD;

  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all">
      {/* Provider Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {price.provider}
        </h3>
        <span className="text-xs text-gray-500">
          {formatRelativeTime(price.updatedAt)}
        </span>
      </div>

      {/* Price Display */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-600">Buy</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(price.buyPrice, price.currency)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Sell</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(price.sellPrice, price.currency)}
          </p>
        </div>
      </div>

      {/* Unit and Spread */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>per {price.unitDisplayName}</span>
        <span>Spread: {formatCurrency(price.spread!, price.currency)}</span>
      </div>

      {/* Action Button (optional) */}
      {onSelect && (
        <button
          onClick={onSelect}
          className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Use This Price
        </button>
      )}
    </div>
  );
};
```

#### Step 2.2: Price Comparison Component

**File**: `src/components/features/prices/PriceComparison.tsx`

```typescript
interface PriceComparisonProps {
  prices: GoldPrice[];
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({ prices }) => {
  // Group by unit
  const vndPrices = prices.filter(p => p.currency === 'VND');
  const usdPrices = prices.filter(p => p.currency === 'USD');

  const bestVndBuy = vndPrices.reduce((prev, curr) =>
    curr.buyPrice < prev.buyPrice ? curr : prev
  );

  const bestVndSell = vndPrices.reduce((prev, curr) =>
    curr.sellPrice > prev.sellPrice ? curr : prev
  );

  return (
    <div className="rounded-lg bg-blue-50 p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Best Prices (VND)
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md bg-white p-3">
          <p className="text-sm text-gray-600 mb-1">Best Buy Price</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(bestVndBuy.buyPrice, 'VND')}
          </p>
          <p className="text-xs text-gray-500 mt-1">{bestVndBuy.provider}</p>
        </div>
        <div className="rounded-md bg-white p-3">
          <p className="text-sm text-gray-600 mb-1">Best Sell Price</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(bestVndSell.sellPrice, 'VND')}
          </p>
          <p className="text-xs text-gray-500 mt-1">{bestVndSell.provider}</p>
        </div>
      </div>
    </div>
  );
};
```

#### Step 2.3: Price List Component

**File**: `src/components/features/prices/PriceList.tsx`

```typescript
interface PriceListProps {
  prices: GoldPrice[];
  onSelectPrice?: (price: GoldPrice) => void;
}

export const PriceList: React.FC<PriceListProps> = ({ prices, onSelectPrice }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {prices.map((price) => (
        <PriceCard
          key={price.provider}
          price={price}
          onSelect={() => onSelectPrice?.(price)}
        />
      ))}
    </div>
  );
};
```

**Tasks**:

- [ ] Create PriceCard component with styling
- [ ] Create PriceComparison component
- [ ] Create PriceList component with grid layout
- [ ] Add loading skeleton components
- [ ] Add error state component

**Deliverable**: Reusable price display components

---

### Phase 3: Page Implementation (Day 3)

**Goal**: Build complete Gold Prices page using existing layout and routing

**Note**: This phase assumes:

- `MainLayout` component exists (from plan-init-codebase.md)
- `src/config/routes.ts` exists with route constants
- `src/App.tsx` has routing configured with React Router
- Header/Footer components exist

#### Step 3.1: Gold Prices Page

**File**: `src/pages/GoldPricesPage.tsx`

```typescript
export const GoldPricesPage: React.FC = () => {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useGoldPrices({
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load gold prices"
        onRetry={handleRefresh}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gold Prices</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {formatRelativeTime(data!.timestamp)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <RefreshIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Price Comparison */}
      <PriceComparison prices={data!.prices} />

      {/* Price List */}
      <PriceList prices={data!.prices} />

      {/* Info Notice */}
      <div className="mt-6 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
        <p>
          ℹ️ Prices are indicative and may vary. Please verify with providers
          before making transactions.
        </p>
      </div>
    </div>
  );
};
```

#### Step 3.2: Add Route to Existing Configuration

**⚠️ MODIFY EXISTING FILE**: `src/config/routes.ts`

Add to existing ROUTES object:

```typescript
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  PROFILE: '/profile',
  OAUTH_CALLBACK: '/auth/callback/:provider',
  GOLD_PRICES: '/prices', // ← ADD THIS LINE
  NOT_FOUND: '*',
} as const;
```

**⚠️ MODIFY EXISTING FILE**: `src/App.tsx`

Add route to existing Routes component:

```typescript
// Add this route alongside existing routes
<Route
  path={ROUTES.GOLD_PRICES}
  element={
    <MainLayout>
      <GoldPricesPage />
    </MainLayout>
  }
/>
```

**Note**: Do NOT replace the entire App.tsx - only add the new route.

#### Step 3.3: Add Navigation Link to Existing Header

**⚠️ MODIFY EXISTING FILE**: `src/components/layout/Header.tsx`

Add navigation link to existing header navigation:

```typescript
// Add alongside existing navigation links (Dashboard, Transactions, Profile)
<Link
  to={ROUTES.GOLD_PRICES}
  className="text-gray-700 hover:text-blue-600"
>
  Prices
</Link>
```

**Note**: The Header component already exists from plan-init-codebase.md. Just add the new link.

**Tasks**:

- [ ] Create GoldPricesPage with full layout
- [ ] Add loading states
- [ ] Add error handling with retry
- [ ] Add auto-refresh functionality
- [ ] Add route configuration
- [ ] Add navigation link to header

**Deliverable**: Fully functional Gold Prices page

---

### Phase 4: Enhanced Features (Day 4)

**Goal**: Add advanced features and polish

#### Step 4.1: Price Alerts (Optional)

```typescript
interface PriceAlertProps {
  targetPrice: number;
  currentPrice: number;
  provider: GoldProvider;
}

export const PriceAlert: React.FC<PriceAlertProps> = ({
  targetPrice,
  currentPrice,
  provider,
}) => {
  const isAboveTarget = currentPrice >= targetPrice;

  return (
    <div className={`rounded-md p-3 ${isAboveTarget ? 'bg-green-50' : 'bg-gray-50'}`}>
      <p className="text-sm font-medium">
        {isAboveTarget ? '✅' : '⏳'} Target: {formatCurrency(targetPrice, 'VND')}
      </p>
      <p className="text-xs text-gray-600">
        Current: {formatCurrency(currentPrice, 'VND')} ({provider})
      </p>
    </div>
  );
};
```

#### Step 4.2: Price History Chart (Future)

Placeholder for future implementation:

- Line chart showing price trends over time
- Select time range (1 day, 1 week, 1 month)
- Compare multiple providers

#### Step 4.3: Transaction Integration

Add "Quick Buy" button in PriceCard that pre-fills transaction form:

```typescript
const handleQuickBuy = (price: GoldPrice) => {
  navigate(ROUTES.TRANSACTIONS, {
    state: {
      prefill: {
        type: TransactionType.BUY,
        unit: price.unit,
        pricePerUnit: price.sellPrice,
        provider: price.provider,
        currency: price.currency,
      },
    },
  });
};
```

**Tasks**:

- [ ] Add quick actions to PriceCard
- [ ] Implement "Use This Price" button
- [ ] Navigate to transaction form with prefilled data
- [ ] Add price comparison tooltip
- [ ] Add responsive design for mobile

**Deliverable**: Enhanced user experience with transaction integration

---

### Phase 5: Testing & Polish (Day 5)

**Goal**: Ensure quality and performance

**Note**: Testing infrastructure (Vitest, Testing Library, test utilities) is already configured from plan-init-codebase.md. We only need to write tests for new price features.

#### Step 5.1: Unit Tests

**⚠️ ADD TO EXISTING FILE**: `src/api/transformers.test.ts`

Add new test suite for price transformers:

```typescript
describe('apiPriceToGoldPrice', () => {
  it('should transform API price to domain price', () => {
    const apiPrice: ApiCurrentPrice = {
      provider: 'SJC',
      buy_price: 7450000,
      sell_price: 7500000,
      unit: 'CHI',
      unit_display_name: 'Chỉ',
      currency: 'VND',
      updated_at: '2026-01-31T14:25:00Z',
    };

    const result = apiPriceToGoldPrice(apiPrice);

    expect(result.provider).toBe(GoldProvider.SJC);
    expect(result.buyPrice).toBe(7450000);
    expect(result.sellPrice).toBe(7500000);
    expect(result.spread).toBe(50000);
    expect(result.spreadPercentage).toBeCloseTo(0.67, 2);
  });
});
```

#### Step 5.2: Component Tests

```typescript
describe('PriceCard', () => {
  it('should render price information', () => {
    const price: GoldPrice = {
      provider: GoldProvider.SJC,
      buyPrice: 7450000,
      sellPrice: 7500000,
      unit: GoldUnit.CHI,
      unitDisplayName: 'Chỉ',
      currency: 'VND',
      updatedAt: '2026-01-31T14:25:00Z',
      spread: 50000,
      spreadPercentage: 0.67,
    };

    render(<PriceCard price={price} />);

    expect(screen.getByText('SJC')).toBeInTheDocument();
    expect(screen.getByText(/7,450,000/)).toBeInTheDocument();
    expect(screen.getByText(/7,500,000/)).toBeInTheDocument();
  });
});
```

#### Step 5.3: Integration Tests

```typescript
describe('GoldPricesPage', () => {
  it('should fetch and display prices', async () => {
    render(<GoldPricesPage />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText('SJC')).toBeInTheDocument();
      expect(screen.getByText('PNJ')).toBeInTheDocument();
    });
  });

  it('should handle refresh', async () => {
    render(<GoldPricesPage />);

    await waitFor(() => {
      expect(screen.getByText('SJC')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Verify refetch was called
    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
```

**Tasks**:

- [ ] Write unit tests for transformers (100% coverage)
- [ ] Write component tests for PriceCard, PriceList
- [ ] Write integration tests for GoldPricesPage
- [ ] Test auto-refresh functionality
- [ ] Test error handling and retry
- [ ] Test responsive design
- [ ] Performance testing (render time < 100ms)

**Deliverable**: Fully tested and polished feature

---

## UI/UX Design

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                    [Refresh] [Profile]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Gold Prices                     Last updated: 2 minutes ago │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Best Prices (VND)                                     │  │
│  │  ┌──────────────────┐  ┌──────────────────┐          │  │
│  │  │ Best Buy Price   │  │ Best Sell Price  │          │  │
│  │  │ 7,450,000 VND    │  │ 7,500,000 VND    │          │  │
│  │  │ SJC              │  │ PNJ              │          │  │
│  │  └──────────────────┘  └──────────────────┘          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ SJC      │  │ PNJ      │  │ SBJ      │  │ WORLD    │   │
│  │          │  │          │  │          │  │ GOLD     │   │
│  │ Buy      │  │ Buy      │  │ Buy      │  │ Buy      │   │
│  │ 7.45M    │  │ 7.46M    │  │ 7.45M    │  │ $2,051   │   │
│  │          │  │          │  │          │  │          │   │
│  │ Sell     │  │ Sell     │  │ Sell     │  │ Sell     │   │
│  │ 7.50M    │  │ 7.49M    │  │ 7.50M    │  │ $2,056   │   │
│  │          │  │          │  │          │  │          │   │
│  │ per Chỉ  │  │ per Chỉ  │  │ per Chỉ  │  │ per Oz   │   │
│  │ 5m ago   │  │ 5m ago   │  │ 5m ago   │  │ 3m ago   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ℹ️ Prices are indicative. Verify with providers.           │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌──────────────────────────┐
│ ☰  Gold Prices    [↻]   │
├──────────────────────────┤
│ Updated: 2m ago          │
│                          │
│ ┌──────────────────────┐ │
│ │ Best Buy: 7.45M VND  │ │
│ │ SJC • per Chỉ        │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ SJC                  │ │
│ │ Buy: 7.45M VND       │ │
│ │ Sell: 7.50M VND      │ │
│ │ per Chỉ • 5m ago     │ │
│ │ [Use This Price]     │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ PNJ                  │ │
│ │ Buy: 7.46M VND       │ │
│ │ Sell: 7.49M VND      │ │
│ │ per Chỉ • 5m ago     │ │
│ │ [Use This Price]     │ │
│ └──────────────────────┘ │
│                          │
│ ℹ️ Prices indicative    │
└──────────────────────────┘
```

### Color Scheme

- **Buy Prices**: Green (#10B981) - Positive action
- **Sell Prices**: Red (#EF4444) - Caution
- **Provider Cards**: White background with gray border
- **Comparison Card**: Light blue background (#EFF6FF)
- **Update Time**: Gray text (#6B7280)

---

## Testing Strategy

### Test Coverage Goals

- **API Layer**: 100% (transformers, API client)
- **Hooks**: 90% (useGoldPrices, useProviderPrice)
- **Components**: 80% (PriceCard, PriceList, PriceComparison)
- **Pages**: 70% (GoldPricesPage)
- **Overall**: 85%+

### Test Scenarios

#### Unit Tests

- [ ] Transform API price to domain price
- [ ] Calculate spread and spread percentage
- [ ] Handle missing optional fields
- [ ] Handle different currencies and units

#### Component Tests

- [ ] Render price card with all information
- [ ] Display buy/sell prices correctly
- [ ] Format currency based on currency type
- [ ] Show relative time for updates
- [ ] Handle click events on action buttons

#### Integration Tests

- [ ] Fetch and display all prices
- [ ] Handle loading state
- [ ] Handle error state with retry
- [ ] Auto-refresh prices at interval
- [ ] Manual refresh on button click
- [ ] Navigate to transaction form with prefilled data

#### E2E Tests

- [ ] User can view gold prices page
- [ ] User can see all provider prices
- [ ] User can refresh prices manually
- [ ] User can click "Use This Price" and navigate to transaction form
- [ ] Prices auto-refresh every minute

---

## Performance Considerations

### Optimization Strategies

1. **Auto-refresh Interval**
   - Default: 60 seconds (1 minute)
   - Configurable via hook options
   - Pause refresh when tab is not visible

2. **Caching**
   - React Query caching with 30s stale time
   - Refetch on window focus
   - Background refetch for fresh data

3. **Memoization**
   - Memoize PriceCard component to prevent unnecessary re-renders
   - Memoize price calculations (spread, percentage)

4. **Code Splitting**
   - Lazy load GoldPricesPage
   - Separate bundle for price components

5. **API Response Size**
   - Keep response minimal (4 providers)
   - No historical data in initial load

### Performance Metrics

- **Initial Load**: < 1 second
- **Render Time**: < 100ms
- **Refresh Time**: < 500ms
- **Bundle Size**: < 20KB (gzipped)

---

## Future Enhancements

### Phase 2: Real Provider Integration

- [ ] Integrate with real provider APIs (SJC, PNJ, SBJ)
- [ ] Implement web scraping for providers without APIs
- [ ] Add fallback mechanisms for provider unavailability
- [ ] Implement rate limiting and caching strategies

### Phase 3: Price Alerts

- [ ] Allow users to set price alerts
- [ ] Notify when price reaches target
- [ ] Email/push notification support
- [ ] Alert management interface

### Phase 4: Price History

- [ ] Store historical price data
- [ ] Display price trends (line chart)
- [ ] Show price changes (%, absolute)
- [ ] Compare providers over time

### Phase 5: Advanced Analytics

- [ ] Price volatility indicators
- [ ] Buy/sell recommendations based on trends
- [ ] Provider reliability scores
- [ ] Market sentiment indicators

### Phase 6: Mobile App

- [ ] React Native mobile app
- [ ] Push notifications for price alerts
- [ ] Widget for home screen
- [ ] Offline mode with cached prices

---

## Success Metrics

### User Engagement

- [ ] Page views per user per day: > 2
- [ ] Average time on page: > 30 seconds
- [ ] Refresh rate: > 3 times per visit
- [ ] Click-through to transaction form: > 20%

### Technical Metrics

- [ ] API success rate: > 99.5%
- [ ] Page load time: < 1 second (95th percentile)
- [ ] Auto-refresh reliability: 100%
- [ ] Error rate: < 0.5%

### Business Metrics

- [ ] Increase in transaction creation rate: +15%
- [ ] User retention: +10%
- [ ] Positive user feedback: > 80%

---

## Appendix

### Utilities to Add

**⚠️ MODIFY EXISTING FILE**: `src/utils/format.ts`

**Note**: This file already exists with `formatCurrency()` and `formatDate()` from plan-init-codebase.md. Add these new functions:

```typescript
/**
 * Format relative time from ISO string
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(0);
}
```

### Environment Variables

**⚠️ ADD TO EXISTING FILES**: `.env.development` and `.env.production`

Add these optional configuration variables:

```bash
# Price refresh configuration (optional - defaults in code)
VITE_PRICE_REFRESH_INTERVAL=60000  # 1 minute in ms
VITE_PRICE_STALE_TIME=30000        # 30 seconds in ms
```

**Note**: Environment files already exist from plan-init-codebase.md with API_BASE_URL and other configs.

---

## Questions & Decisions

### Open Questions

1. **Auto-refresh Interval**: Should it be user-configurable? Default 1 minute?
2. **Price Alerts**: Should we implement in Phase 1 or defer to Phase 2?
3. **Transaction Integration**: Pre-fill which fields? All or just price?
4. **Mobile UX**: Stack cards vertically or use carousel?
5. **Historical Data**: When do we need to start storing price history?

### Decisions Made

- ✅ Use React Query for server state management
- ✅ Public endpoints (no authentication required)
- ✅ Auto-refresh every 60 seconds (configurable)
- ✅ Display 4 providers initially (SJC, PNJ, SBJ, WORLD_GOLD)
- ✅ Show buy/sell prices side by side
- ✅ Calculate spread automatically
- ✅ Mobile-first responsive design

---

## Timeline

| Phase               | Duration   | Deliverable                       |
| ------------------- | ---------- | --------------------------------- |
| Phase 1: Foundation | 1 day      | API layer, hooks, types           |
| Phase 2: Core UI    | 1 day      | PriceCard, PriceList components   |
| Phase 3: Page       | 1 day      | Complete GoldPricesPage           |
| Phase 4: Features   | 1 day      | Transaction integration, polish   |
| Phase 5: Testing    | 1 day      | Tests, performance, documentation |
| **Total**           | **5 days** | **Production-ready feature**      |

---

## Approval & Sign-off

- [ ] Product Owner: Approved
- [ ] Tech Lead: Approved
- [ ] Designer: Approved
- [ ] QA Lead: Approved

---

## Summary: Relationship with plan-init-codebase.md

### What's Already Done (from plan-init-codebase.md)

✅ **Infrastructure** (DO NOT recreate):

- Project scaffolding (Vite, React, TypeScript)
- Build tools (ESLint, Prettier, Husky)
- API client (`src/api/client.ts`)
- React Query setup (`src/api/queryClient.ts`)
- Routing (React Router in `src/App.tsx`)
- Testing (Vitest, Testing Library)
- Base components (`Header`, `Footer`, `MainLayout`, `ProtectedRoute`)
- Base types (`common.types.ts`, `user.types.ts`, `transaction.types.ts`)
- Utility functions (`src/utils/format.ts`, `src/utils/constants.ts`)

### What This Plan Adds (NEW features)

🆕 **Price Feature** (implement these):

- `src/types/price.types.ts` - NEW FILE
- `src/api/price.api.ts` - NEW FILE
- `src/hooks/useGoldPrices.ts` - NEW FILE
- `src/components/features/prices/` - NEW DIRECTORY
  - `PriceCard.tsx`
  - `PriceList.tsx`
  - `PriceComparison.tsx`
- `src/pages/GoldPricesPage.tsx` - NEW FILE
- Add route to existing `src/config/routes.ts`
- Add link to existing `src/components/layout/Header.tsx`
- Add transformers to existing `src/api/transformers.ts`
- Add API types to existing `src/api/types.ts`
- Add tests for new features

### Key Principle

**Extend, Don't Recreate**: This plan builds on top of the existing codebase. Always:

- ✅ ADD to existing files (routes, types, transformers)
- ✅ CREATE new files only for price-specific features
- ❌ DO NOT recreate infrastructure (API client, React Query, routing, etc.)
- ❌ DO NOT modify core setup (Vite config, TypeScript config, etc.)

---

**Document Version**: 1.0.0
**Last Updated**: January 31, 2026
**Status**: Ready for Implementation ✅
**Prerequisites**: ✅ plan-init-codebase.md completed
