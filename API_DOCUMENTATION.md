# Gold Log API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:8080/api/v1` (configurable)
**Last Updated**: February 28, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Health Check](#health-check)
   - [Authentication](#authentication-endpoints)
   - [Transactions](#transaction-endpoints)
   - [Gold Prices](#gold-price-endpoints)
   - [Exchange Rates](#exchange-rate-endpoints)
6. [Data Models](#data-models)
7. [Code Examples](#code-examples)

---

## Overview

Gold Log is a backend service for tracking gold trading transactions with real-time profit/loss calculations. The API follows RESTful conventions and returns JSON responses.

### Key Features

- **OAuth 2.0 Authentication**: Google OAuth integration with JWT tokens
- **Transaction Management**: Create, read, and delete gold transactions
- **Gold Price API**: Real-time gold prices with separate endpoints:
  - Vietnamese gold prices (SJC, PNJ, SBJ in VND/LUONG)
  - World gold price (international spot price in USD/OZ)
  - Provider-specific price lookup
- **Idempotency Protection**: Prevent duplicate transactions using UUID v4 keys
- **Pagination**: Efficient pagination for transaction listings
- **Multi-currency Support**: VND (default) and USD currencies
- **Multi-unit Support**: CHI (default), LUONG, and OZ units for gold measurement

### API Conventions

- **JSON Naming**: All API fields use `snake_case` (e.g., `transaction_date`, `price_per_unit`)
- **HTTP Methods**: Standard REST verbs (GET, POST, DELETE)
- **Status Codes**: Standard HTTP status codes (200, 201, 204, 400, 401, 404, 500)
- **Timestamps**: ISO 8601 format (e.g., `2026-01-30T10:30:00Z`)
- **Currency**: ISO 4217 codes (e.g., `VND`, `USD`)

---

## Authentication

### OAuth 2.0 with Dual-Token System

Gold Log uses OAuth 2.0 with a secure dual-token authentication system:

- **Access Token**: Short-lived JWT (15 minutes) for API authentication
- **Refresh Token**: Long-lived token (30 days) for obtaining new access tokens

**Security Features**:

- Token rotation: New refresh token generated on each use
- Device limits: Maximum 5 active refresh tokens per user
- Rate limiting: 10 refresh requests per minute per token
- Automatic cleanup: Expired tokens removed via database TTL

**Token Lifecycle**:

1. User logs in via OAuth → Receives both access and refresh tokens
2. Use access token for API requests (valid for 15 minutes)
3. When access token expires → Use refresh token to get new access token
4. Refresh token is automatically rotated (new one issued)
5. On logout → Refresh token is revoked and access token blacklisted

#### 1. Get Authorization URL

```http
GET /auth/oauth/{provider}/url?redirectUri={redirectUri}
```

**Parameters**:

- `provider` (path): OAuth provider (`google`)
- `redirectUri` (query): Your frontend callback URL

**Response**:

```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "csrf-token-here"
}
```

#### 2. Handle OAuth Callback

```http
POST /auth/oauth/{provider}/callback
```

**Request Body**:

```json
{
  "code": "authorization-code-from-provider",
  "state": "csrf-token-from-step-1"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expires_in": 900,
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "refresh_token_expires_in": 2592000,
  "token_type": "Bearer",
  "user": {
    "id": "user-id-123",
    "email": "user@example.com",
    "username": "John Doe",
    "profile_picture_url": "https://...",
    "provider": "google",
    "role": "USER"
  }
}
```

**Response Fields**:

- `access_token`: JWT token for API authentication (use in Authorization header)
- `access_token_expires_in`: Access token lifetime in seconds (900 = 15 minutes)
- `refresh_token`: UUID v4 token for refreshing access token
- `refresh_token_expires_in`: Refresh token lifetime in seconds (2592000 = 30 days)
- `token_type`: Always "Bearer"
- `user`: User profile information

### Protected Endpoints

For protected endpoints, include the **access token** in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiration Handling**:

When an access token expires, the API returns:

```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Access token has expired. Use refresh token to obtain a new access token.",
  "timestamp": "2026-01-31T10:30:00Z"
}
```

**Status Code**: `401 Unauthorized`

**Client Action**: Call `POST /auth/refresh` with your refresh token to get a new access token.

**Implementation Pattern**:

```typescript
// Intercept 401 errors with TOKEN_EXPIRED
if (error.response?.status === 401 && error.response?.data?.error === 'TOKEN_EXPIRED') {
  // Attempt token refresh
  const newTokens = await refreshAccessToken();
  // Retry original request with new access token
  return retryRequest(originalRequest, newTokens.access_token);
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error description",
  "timestamp": "2026-01-30T10:30:00Z"
}
```

### Common Error Codes

| Status Code | Error Code              | Description                                   |
| ----------- | ----------------------- | --------------------------------------------- |
| 400         | `VALIDATION_ERROR`      | Request validation failed                     |
| 401         | `UNAUTHORIZED`          | Missing or invalid authentication token       |
| 401         | `TOKEN_EXPIRED`         | Access token has expired (use refresh token)  |
| 401         | `INVALID_REFRESH_TOKEN` | Refresh token is invalid or malformed         |
| 401         | `REFRESH_TOKEN_EXPIRED` | Refresh token has expired (re-login required) |
| 401         | `REFRESH_TOKEN_REVOKED` | Refresh token has been revoked                |
| 404         | `NOT_FOUND`             | Requested resource not found                  |
| 409         | `DUPLICATE_TRANSACTION` | Transaction with same idempotency key exists  |
| 429         | `RATE_LIMIT_EXCEEDED`   | Too many requests                             |
| 429         | `TOO_MANY_REQUESTS`     | Rate limit exceeded for refresh token         |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error                       |

### Example Error Response

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Quantity must be greater than 0",
  "timestamp": "2026-01-30T10:30:00.123Z"
}
```

---

## Rate Limiting

OAuth endpoints are rate-limited to prevent abuse:

- **Authorization URL**: 10 requests per minute per IP
- **OAuth Callback**: 10 requests per minute per IP

Response headers include rate limit information:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1643547600
```

---

## API Endpoints

### Health Check

#### GET /health

Check service health status.

**Authentication**: Not required
**Rate Limit**: None

**Response**: `200 OK`

```json
{
  "status": "UP",
  "timestamp": "2026-01-30T10:30:00.123Z",
  "version": "1.0.0",
  "environment": "development"
}
```

**Example**:

```bash
curl http://localhost:8080/api/v1/health
```

---

### Authentication Endpoints

#### GET /auth/oauth/{provider}/url

Get OAuth authorization URL to redirect user for authentication.

**Authentication**: Not required
**Rate Limit**: 10 requests/minute

**Path Parameters**:

- `provider` (required): OAuth provider (`google`)

**Query Parameters**:

- `redirectUri` (required): Your frontend callback URL where OAuth provider redirects after auth

**Response**: `200 OK`

```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "random-csrf-token"
}
```

**Example**:

```bash
curl "http://localhost:8080/api/v1/auth/oauth/google/url?redirectUri=http://localhost:3000/auth/callback/google"
```

---

#### POST /auth/oauth/{provider}/callback

Exchange OAuth authorization code for JWT access token.

**Authentication**: Not required
**Rate Limit**: 10 requests/minute

**Path Parameters**:

- `provider` (required): OAuth provider (`google`)

**Request Body**:

```json
{
  "code": "4/0AfJohXk...",
  "state": "csrf-token-from-authorization-url"
}
```

**Response**: `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "65b3f2a1c4e5d6f7a8b9c0d1",
    "email": "john.doe@example.com",
    "username": "John Doe",
    "profile_picture_url": "https://lh3.googleusercontent.com/...",
    "provider": "google",
    "role": "USER"
  }
}
```

**Validation Rules**:

- `code`: Required, non-blank string
- `state`: Required, non-blank string

**Errors**:

- `400`: Invalid provider or missing/invalid request fields
- `401`: Invalid authorization code or state token
- `500`: OAuth provider error

**Example**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/oauth/google/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "4/0AfJohXk...",
    "state": "csrf-token"
  }'
```

---

#### POST /auth/refresh

Refresh an expired access token using a refresh token.

**Authentication**: Not required (uses refresh token in request body)
**Rate Limit**: 10 requests per minute per refresh token

**Request Body**:

```json
{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation Rules**:

- `refresh_token`: Required, must be valid UUID v4 format

**Response**: `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expires_in": 900,
  "refresh_token": "660f9511-f3ac-52e5-b827-557766551111",
  "refresh_token_expires_in": 2592000,
  "token_type": "Bearer",
  "user": {
    "id": "65b3f2a1c4e5d6f7a8b9c0d1",
    "email": "john.doe@example.com",
    "username": "John Doe",
    "profile_picture_url": "https://lh3.googleusercontent.com/...",
    "provider": "google",
    "role": "USER"
  }
}
```

**Token Rotation**: By default, a **new refresh token** is issued with each refresh request. Store the new refresh token and discard the old one.

**Errors**:

- `400 VALIDATION_ERROR`: Invalid UUID format
- `401 INVALID_REFRESH_TOKEN`: Refresh token not found or invalid format
- `401 REFRESH_TOKEN_EXPIRED`: Refresh token has expired (user must re-login via OAuth)
- `401 REFRESH_TOKEN_REVOKED`: Refresh token was revoked (user must re-login)
- `429 TOO_MANY_REQUESTS`: Exceeded 10 requests per minute for this refresh token
- `500 INTERNAL_SERVER_ERROR`: Server error during token refresh

**Device Limit**: Users can have maximum 5 active refresh tokens. When limit is reached, the oldest token is automatically revoked.

**Example**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Security Notes**:

- Refresh tokens are single-use when rotation is enabled (default)
- Old refresh token becomes invalid after successful refresh
- Rate limiting prevents brute force attacks
- Tokens are automatically cleaned up after expiration (30 days)

---

#### GET /auth/me

Get current authenticated user information.

**Authentication**: Required (JWT)
**Rate Limit**: None

**Response**: `200 OK`

```json
{
  "id": "65b3f2a1c4e5d6f7a8b9c0d1",
  "email": "john.doe@example.com",
  "username": "John Doe",
  "profile_picture_url": "https://lh3.googleusercontent.com/...",
  "provider": "google",
  "role": "USER"
}
```

**Errors**:

- `401`: Missing or invalid authentication token

**Example**:

```bash
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### POST /auth/logout

Logout and invalidate tokens. Revokes refresh token(s) and blacklists the current access token.

**Authentication**: Required (JWT access token)
**Rate Limit**: None

**Request Body** (optional):

```json
{
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "all_devices": false
}
```

**Request Fields**:

- `refresh_token` (optional): Specific refresh token to revoke. If omitted, uses the token associated with the current access token.
- `all_devices` (optional): If `true`, revokes all refresh tokens for the user (logout from all devices). Default: `false`

**Response**: `204 No Content`

**Behavior**:

1. Access token is blacklisted (expires after its remaining lifetime, max 15 minutes)
2. If `all_devices` is `false`: Revokes the specified refresh token
3. If `all_devices` is `true`: Revokes all user's refresh tokens
4. User must re-login via OAuth to get new tokens

**Errors**:

- `401`: Missing or invalid authentication token

**Examples**:

Logout from current device:

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Logout from all devices:

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
    "all_devices": true
  }'
```

---

### Transaction Endpoints

#### POST /transactions

Create a new gold transaction (buy or sell).

**Authentication**: Required (JWT)
**Rate Limit**: None

**Request Body**:

```json
{
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "type": "BUY",
  "quantity": 10.5,
  "unit": "CHI",
  "price_per_unit": 75000000,
  "currency": "VND",
  "provider": "SJC",
  "transaction_date": "2026-01-30T10:30:00",
  "notes": "Purchase from SJC store in District 1"
}
```

**Field Specifications**:

| Field              | Type     | Required | Validation                      | Description                             |
| ------------------ | -------- | -------- | ------------------------------- | --------------------------------------- |
| `idempotency_key`  | string   | Yes      | UUID v4 format                  | Unique identifier to prevent duplicates |
| `type`             | string   | Yes      | `BUY` or `SELL`                 | Transaction type                        |
| `quantity`         | decimal  | Yes      | > 0, max 10 digits + 6 decimals | Gold quantity                           |
| `unit`             | string   | No       | `CHI`, `LUONG`, or `OZ`         | Unit of measurement (default: `CHI`)    |
| `price_per_unit`   | decimal  | Yes      | > 0, max 15 digits + 2 decimals | Price per unit                          |
| `currency`         | string   | No       | ISO 4217 code                   | Currency code (default: `VND`)          |
| `provider`         | string   | No       | Max 100 chars                   | Gold provider name                      |
| `transaction_date` | datetime | No       | ISO 8601 format                 | Transaction date (default: now)         |
| `notes`            | string   | No       | Max 500 chars                   | Additional notes                        |

**Response**: `201 Created`

```json
{
  "id": "65b3f2a1c4e5d6f7a8b9c0d1",
  "user_id": "65b3f2a1c4e5d6f7a8b9c0d0",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "type": "BUY",
  "quantity": 10.5,
  "unit": "CHI",
  "price_per_unit": 75000000,
  "currency": "VND",
  "total_amount": 787500000,
  "provider": "SJC",
  "transaction_date": "2026-01-30T10:30:00",
  "notes": "Purchase from SJC store in District 1",
  "is_deleted": false,
  "created_at": "2026-01-30T10:30:00.123Z",
  "updated_at": "2026-01-30T10:30:00.123Z"
}
```

**Validation Rules**:

- `idempotency_key`: Must be valid UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- `type`: Must be exactly `BUY` or `SELL` (case-sensitive)
- `quantity`: Must be positive, max 10 integer digits and 6 decimal places
- `unit`: If provided, must be `CHI`, `LUONG`, or `OZ` (defaults to `CHI`)
- `price_per_unit`: Must be positive, max 15 integer digits and 2 decimal places
- `currency`: If provided, must be valid ISO 4217 code
- `transaction_date`: If provided, must be valid ISO 8601 datetime

**Errors**:

- `400`: Validation error (invalid UUID, negative quantity, etc.)
- `401`: Missing or invalid authentication token
- `409`: Transaction with same `idempotency_key` already exists

**Idempotency Behavior**:

- Same `idempotency_key` within 60 seconds returns `409 Conflict`
- After 60 seconds, same key can be reused for new transaction
- Each transaction attempt should use a fresh UUID v4

**Example**:

```bash
curl -X POST http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
    "type": "BUY",
    "quantity": 10.5,
    "unit": "CHI",
    "price_per_unit": 75000000,
    "currency": "VND",
    "provider": "SJC",
    "transaction_date": "2026-01-30T10:30:00",
    "notes": "Purchase from SJC"
  }'
```

---

#### GET /transactions/{id}

Get a specific transaction by ID.

**Authentication**: Required (JWT)
**Rate Limit**: None

**Path Parameters**:

- `id` (required): Transaction ID (MongoDB ObjectId - 24-character hex string)

**Response**: `200 OK`

```json
{
  "id": "65b3f2a1c4e5d6f7a8b9c0d1",
  "user_id": "65b3f2a1c4e5d6f7a8b9c0d0",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "type": "BUY",
  "quantity": 10.5,
  "unit": "CHI",
  "price_per_unit": 75000000,
  "currency": "VND",
  "total_amount": 787500000,
  "provider": "SJC",
  "transaction_date": "2026-01-30T10:30:00",
  "notes": "Purchase from SJC store",
  "is_deleted": false,
  "created_at": "2026-01-30T10:30:00.123Z",
  "updated_at": "2026-01-30T10:30:00.123Z"
}
```

**Errors**:

- `400`: Invalid transaction ID format
- `401`: Missing or invalid authentication token
- `404`: Transaction not found or belongs to another user

**Example**:

```bash
curl http://localhost:8080/api/v1/transactions/65b3f2a1c4e5d6f7a8b9c0d1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### GET /transactions

Get all transactions with optional filters and pagination.

**Authentication**: Required (JWT)
**Rate Limit**: None

**Query Parameters**:

| Parameter   | Type     | Required | Default | Description                     |
| ----------- | -------- | -------- | ------- | ------------------------------- |
| `page`      | integer  | No       | 1       | Page number (1-indexed)         |
| `pageSize`  | integer  | No       | 20      | Items per page (max: 100)       |
| `type`      | string   | No       | -       | Filter by type: `BUY` or `SELL` |
| `startDate` | datetime | No       | -       | Filter by start date (ISO 8601) |
| `endDate`   | datetime | No       | -       | Filter by end date (ISO 8601)   |

**Notes**:

- `startDate` and `endDate` must be used together
- `type` filter is mutually exclusive with date range filter
- Date range filter returns transactions where `transaction_date` is between `startDate` and `endDate`

**Response**: `200 OK`

```json
{
  "data": [
    {
      "id": "65b3f2a1c4e5d6f7a8b9c0d1",
      "user_id": "65b3f2a1c4e5d6f7a8b9c0d0",
      "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
      "type": "BUY",
      "quantity": 10.5,
      "price_per_unit": 75000000,
      "currency": "VND",
      "total_amount": 787500000,
      "provider": "SJC",
      "transaction_date": "2026-01-30T10:30:00",
      "notes": "Purchase from SJC",
      "is_deleted": false,
      "created_at": "2026-01-30T10:30:00.123Z",
      "updated_at": "2026-01-30T10:30:00.123Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "total_items": 45,
    "total_pages": 3,
    "has_next": true,
    "has_previous": false
  }
}
```

**Examples**:

Get all transactions (first page):

```bash
curl http://localhost:8080/api/v1/transactions \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Filter by transaction type:

```bash
curl "http://localhost:8080/api/v1/transactions?type=BUY&page=1&pageSize=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Filter by date range:

```bash
curl "http://localhost:8080/api/v1/transactions?startDate=2026-01-01T00:00:00&endDate=2026-01-31T23:59:59" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Errors**:

- `400`: Invalid query parameters (invalid date format, invalid type)
- `401`: Missing or invalid authentication token

---

#### DELETE /transactions/{id}

Soft delete a transaction (marks as deleted without removing from database).

**Authentication**: Required (JWT)
**Rate Limit**: None

**Path Parameters**:

- `id` (required): Transaction ID (MongoDB ObjectId)

**Response**: `204 No Content`

**Errors**:

- `400`: Invalid transaction ID format
- `401`: Missing or invalid authentication token
- `404`: Transaction not found or belongs to another user

**Example**:

```bash
curl -X DELETE http://localhost:8080/api/v1/transactions/65b3f2a1c4e5d6f7a8b9c0d1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Gold Price Endpoints

Retrieve current gold prices from multiple providers. These endpoints are **public** (no authentication required).

**Available Endpoints**:

- `GET /api/v1/prices/current` - Get all Vietnamese gold prices (SJC, PNJ, SBJ)
- `GET /api/v1/prices/provider/{providerName}` - Get specific provider price
- `GET /api/v1/prices/world` - Get world gold price (international spot price)

**Note**: Phase 1 returns mock data for client integration. Real provider integration coming in Phase 2.

#### Get All Current Prices

Retrieve current gold prices from all **Vietnamese gold providers** (SJC, PNJ, SBJ). For world gold price, use the `/api/v1/prices/world` endpoint.

**Endpoint**: `GET /api/v1/prices/current`

**Authentication**: None (public endpoint)

**Request**: No parameters required

**Response** (200 OK):

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
    },
    {
      "provider": "PNJ",
      "buy_price": 7460000,
      "sell_price": 7490000,
      "unit": "CHI",
      "unit_display_name": "Chỉ",
      "currency": "VND",
      "updated_at": "2026-01-31T14:25:00Z"
    },
    {
      "provider": "SBJ",
      "buy_price": 7455000,
      "sell_price": 7495000,
      "unit": "CHI",
      "unit_display_name": "Chỉ",
      "currency": "VND",
      "updated_at": "2026-01-31T14:25:00Z"
    }
  ]
}
```

**Field Descriptions**:

| Field               | Type    | Description                                                 |
| ------------------- | ------- | ----------------------------------------------------------- |
| `timestamp`         | string  | ISO 8601 timestamp when response was generated              |
| `providers`         | array   | List of current prices from Vietnamese gold providers       |
| `provider`          | string  | Provider name (SJC, PNJ, SBJ)                               |
| `buy_price`         | decimal | Price at which provider buys gold from customers (VND)      |
| `sell_price`        | decimal | Price at which provider sells gold to customers (VND)       |
| `unit`              | string  | Unit of measurement (CHI or LUONG for Vietnamese providers) |
| `unit_display_name` | string  | Human-readable unit name                                    |
| `currency`          | string  | Always "VND" for this endpoint                              |
| `updated_at`        | string  | ISO 8601 timestamp of last price update                     |

**Example**:

```bash
curl -X GET http://localhost:8080/api/v1/prices/current
```

```typescript
// TypeScript example
const response = await fetch('http://localhost:8080/api/v1/prices/current');
const data = await response.json();
console.log(`Timestamp: ${data.timestamp}`);
console.log(`Vietnamese providers: ${data.providers.length}`);
data.providers.forEach((p) => {
  console.log(`${p.provider}: Buy ${p.buy_price} - Sell ${p.sell_price} ${p.currency}/${p.unit}`);
});
```

---

#### Get Price by Provider

Retrieve current gold price from a specific **Vietnamese provider**. For world gold price, use the `/api/v1/prices/world` endpoint.

**Endpoint**: `GET /api/v1/prices/provider/{providerName}`

**Authentication**: None (public endpoint)

**Path Parameters**:

| Parameter      | Type   | Required | Description                                              |
| -------------- | ------ | -------- | -------------------------------------------------------- |
| `providerName` | string | Yes      | Vietnamese provider name (case-sensitive: SJC, PNJ, SBJ) |

**Response** (200 OK):

```json
{
  "provider": "SJC",
  "buy_price": 7450000,
  "sell_price": 7500000,
  "unit": "CHI",
  "unit_display_name": "Chỉ",
  "currency": "VND",
  "updated_at": "2026-01-31T14:25:00Z"
}
```

**Errors**:

- `404`: Provider not found
- `500`: Internal server error

**Error Response Example** (404 Not Found):

```json
{
  "error": "PROVIDER_NOT_FOUND",
  "message": "Provider 'UNKNOWN' not found",
  "timestamp": "2026-01-31T14:30:00Z"
}
```

**Examples**:

```bash
# Get SJC price
curl -X GET http://localhost:8080/api/v1/prices/provider/SJC

# Get PNJ price
curl -X GET http://localhost:8080/api/v1/prices/provider/PNJ
```

```typescript
// TypeScript example with error handling
try {
  const response = await fetch('http://localhost:8080/api/v1/prices/provider/SJC');
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error: ${error.message}`);
    return;
  }
  const price = await response.json();
  console.log(`${price.provider}: Buy ${price.buy_price} ${price.currency}`);
} catch (err) {
  console.error('Failed to fetch price:', err);
}
```

**Unit Reference**:

- **CHI** (Chỉ): Vietnamese unit, approximately 3.75 grams. 10 chỉ = 1 lượng
- **LUONG** (Lượng): Vietnamese unit, approximately 37.5 grams
- **OZ** (Troy Ounce): International standard, approximately 31.1 grams

---

#### Get World Gold Price

Retrieve the most recent world gold price (in USD per Troy Ounce). This endpoint returns the latest world gold price regardless of which provider (METALS_LIVE, GOLDAPI_IO, etc.) it came from.

**Endpoint**: `GET /api/v1/prices/world`

**Authentication**: None (public endpoint)

**Request**: No parameters required

**Response** (200 OK):

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

**Field Descriptions**:

| Field               | Type    | Description                                             |
| ------------------- | ------- | ------------------------------------------------------- |
| `provider`          | string  | Source provider name (e.g., METALS_LIVE, GOLDAPI_IO)    |
| `buy_price`         | decimal | Spot bid price (price dealers pay when buying gold)     |
| `sell_price`        | decimal | Spot ask price (price dealers charge when selling gold) |
| `unit`              | string  | Always "OZ" (Troy Ounce)                                |
| `unit_display_name` | string  | Human-readable unit name "Oz"                           |
| `currency`          | string  | Always "USD" (United States Dollar)                     |
| `updated_at`        | string  | ISO 8601 timestamp of last price update                 |

**Errors**:

- `404`: World gold price not available
- `500`: Internal server error

**Error Response Example** (404 Not Found):

```json
{
  "error": "WORLD_PRICE_NOT_FOUND",
  "message": "World gold price not available",
  "timestamp": "2026-02-28T14:30:00Z"
}
```

**Examples**:

```bash
# Get world gold price
curl -X GET http://localhost:8080/api/v1/prices/world
```

```typescript
// TypeScript example
const response = await fetch('http://localhost:8080/api/v1/prices/world');
if (!response.ok) {
  if (response.status === 404) {
    console.error('World gold price not available yet');
  }
  return;
}
const worldPrice = await response.json();
console.log(
  `World Gold (${worldPrice.provider}): $${worldPrice.buy_price} - $${worldPrice.sell_price} per oz`
);
console.log(`Last updated: ${worldPrice.updated_at}`);
```

```python
# Python example
import requests

response = requests.get('http://localhost:8080/api/v1/prices/world')
if response.status_code == 200:
    world_price = response.json()
    print(f"Provider: {world_price['provider']}")
    print(f"Bid: ${world_price['buy_price']}")
    print(f"Ask: ${world_price['sell_price']}")
elif response.status_code == 404:
    print("World gold price not available")
```

**Use Cases**:

- Display current international gold prices
- Compare Vietnamese gold prices with world market prices
- Calculate arbitrage opportunities between local and international markets
- Track world gold price trends over time

**Note**:

- The `provider` field indicates which external API was used to fetch the price (e.g., METALS_LIVE is the primary provider, GOLDAPI_IO is the fallback)
- Prices update every 5 minutes (configurable) via automated schedulers (Phase 2)
- 1 Troy Ounce (OZ) ≈ 31.1 grams

---

### Exchange Rate Endpoints

Retrieve currency exchange rates. These endpoints are **public** (no authentication required).

**Available Endpoints**:

- `GET /api/v1/exchange-rates/usd-vnd` - Get latest USD/VND rate from Vietcombank

#### GET /api/v1/exchange-rates/usd-vnd

Returns the latest USD/VND exchange rate from Vietcombank. The response is served from the database (updated every 30 minutes by the background scheduler). If no record exists yet, the endpoint performs a live fetch from Vietcombank, persists the result, then returns it.

**Authentication**: None (public endpoint)

**Request**: No parameters required

**Response** (200 OK):

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

**Response Fields**:

| Field           | Type   | Description                                              |
| --------------- | ------ | -------------------------------------------------------- |
| `provider`      | string | Rate source identifier (`"VIETCOMBANK"`)                 |
| `from_currency` | string | Source currency ISO 4217 code (`"USD"`)                  |
| `to_currency`   | string | Target currency ISO 4217 code (`"VND"`)                  |
| `buy_rate`      | number | Vietcombank's buy rate (VND per 1 USD)                   |
| `transfer_rate` | number | Vietcombank's transfer/wire rate (VND per 1 USD)         |
| `sell_rate`     | number | Vietcombank's sell rate (VND per 1 USD)                  |
| `updated_at`    | string | Timestamp of the last rate update (ISO 8601, local time) |

**Behavior**:

1. DB hit first — returns the cached rate from MongoDB if present
2. Live fallback — if no record exists, fetches live from Vietcombank's public XML API (`pXML.aspx?b=10`), persists the result, and returns it

**Error Responses**:

| Status | Error Code       | Description                                                             |
| ------ | ---------------- | ----------------------------------------------------------------------- |
| 503    | `PROVIDER_ERROR` | Live fallback failed (Vietcombank unreachable or returned invalid data) |

**Example** (curl):

```bash
curl http://localhost:8080/api/v1/exchange-rates/usd-vnd
```

**Example** (JavaScript):

```javascript
const response = await fetch('/api/v1/exchange-rates/usd-vnd');
const rate = await response.json();
console.log(`USD/VND sell rate: ${rate.sell_rate}`);
```

---

## Data Models

### Transaction

Represents a gold buy or sell transaction.

```json
{
  "id": "string", // MongoDB ObjectId (24-char hex)
  "user_id": "string", // User who owns this transaction
  "idempotency_key": "string", // UUID v4 for duplicate prevention
  "type": "BUY|SELL", // Transaction type enum
  "quantity": "decimal", // Gold quantity (max 10.6 digits)
  "unit": "CHI|LUONG|OZ", // Unit of measurement (default: CHI)
  "price_per_unit": "decimal", // Price per unit (max 15.2 digits)
  "currency": "string", // ISO 4217 currency code (default: VND)
  "total_amount": "decimal", // Calculated: quantity × price_per_unit
  "provider": "string", // Provider name (e.g., SJC, PNJ)
  "transaction_date": "datetime", // ISO 8601 format
  "notes": "string", // Optional notes (max 500 chars)
  "is_deleted": "boolean", // Soft delete flag
  "created_at": "datetime", // Record creation timestamp (ISO 8601)
  "updated_at": "datetime" // Last update timestamp (ISO 8601)
}
```

### LoginResponse

Response from OAuth callback and token refresh endpoints.

```json
{
  "access_token": "string", // JWT access token (15 min)
  "access_token_expires_in": "number", // Access token lifetime in seconds (900)
  "refresh_token": "string", // UUID v4 refresh token (30 days)
  "refresh_token_expires_in": "number", // Refresh token lifetime in seconds (2592000)
  "token_type": "string", // Always "Bearer"
  "user": {
    "id": "string",
    "email": "string",
    "username": "string",
    "profile_picture_url": "string",
    "provider": "string",
    "role": "string"
  }
}
```

**Token Storage Recommendations**:

- Store `access_token` in memory (not localStorage for security)
- Store `refresh_token` in httpOnly secure cookie or secure storage
- Never expose refresh token in browser console or logs
- Calculate token expiration: `Date.now() + (expires_in * 1000)`

### User

User account information.

```json
{
  "id": "string", // User ID
  "email": "string", // User email (unique)
  "username": "string", // Display name
  "profile_picture_url": "string", // Avatar URL from OAuth provider
  "provider": "string", // OAuth provider (google, github)
  "role": "string" // User role (USER, ADMIN)
}
```

### CurrentPrice

Current gold price from a provider.

```json
{
  "provider": "string", // Provider name (SJC, PNJ, SBJ, WORLD_GOLD)
  "buy_price": "decimal", // Provider's buying price
  "sell_price": "decimal", // Provider's selling price
  "unit": "CHI|LUONG|OZ", // Unit of measurement
  "unit_display_name": "string", // Human-readable unit name
  "currency": "string", // ISO 4217 currency code (VND, USD)
  "updated_at": "datetime" // Last price update (ISO 8601)
}
```

**Business Rules**:

- `buy_price` ≤ `sell_price` (provider's buying price is always lower than selling price)
- Vietnamese providers typically use `CHI` unit with `VND` currency
- International providers use `OZ` unit with `USD` currency
- Prices are updated periodically (frequency varies by provider)

### AllPricesResponse

Collection of current prices from all providers.

```json
{
  "timestamp": "datetime", // ISO 8601 response generation time
  "providers": [
    {
      // Array of CurrentPrice objects
      "provider": "string",
      "buy_price": "decimal",
      "sell_price": "decimal",
      "unit": "string",
      "unit_display_name": "string",
      "currency": "string",
      "updated_at": "datetime"
    }
  ]
}
```

### Pagination Metadata

Pagination information for list endpoints.

```json
{
  "current_page": 1, // Current page number (1-indexed)
  "page_size": 20, // Items per page
  "total_items": 45, // Total number of items across all pages
  "total_pages": 3, // Total number of pages
  "has_next": true, // Whether there's a next page
  "has_previous": false // Whether there's a previous page
}
```

### Error Response

Standard error response format.

```json
{
  "error": "string", // Error code (e.g., VALIDATION_ERROR)
  "message": "string", // Human-readable error message
  "timestamp": "string" // ISO 8601 timestamp
}
```

### Unit Enum

Gold measurement units supported by the system.

| Unit    | Display Name | Description                   | Weight                    | Common Pairing |
| ------- | ------------ | ----------------------------- | ------------------------- | -------------- |
| `CHI`   | Chỉ          | Vietnamese unit (most common) | ~3.75g per chỉ            | VND currency   |
| `LUONG` | Lượng        | Vietnamese unit               | ~37.5g (10 chỉ = 1 lượng) | VND currency   |
| `OZ`    | Oz           | Troy ounce (international)    | ~31.1g                    | USD currency   |

**Default**: If `unit` is not specified in transaction creation, defaults to `CHI`.

**Unit-Currency Pairing Guidelines**:

- **CHI** ↔ **VND**: Vietnamese chỉ with Vietnamese Dong
- **LUONG** ↔ **VND**: Vietnamese lượng with Vietnamese Dong
- **OZ** ↔ **USD**: Troy ounce with US Dollar

> **Note**: The system allows unusual pairings (e.g., CHI with USD) but logs a warning. All pairings are accepted to support edge cases.

**Conversion Reference**:

- 1 lượng = 10 chỉ ≈ 37.5 grams
- 1 chỉ ≈ 3.75 grams
- 1 troy oz ≈ 31.1 grams

---

## Code Examples

### JavaScript/TypeScript (Axios)

#### Setup

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

#### OAuth Login Flow

```typescript
// Step 1: Get authorization URL
async function getAuthUrl(redirectUri: string): Promise<string> {
  const response = await apiClient.get(
    `/auth/oauth/google/url?redirectUri=${encodeURIComponent(redirectUri)}`
  );

  // Save state for verification
  localStorage.setItem('oauth_state', response.data.state);

  return response.data.authorization_url;
}

// Step 2: Handle OAuth callback
async function handleOAuthCallback(code: string, state: string) {
  // Verify state matches
  const savedState = localStorage.getItem('oauth_state');
  if (state !== savedState) {
    throw new Error('Invalid state token');
  }

  const response = await apiClient.post('/auth/oauth/google/callback', {
    code,
    state,
  });

  // Save token
  localStorage.setItem('auth_token', response.data.token);

  return response.data;
}

// Step 3: Get current user
async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}
```

#### Create Transaction

```typescript
import { v4 as uuidv4 } from 'uuid';

interface CreateTransactionParams {
  type: 'BUY' | 'SELL';
  quantity: number;
  unit?: 'CHI' | 'LUONG' | 'OZ';
  pricePerUnit: number;
  currency?: string;
  provider?: string;
  transactionDate?: string;
  notes?: string;
}

async function createTransaction(params: CreateTransactionParams) {
  try {
    const response = await apiClient.post('/transactions', {
      idempotency_key: uuidv4(), // Generate fresh UUID for each request
      type: params.type,
      quantity: params.quantity,
      unit: params.unit || 'CHI',
      price_per_unit: params.pricePerUnit,
      currency: params.currency || 'VND',
      provider: params.provider,
      transaction_date: params.transactionDate || new Date().toISOString(),
      notes: params.notes,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.error('Duplicate transaction detected');
    }
    throw error;
  }
}

// Example usage
const newTransaction = await createTransaction({
  type: 'BUY',
  quantity: 10.5,
  unit: 'CHI',
  pricePerUnit: 75000000,
  provider: 'SJC',
  notes: 'Purchase from SJC District 1',
});
```

#### Get Transactions with Filters

```typescript
interface GetTransactionsParams {
  page?: number;
  pageSize?: number;
  type?: 'BUY' | 'SELL';
  startDate?: string;
  endDate?: string;
}

async function getTransactions(params: GetTransactionsParams = {}) {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.type) queryParams.append('type', params.type);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await apiClient.get(`/transactions?${queryParams}`);
  return response.data;
}

// Example: Get BUY transactions
const buyTransactions = await getTransactions({ type: 'BUY', pageSize: 10 });

// Example: Get transactions for January 2026
const januaryTransactions = await getTransactions({
  startDate: '2026-01-01T00:00:00',
  endDate: '2026-01-31T23:59:59',
});
```

---

### Python (Requests)

#### Setup

```python
import requests
from uuid import uuid4
from datetime import datetime

API_BASE_URL = 'http://localhost:8080/api/v1'
auth_token = None

def get_headers():
    headers = {'Content-Type': 'application/json'}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    return headers
```

#### OAuth Login Flow

```python
def get_auth_url(redirect_uri: str) -> dict:
    """Get OAuth authorization URL."""
    response = requests.get(
        f'{API_BASE_URL}/auth/oauth/google/url',
        params={'redirectUri': redirect_uri}
    )
    response.raise_for_status()
    return response.json()

def handle_oauth_callback(code: str, state: str) -> dict:
    """Exchange OAuth code for JWT token."""
    global auth_token

    response = requests.post(
        f'{API_BASE_URL}/auth/oauth/google/callback',
        json={'code': code, 'state': state},
        headers={'Content-Type': 'application/json'}
    )
    response.raise_for_status()

    data = response.json()
    auth_token = data['token']  # Save token for subsequent requests
    return data

def get_current_user() -> dict:
    """Get current authenticated user."""
    response = requests.get(
        f'{API_BASE_URL}/auth/me',
        headers=get_headers()
    )
    response.raise_for_status()
    return response.json()
```

#### Create Transaction

```python
from decimal import Decimal

def create_transaction(
    transaction_type: str,
    quantity: Decimal,
    price_per_unit: Decimal,
    currency: str = 'VND',
    provider: str = None,
    transaction_date: str = None,
    notes: str = None
) -> dict:
    """Create a new gold transaction."""

    payload = {
        'idempotency_key': str(uuid4()),  # Generate fresh UUID
        'type': transaction_type,
        'quantity': float(quantity),
        'price_per_unit': float(price_per_unit),
        'currency': currency,
    }

    if provider:
        payload['provider'] = provider
    if transaction_date:
        payload['transaction_date'] = transaction_date
    else:
        payload['transaction_date'] = datetime.now().isoformat()
    if notes:
        payload['notes'] = notes

    response = requests.post(
        f'{API_BASE_URL}/transactions',
        json=payload,
        headers=get_headers()
    )

    if response.status_code == 409:
        raise ValueError('Duplicate transaction detected')

    response.raise_for_status()
    return response.json()

# Example usage
transaction = create_transaction(
    transaction_type='BUY',
    quantity=Decimal('10.5'),
    price_per_unit=Decimal('75000000'),
    provider='SJC',
    notes='Purchase from SJC District 1'
)
```

#### Get Transactions

```python
def get_transactions(
    page: int = 1,
    page_size: int = 20,
    transaction_type: str = None,
    start_date: str = None,
    end_date: str = None
) -> dict:
    """Get transactions with filters."""

    params = {
        'page': page,
        'pageSize': page_size,
    }

    if transaction_type:
        params['type'] = transaction_type
    if start_date and end_date:
        params['startDate'] = start_date
        params['endDate'] = end_date

    response = requests.get(
        f'{API_BASE_URL}/transactions',
        params=params,
        headers=get_headers()
    )
    response.raise_for_status()
    return response.json()

# Example: Get all BUY transactions
buy_transactions = get_transactions(transaction_type='BUY')

# Example: Get transactions for January 2026
january_transactions = get_transactions(
    start_date='2026-01-01T00:00:00',
    end_date='2026-01-31T23:59:59'
)
```

---

### Java (HttpClient)

#### Setup

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

public class GoldLogApiClient {
    private static final String API_BASE_URL = "http://localhost:8080/api/v1";
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private String authToken;

    public GoldLogApiClient() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        this.objectMapper = new ObjectMapper();
        this.objectMapper.setPropertyNamingStrategy(
            PropertyNamingStrategies.SNAKE_CASE
        );
    }

    private HttpRequest.Builder buildRequest(String path) {
        var builder = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE_URL + path))
            .header("Content-Type", "application/json");

        if (authToken != null) {
            builder.header("Authorization", "Bearer " + authToken);
        }

        return builder;
    }
}
```

#### Create Transaction

```java
import java.math.BigDecimal;
import java.util.UUID;

public class CreateTransactionRequest {
    private String idempotencyKey;
    private String type;
    private BigDecimal quantity;
    private BigDecimal pricePerUnit;
    private String currency;
    private String provider;
    private String transactionDate;
    private String notes;

    // Getters and setters...
}

public TransactionResponse createTransaction(CreateTransactionRequest request)
    throws Exception {

    // Ensure fresh UUID for each request
    request.setIdempotencyKey(UUID.randomUUID().toString());

    String requestBody = objectMapper.writeValueAsString(request);

    HttpRequest httpRequest = buildRequest("/transactions")
        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
        .build();

    HttpResponse<String> response = httpClient.send(
        httpRequest,
        HttpResponse.BodyHandlers.ofString()
    );

    if (response.statusCode() == 409) {
        throw new IllegalStateException("Duplicate transaction");
    }

    if (response.statusCode() != 201) {
        throw new RuntimeException("API error: " + response.body());
    }

    return objectMapper.readValue(
        response.body(),
        TransactionResponse.class
    );
}
```

---

### Token Refresh Implementation (Client-Side)

#### Automatic Token Refresh Pattern

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

// Token storage (use secure storage in production)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiresAt: number | null = null;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Add access token to requests
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Check if error is TOKEN_EXPIRED and we haven't retried yet
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === 'TOKEN_EXPIRED' &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true;

      try {
        // Refresh the access token
        const tokens = await refreshAccessToken(refreshToken);

        // Update stored tokens
        setTokens(tokens);

        // Retry the original request with new access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        handleLogout();
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

// Refresh access token
async function refreshAccessToken(token: string) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: token,
    });
    return response.data;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}

// Store tokens after login or refresh
function setTokens(tokens: {
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
}) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  tokenExpiresAt = Date.now() + tokens.access_token_expires_in * 1000;

  // Store in secure storage (httpOnly cookies recommended for refresh token)
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  localStorage.setItem('token_expires_at', tokenExpiresAt.toString());
}

// Handle logout
function handleLogout() {
  // Clear tokens
  accessToken = null;
  refreshToken = null;
  tokenExpiresAt = null;
  localStorage.clear();

  // Redirect to login
  window.location.href = '/login';
}

// Initialize tokens from storage on app startup
function initializeTokens() {
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  tokenExpiresAt = expiresAt ? parseInt(expiresAt) : null;

  // Check if access token is expired
  if (tokenExpiresAt && Date.now() >= tokenExpiresAt && refreshToken) {
    // Proactively refresh if expired
    refreshAccessToken(refreshToken).then(setTokens).catch(handleLogout);
  }
}

// Call on app initialization
initializeTokens();

export { apiClient, setTokens, handleLogout };
```

#### Usage Example

```typescript
import { apiClient, setTokens } from './api-client';

// After OAuth login
async function handleOAuthCallback(code: string, state: string) {
  const response = await apiClient.post('/auth/oauth/google/callback', {
    code,
    state,
  });

  // Store tokens - automatic refresh is now enabled
  setTokens(response.data);

  return response.data.user;
}

// Make API calls - token refresh happens automatically
async function createTransaction(data: any) {
  const response = await apiClient.post('/transactions', data);
  return response.data;
}

// Manual logout with refresh token
async function logout(allDevices: boolean = false) {
  const refreshToken = localStorage.getItem('refresh_token');

  if (refreshToken) {
    await apiClient.post('/auth/logout', {
      refresh_token: refreshToken,
      all_devices: allDevices,
    });
  }

  handleLogout();
}
```

#### React Hook Example

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from './api-client';

interface User {
  id: string;
  email: string;
  username: string;
  profile_picture_url: string;
  provider: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
      // Fetch current user
      apiClient
        .get('/auth/me')
        .then((response) => setUser(response.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { user, loading };
}
```

#### Security Best Practices

1. **Token Storage**:
   - Store refresh tokens in httpOnly cookies (most secure)
   - If using localStorage, implement XSS protection
   - Never log tokens or include in error reports

2. **Token Refresh**:
   - Implement automatic token refresh on 401 TOKEN_EXPIRED
   - Use a flag (`_retry`) to prevent infinite refresh loops
   - Clear tokens and redirect to login if refresh fails

3. **Error Handling**:
   - Distinguish between TOKEN_EXPIRED (refresh) and other 401 errors (re-login)
   - Handle REFRESH_TOKEN_EXPIRED gracefully with re-login
   - Show user-friendly messages for rate limiting

4. **Rate Limiting**:
   - Refresh endpoint allows 10 requests/minute per token
   - Implement exponential backoff if hitting rate limits
   - Don't refresh more frequently than necessary

5. **Logout**:
   - Always call logout endpoint to revoke tokens
   - Clear all stored tokens from memory and storage
   - Provide "logout from all devices" option for security

---

## Best Practices

### 1. Idempotency Keys

Always generate a fresh UUID v4 for each transaction attempt:

```typescript
// ✅ Good: Fresh UUID for each request
const transaction1 = await createTransaction({
  idempotency_key: uuidv4(),
  ...data,
});

// ❌ Bad: Reusing same UUID
const key = uuidv4();
const transaction1 = await createTransaction({ idempotency_key: key, ...data });
const transaction2 = await createTransaction({ idempotency_key: key, ...data }); // Will fail!
```

### 2. Error Handling

Always handle specific HTTP status codes:

```typescript
try {
  const transaction = await createTransaction(data);
} catch (error) {
  if (error.response?.status === 409) {
    // Handle duplicate transaction
    console.error('This transaction already exists');
  } else if (error.response?.status === 400) {
    // Handle validation error
    console.error('Invalid data:', error.response.data.message);
  } else if (error.response?.status === 401) {
    // Handle authentication error - redirect to login
    redirectToLogin();
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### 3. Token Management

Implement proper token lifecycle management:

```typescript
// Store tokens after login or refresh
function storeTokens(response: LoginResponse) {
  // Store access token (consider memory-only for security)
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem(
    'access_token_expires_at',
    (Date.now() + response.access_token_expires_in * 1000).toString()
  );

  // Store refresh token (httpOnly cookie is more secure)
  localStorage.setItem('refresh_token', response.refresh_token);
  localStorage.setItem(
    'refresh_token_expires_at',
    (Date.now() + response.refresh_token_expires_in * 1000).toString()
  );
}

// Check if access token is expired
function isAccessTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('access_token_expires_at');
  return !expiresAt || Date.now() >= parseInt(expiresAt);
}

// Proactive token refresh (refresh before expiration)
function shouldRefreshToken(): boolean {
  const expiresAt = localStorage.getItem('access_token_expires_at');
  if (!expiresAt) return false;

  // Refresh 1 minute before expiration
  return Date.now() >= parseInt(expiresAt) - 60000;
}

// Use automatic refresh with interceptors (see examples above)
// Or manually refresh when needed
if (shouldRefreshToken()) {
  await refreshAccessToken();
}
```

### 4. Date Handling

Always use ISO 8601 format for dates:

```typescript
// ✅ Good: ISO 8601 format
const date = new Date().toISOString(); // "2026-01-30T10:30:00.123Z"

// For specific dates
const specificDate = new Date('2026-01-30T10:30:00').toISOString();
```

### 5. Pagination

Handle pagination efficiently:

```typescript
async function getAllTransactions() {
  const allTransactions = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getTransactions({ page, pageSize: 100 });
    allTransactions.push(...response.data);
    hasMore = response.pagination.has_next;
    page++;
  }

  return allTransactions;
}
```

---

## Support

For questions or issues:

- **GitHub**: [github.com/yourorg/gold-log](https://github.com/yourorg/gold-log)
- **Email**: support@goldlog.example.com
- **Documentation**: [docs.goldlog.example.com](https://docs.goldlog.example.com)

---

## Changelog

### Version 1.0.0 (2026-01-30)

- Initial API release
- OAuth 2.0 authentication (Google)
- Transaction CRUD operations
- Idempotency protection
- Pagination support
- Multi-currency support (VND, USD)
