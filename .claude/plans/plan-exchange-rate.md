# Gold Log Client - Exchange Rate API Integration Plan

**Plan Version**: 1.0.0
**Created**: 2026-03-11
**Status**: Ready for Implementation
**Dependencies**: None (endpoint is public — no auth required)

---

## Table of Contents

1. [Overview](#overview)
2. [API Contract](#api-contract)
3. [Implementation Steps](#implementation-steps)
   - [Step 1: API DTO Type](#step-1-api-dto-type)
   - [Step 2: Domain Type](#step-2-domain-type)
   - [Step 3: Transformer](#step-3-transformer)
   - [Step 4: API Function](#step-4-api-function)
   - [Step 5: React Query Hook](#step-5-react-query-hook)
4. [Verification](#verification)

---

## Overview

The backend exposes `GET /api/v1/exchange-rates/usd-vnd` (documented in `API_DOCUMENTATION.md`), but the frontend has no integration code — no types, no API function, no hook. This plan wires up the full integration layer following the standard 5-step pattern from `DEVELOPMENT.md`, matching the style of `src/api/transaction.api.ts` and `src/hooks/useTransactions.ts`.

The endpoint is **public** (no `Authorization` header required). The shared `apiClient` is still used — its request interceptor only attaches the token when one is present, so no special handling is needed.

### Architecture Principles

- **Type Safety**: Strict separation between API DTO types (snake_case) and domain types (camelCase), bridged by a transformer function
- **Reuse Patterns**: Follow the exact same file structure and naming conventions as existing API integrations
- **Appropriate Caching**: `staleTime` set to 30 minutes to match the backend's background refresh interval

---

## API Contract

**Endpoint**: `GET /api/v1/exchange-rates/usd-vnd`
**Auth**: None (public endpoint)

**Response (200 OK)**:

```json
{
  "provider": "VIETCOMBANK",
  "from_currency": "USD",
  "to_currency": "VND",
  "buy_rate": 25140.0,
  "transfer_rate": 25470.0,
  "sell_rate": 25600.0,
  "updated_at": "2026-03-11T08:00:00"
}
```

| Field           | Type   | Description                                    |
| --------------- | ------ | ---------------------------------------------- |
| `provider`      | string | Rate source (`"VIETCOMBANK"`)                  |
| `from_currency` | string | Source currency ISO 4217 (`"USD"`)             |
| `to_currency`   | string | Target currency ISO 4217 (`"VND"`)             |
| `buy_rate`      | number | Vietcombank buy rate (VND per 1 USD)           |
| `transfer_rate` | number | Vietcombank transfer/wire rate (VND per 1 USD) |
| `sell_rate`     | number | Vietcombank sell rate (VND per 1 USD)          |
| `updated_at`    | string | Last rate update timestamp (ISO 8601)          |

**Error**:

| Status | Code             | Description                         |
| ------ | ---------------- | ----------------------------------- |
| 503    | `PROVIDER_ERROR` | Live fallback to Vietcombank failed |

---

## Implementation Steps

---

### Step 1: API DTO Type

**File**: `src/api/types.ts` — append to existing file

```typescript
export interface ApiExchangeRate {
  provider: string;
  from_currency: string;
  to_currency: string;
  buy_rate: number;
  transfer_rate: number;
  sell_rate: number;
  updated_at: string;
}
```

---

### Step 2: Domain Type

**File**: `src/types/common.types.ts` — append to existing file

```typescript
export interface ExchangeRate {
  provider: string;
  fromCurrency: string;
  toCurrency: string;
  buyRate: number;
  transferRate: number;
  sellRate: number;
  updatedAt: string;
}
```

---

### Step 3: Transformer

**File**: `src/api/transformers.ts` — append to existing file

Extend the two existing import lines at the top of the file:

```typescript
// existing line — add ApiExchangeRate
import type { ApiUser, ApiLoginResponse, ApiTransaction, ApiExchangeRate } from './types';
// existing line — add ExchangeRate
import type { User, LoginResponse, Transaction, ExchangeRate } from '@/types';
```

Then append the transformer function:

```typescript
export function apiExchangeRateToExchangeRate(api: ApiExchangeRate): ExchangeRate {
  return {
    provider: api.provider,
    fromCurrency: api.from_currency,
    toCurrency: api.to_currency,
    buyRate: api.buy_rate,
    transferRate: api.transfer_rate,
    sellRate: api.sell_rate,
    updatedAt: api.updated_at,
  };
}
```

---

### Step 4: API Function

**File**: `src/api/exchangeRate.api.ts` — new file

```typescript
import { apiClient } from './client';
import { apiExchangeRateToExchangeRate } from './transformers';
import type { ApiExchangeRate } from './types';
import type { ExchangeRate } from '@/types';

export const exchangeRateApi = {
  async getUsdVnd(): Promise<ExchangeRate> {
    const response = await apiClient.get<ApiExchangeRate>('/exchange-rates/usd-vnd');
    return apiExchangeRateToExchangeRate(response.data);
  },
};
```

---

### Step 5: React Query Hook

**File**: `src/hooks/useExchangeRate.ts` — new file

```typescript
import { useQuery } from '@tanstack/react-query';
import { exchangeRateApi } from '@/api/exchangeRate.api';

const QUERY_KEYS = {
  usdVnd: () => ['exchange-rate', 'usd-vnd'],
};

export function useUsdVndRate() {
  return useQuery({
    queryKey: QUERY_KEYS.usdVnd(),
    queryFn: () => exchangeRateApi.getUsdVnd(),
    staleTime: 30 * 60 * 1000, // 30 min — matches backend cache refresh interval
    retry: 1, // 503 on provider failure; one retry is sufficient
  });
}
```

---

## Verification

```bash
# 1. Type-check — must pass with zero errors
npm run type-check

# 2. Lint
npm run lint

# 3. Tests
npm run test
```

**Manual smoke test:**

1. Use `useUsdVndRate()` in any component (e.g. `DashboardPage`)
2. Open browser Network tab → confirm `GET /exchange-rates/usd-vnd` returns 200
3. Confirm `data.buyRate`, `data.transferRate`, `data.sellRate` are numbers
4. Confirm `data.updatedAt` is an ISO 8601 string

---

## Files Summary

| Action | File                           |
| ------ | ------------------------------ |
| Edit   | `src/api/types.ts`             |
| Edit   | `src/types/common.types.ts`    |
| Edit   | `src/api/transformers.ts`      |
| Create | `src/api/exchangeRate.api.ts`  |
| Create | `src/hooks/useExchangeRate.ts` |
