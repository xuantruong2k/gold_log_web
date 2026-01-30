# Gold Log API Documentation

**Version**: 1.0.0
**Base URL**: `http://localhost:8080/api/v1` (configurable)
**Last Updated**: January 30, 2026

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
6. [Data Models](#data-models)
7. [Code Examples](#code-examples)

---

## Overview

Gold Log is a backend service for tracking gold trading transactions with real-time profit/loss calculations. The API follows RESTful conventions and returns JSON responses.

### Key Features

- **OAuth 2.0 Authentication**: Google OAuth integration with JWT tokens
- **Transaction Management**: Create, read, and delete gold transactions
- **Idempotency Protection**: Prevent duplicate transactions using UUID v4 keys
- **Pagination**: Efficient pagination for transaction listings
- **Multi-currency Support**: VND (default) and USD currencies

### API Conventions

- **JSON Naming**: All API fields use `snake_case` (e.g., `transaction_date`, `price_per_unit`)
- **HTTP Methods**: Standard REST verbs (GET, POST, DELETE)
- **Status Codes**: Standard HTTP status codes (200, 201, 204, 400, 401, 404, 500)
- **Timestamps**: ISO 8601 format (e.g., `2026-01-30T10:30:00Z`)
- **Currency**: ISO 4217 codes (e.g., `VND`, `USD`)

---

## Authentication

### OAuth 2.0 Flow

Gold Log uses OAuth 2.0 with JWT tokens for authentication.

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
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

### Protected Endpoints

For protected endpoints, include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

| Status Code | Error Code              | Description                                  |
| ----------- | ----------------------- | -------------------------------------------- |
| 400         | `VALIDATION_ERROR`      | Request validation failed                    |
| 401         | `UNAUTHORIZED`          | Missing or invalid authentication token      |
| 404         | `NOT_FOUND`             | Requested resource not found                 |
| 409         | `DUPLICATE_TRANSACTION` | Transaction with same idempotency key exists |
| 429         | `RATE_LIMIT_EXCEEDED`   | Too many requests                            |
| 500         | `INTERNAL_SERVER_ERROR` | Unexpected server error                      |

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

Logout and invalidate current JWT token.

**Authentication**: Required (JWT)
**Rate Limit**: None

**Response**: `204 No Content`

**Errors**:

- `401`: Missing or invalid authentication token

**Example**:

```bash
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
| `quantity`         | decimal  | Yes      | > 0, max 10 digits + 6 decimals | Gold quantity (in chỉ or grams)         |
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

Store and refresh JWT tokens properly:

```typescript
// Store token after login
localStorage.setItem('auth_token', loginResponse.token);
localStorage.setItem('token_expires_at', Date.now() + loginResponse.expires_in * 1000);

// Check expiration before API calls
function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  return !expiresAt || Date.now() >= parseInt(expiresAt);
}

// Redirect to login if token expired
if (isTokenExpired()) {
  redirectToLogin();
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
