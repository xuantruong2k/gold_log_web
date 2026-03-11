# Gold Prices Page — Implementation Plan

**Plan Version**: 1.0.0
**Created**: 2026-03-11
**Status**: Ready for Implementation
**Dependencies**: `useUsdVndRate` hook (already implemented in `src/hooks/useExchangeRate.ts`)

---

## Table of Contents

1. [Context](#context)
2. [Page Design](#page-design)
3. [API Contracts](#api-contracts)
4. [Implementation Steps](#implementation-steps)
   - [Step 1: API DTO Types](#step-1-api-dto-types)
   - [Step 2: Domain Types](#step-2-domain-types)
   - [Step 3: Transformers](#step-3-transformers)
   - [Step 4: API Functions](#step-4-api-functions)
   - [Step 5: React Query Hooks](#step-5-react-query-hooks)
   - [Step 6: Feature Components](#step-6-feature-components)
   - [Step 7: Page Component](#step-7-page-component)
   - [Step 8: Route & Navigation Wiring](#step-8-route--navigation-wiring)
5. [Conversion Logic](#conversion-logic)
6. [Verification](#verification)
7. [Files Summary](#files-summary)

---

## Context

The user wants a new page that displays:

1. **Vietnamese gold prices** from local providers (SJC, PNJ, SBJ) in **VND/LƯỢNG**
2. **World gold price** (spot price) in **USD/Oz**
3. **World price converted** to **VND/LƯỢNG** using the live Vietcombank USD/VND exchange rate

Three backend endpoints power this (all public — no auth required). The `useUsdVndRate` hook from the exchange rate implementation is reused directly for the conversion.

---

## Page Design

```
/gold-prices
├── Page header: "Gold Prices" + last refreshed timestamp
│
├── Section: Vietnamese Gold Prices  (VND / Lượng)
│   └── 3-column grid
│       ├── SJC card  — Buy / Sell in VND/Lượng, updated_at
│       ├── PNJ card  — Buy / Sell in VND/Lượng, updated_at
│       └── SBJ card  — Buy / Sell in VND/Lượng, updated_at
│
├── Section: World Gold Price  (USD / Oz)
│   └── Single card — Buy / Sell in USD/Oz, provider, updated_at
│
└── Section: World Price in VND  (USD/Oz → VND/Lượng)
    └── Single card
        ├── Converted buy/sell in VND/Lượng
        ├── Formula note: rate used (Vietcombank transfer rate)
        └── Exchange rate badge: "1 USD = X VND"
```

**Note on VND/LƯỢNG display**: The API returns prices in VND/CHI. Display is in VND/LƯỢNG (×10), matching the user's request.

---

## API Contracts

### `GET /api/v1/prices/current` — Vietnamese providers

**Auth**: None

**Response (200)**:

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

### `GET /api/v1/prices/world` — World spot price

**Auth**: None

**Response (200)**:

```json
{
  "provider": "METALS_LIVE",
  "buy_price": 2050.5,
  "sell_price": 2055.75,
  "unit": "OZ",
  "unit_display_name": "Oz",
  "currency": "USD",
  "updated_at": "2026-02-28T14:28:00Z"
}
```

---

## Implementation Steps

---

### Step 1: API DTO Types

**File**: `src/api/types.ts` — append

> Note: `ApiGoldProviderPrice` and `ApiWorldGoldPrice` are structurally identical. They are kept as separate named types for semantic clarity (different endpoints, different domain concepts).

```typescript
export interface ApiGoldProviderPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}

export interface ApiCurrentGoldPrices {
  timestamp: string;
  providers: ApiGoldProviderPrice[];
}

export interface ApiWorldGoldPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}
```

---

### Step 2: Domain Types

**File**: `src/types/price.types.ts` — new file

```typescript
export interface GoldProviderPrice {
  provider: string;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  unitDisplayName: string;
  currency: string;
  updatedAt: string;
}

export interface CurrentGoldPrices {
  timestamp: string;
  providers: GoldProviderPrice[];
}

export interface WorldGoldPrice {
  provider: string;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  unitDisplayName: string;
  currency: string;
  updatedAt: string;
}
```

**File**: `src/types/index.ts` — add export

```typescript
export * from './price.types';
```

---

### Step 3: Transformers

**File**: `src/api/transformers.ts` — extend imports and append

Extend the import lines:

```typescript
// add to the '@/types' import:
import type {
  User,
  LoginResponse,
  Transaction,
  ExchangeRate,
  GoldProviderPrice,
  CurrentGoldPrices,
  WorldGoldPrice,
} from '@/types';
// add to the './types' import:
import type {
  ApiUser,
  ApiLoginResponse,
  ApiTransaction,
  ApiExchangeRate,
  ApiGoldProviderPrice,
  ApiCurrentGoldPrices,
  ApiWorldGoldPrice,
} from './types';
```

Append transformer functions:

```typescript
export function apiGoldProviderPriceToGoldProviderPrice(
  api: ApiGoldProviderPrice
): GoldProviderPrice {
  return {
    provider: api.provider,
    buyPrice: api.buy_price,
    sellPrice: api.sell_price,
    unit: api.unit,
    unitDisplayName: api.unit_display_name,
    currency: api.currency,
    updatedAt: api.updated_at,
  };
}

export function apiCurrentGoldPricesToCurrentGoldPrices(
  api: ApiCurrentGoldPrices
): CurrentGoldPrices {
  return {
    timestamp: api.timestamp,
    providers: api.providers.map(apiGoldProviderPriceToGoldProviderPrice),
  };
}

export function apiWorldGoldPriceToWorldGoldPrice(api: ApiWorldGoldPrice): WorldGoldPrice {
  return {
    provider: api.provider,
    buyPrice: api.buy_price,
    sellPrice: api.sell_price,
    unit: api.unit,
    unitDisplayName: api.unit_display_name,
    currency: api.currency,
    updatedAt: api.updated_at,
  };
}
```

---

### Step 4: API Functions

**File**: `src/api/goldPrice.api.ts` — new file

```typescript
import { apiClient } from './client';
import {
  apiCurrentGoldPricesToCurrentGoldPrices,
  apiWorldGoldPriceToWorldGoldPrice,
} from './transformers';
import type { ApiCurrentGoldPrices, ApiWorldGoldPrice } from './types';
import type { CurrentGoldPrices, WorldGoldPrice } from '@/types';

export const goldPriceApi = {
  async getCurrentPrices(): Promise<CurrentGoldPrices> {
    const response = await apiClient.get<ApiCurrentGoldPrices>('/prices/current');
    return apiCurrentGoldPricesToCurrentGoldPrices(response.data);
  },

  async getWorldPrice(): Promise<WorldGoldPrice> {
    const response = await apiClient.get<ApiWorldGoldPrice>('/prices/world');
    return apiWorldGoldPriceToWorldGoldPrice(response.data);
  },
};
```

---

### Step 5: React Query Hooks

**File**: `src/hooks/useGoldPrices.ts` — new file

```typescript
import { useQuery } from '@tanstack/react-query';
import { goldPriceApi } from '@/api/goldPrice.api';

const QUERY_KEYS = {
  current: () => ['gold-prices', 'current'],
  world: () => ['gold-prices', 'world'],
};

/**
 * Hook to fetch current Vietnamese gold prices (SJC, PNJ, SBJ) in VND/CHI.
 */
export function useCurrentGoldPrices() {
  return useQuery({
    queryKey: QUERY_KEYS.current(),
    queryFn: () => goldPriceApi.getCurrentPrices(),
    staleTime: 2 * 60 * 1000, // 2 min — prices update frequently
    retry: 1,
  });
}

/**
 * Hook to fetch the world gold spot price in USD/OZ.
 */
export function useWorldGoldPrice() {
  return useQuery({
    queryKey: QUERY_KEYS.world(),
    queryFn: () => goldPriceApi.getWorldPrice(),
    staleTime: 2 * 60 * 1000, // 2 min
    retry: 1,
  });
}
```

---

### Step 6: Feature Components

**File**: `src/components/features/goldPrices/ProviderPriceCard.tsx` — new file

Displays one Vietnamese provider's price. Receives `GoldProviderPrice` and renders buy/sell in VND/LƯỢNG (×10 conversion from CHI).

```typescript
import type { GoldProviderPrice } from '@/types';

// 1 LƯỢNG = 10 CHỈ
const CHI_PER_LUONG = 10;

interface ProviderPriceCardProps {
  price: GoldProviderPrice;
}

export const ProviderPriceCard = ({ price }: ProviderPriceCardProps) => {
  const formatVnd = (value: number) => value.toLocaleString('vi-VN');
  const buyPerLuong = price.buyPrice * CHI_PER_LUONG;
  const sellPerLuong = price.sellPrice * CHI_PER_LUONG;
  const updatedTime = new Date(price.updatedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{price.provider}</h3>
      <p className="mb-4 text-xs text-gray-400">Updated {updatedTime}</p>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Buy</span>
          <span className="font-medium text-green-600">{formatVnd(buyPerLuong)} VND</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Sell</span>
          <span className="font-medium text-red-600">{formatVnd(sellPerLuong)} VND</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">per Lượng</p>
    </div>
  );
};
```

**File**: `src/components/features/goldPrices/WorldPriceCard.tsx` — new file

Displays world spot price in USD/Oz and computed VND/LƯỢNG using the exchange rate.

```typescript
import type { WorldGoldPrice, ExchangeRate } from '@/types';

// 1 Lượng = 37.5g, 1 Troy Oz = 31.1035g → 1 Lượng ≈ 1.2057 Oz
const LUONG_IN_OZ = 37.5 / 31.1035;

interface WorldPriceCardProps {
  worldPrice: WorldGoldPrice;
  exchangeRate: ExchangeRate | undefined;
}

export const WorldPriceCard = ({ worldPrice, exchangeRate }: WorldPriceCardProps) => {
  const formatUsd = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatVnd = (value: number) => value.toLocaleString('vi-VN');

  const updatedTime = new Date(worldPrice.updatedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      {/* USD/Oz section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">World Gold Price</h3>
        <p className="mb-4 text-xs text-gray-400">
          {worldPrice.provider} · Updated {updatedTime}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Buy</span>
            <span className="font-medium text-green-600">${formatUsd(worldPrice.buyPrice)} / Oz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Sell</span>
            <span className="font-medium text-red-600">${formatUsd(worldPrice.sellPrice)} / Oz</span>
          </div>
        </div>
      </div>

      {/* VND/Lượng conversion section */}
      <div className="border-t pt-4">
        <h4 className="mb-1 text-sm font-medium text-gray-700">Converted to VND / Lượng</h4>
        {exchangeRate ? (
          <>
            <p className="mb-3 text-xs text-gray-400">
              Rate: 1 USD = {exchangeRate.transferRate.toLocaleString('vi-VN')} VND (Vietcombank transfer)
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Buy</span>
                <span className="font-medium text-green-600">
                  {formatVnd(Math.round(worldPrice.buyPrice * LUONG_IN_OZ * exchangeRate.transferRate))} VND
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Sell</span>
                <span className="font-medium text-red-600">
                  {formatVnd(Math.round(worldPrice.sellPrice * LUONG_IN_OZ * exchangeRate.transferRate))} VND
                </span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Exchange rate unavailable</p>
        )}
      </div>
    </div>
  );
};
```

---

### Step 7: Page Component

**File**: `src/pages/GoldPricesPage.tsx` — new file

```typescript
import { useCurrentGoldPrices, useWorldGoldPrice } from '@/hooks/useGoldPrices';
import { useUsdVndRate } from '@/hooks/useExchangeRate';
import { ProviderPriceCard } from '@/components/features/goldPrices/ProviderPriceCard';
import { WorldPriceCard } from '@/components/features/goldPrices/WorldPriceCard';

export const GoldPricesPage = () => {
  const { data: currentPrices, isLoading: loadingCurrent, isError: errorCurrent } = useCurrentGoldPrices();
  const { data: worldPrice, isLoading: loadingWorld, isError: errorWorld } = useWorldGoldPrice();
  const { data: exchangeRate } = useUsdVndRate();

  const isLoading = loadingCurrent || loadingWorld;

  const lastUpdated = currentPrices?.timestamp
    ? new Date(currentPrices.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (errorCurrent || errorWorld) {
    return (
      <p className="py-12 text-center text-gray-500">
        Failed to load gold prices. Please try again.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gold Prices</h1>
        {lastUpdated && <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>}
      </div>

      {/* Vietnamese providers */}
      {currentPrices && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-700">
            Vietnamese Gold Prices{' '}
            <span className="text-sm font-normal text-gray-400">(VND / Lượng)</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {currentPrices.providers.map((price) => (
              <ProviderPriceCard key={price.provider} price={price} />
            ))}
          </div>
        </section>
      )}

      {/* World price + VND conversion */}
      {worldPrice && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-700">
            World Gold Price{' '}
            <span className="text-sm font-normal text-gray-400">(USD / Oz)</span>
          </h2>
          <div className="max-w-md">
            <WorldPriceCard worldPrice={worldPrice} exchangeRate={exchangeRate} />
          </div>
        </section>
      )}
    </div>
  );
};

export default GoldPricesPage;
```

---

### Step 8: Route & Navigation Wiring

**File**: `src/config/routes.ts` — add `GOLD_PRICES`

```typescript
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  GOLD_PRICES: '/gold-prices', // ← add
  PROFILE: '/profile',
  OAUTH_CALLBACK: '/auth/callback/:provider',
  NOT_FOUND: '*',
} as const;
```

**File**: `src/App.tsx` — add import and protected route alongside the others

```typescript
import GoldPricesPage from './pages/GoldPricesPage';

<Route
  path={ROUTES.GOLD_PRICES}
  element={
    <ProtectedRoute>
      <MainLayout>
        <GoldPricesPage />
      </MainLayout>
    </ProtectedRoute>
  }
/>
```

**File**: `src/components/layout/Header.tsx` — insert after the Transactions `<Link>`, before the Profile `<Link>`

```typescript
<Link to={ROUTES.GOLD_PRICES} className="text-gray-600 hover:text-gray-900">
  Gold Prices
</Link>
```

---

## Conversion Logic

| Conversion            | Formula                       | Notes                                       |
| --------------------- | ----------------------------- | ------------------------------------------- |
| CHI → LƯỢNG           | `× 10`                        | API returns VND/CHI; displayed as VND/LƯỢNG |
| USD/Oz → USD/Lượng    | `× (37.5 / 31.1035)`          | 1 Lượng = 37.5g, 1 Troy Oz = 31.1035g       |
| USD/Lượng → VND/Lượng | `× exchangeRate.transferRate` | Vietcombank transfer rate                   |

---

## Verification

```bash
npm run type-check   # zero errors
npm run lint         # no new errors in touched files
npm run test         # existing tests still pass
```

**Manual smoke test:**

1. `npm run dev` → navigate to `/gold-prices`
2. Three provider cards visible (SJC, PNJ, SBJ) with buy/sell in VND/Lượng
3. World price card shows USD/Oz buy/sell
4. Converted section shows VND/Lượng with Vietcombank rate badge
5. Header nav includes "Gold Prices" link

---

## Files Summary

| Action | File                                                       |
| ------ | ---------------------------------------------------------- |
| Edit   | `src/api/types.ts`                                         |
| Edit   | `src/api/transformers.ts`                                  |
| Edit   | `src/types/index.ts`                                       |
| Edit   | `src/config/routes.ts`                                     |
| Edit   | `src/App.tsx`                                              |
| Edit   | `src/components/layout/Header.tsx`                         |
| Create | `src/types/price.types.ts`                                 |
| Create | `src/api/goldPrice.api.ts`                                 |
| Create | `src/hooks/useGoldPrices.ts`                               |
| Create | `src/components/features/goldPrices/ProviderPriceCard.tsx` |
| Create | `src/components/features/goldPrices/WorldPriceCard.tsx`    |
| Create | `src/pages/GoldPricesPage.tsx`                             |
