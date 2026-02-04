# Quick Reference: Token Fields

## Backend Response → Frontend Storage

### OAuth Callback & Refresh Response

Backend sends (snake_case):
```json
{
  "access_token": "eyJhbGc...",
  "access_token_expires_in": 900,
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "refresh_token_expires_in": 2592000,
  "token_type": "Bearer",
  "user": { ... }
}
```

Frontend transforms to (camelCase):
```typescript
{
  accessToken: "eyJhbGc...",
  accessTokenExpiresIn: 900,
  refreshToken: "550e8400-e29b-41d4-a716-446655440000",
  refreshTokenExpiresIn: 2592000,
  tokenType: "Bearer",
  user: { ... }
}
```

Frontend stores:
| Storage | Key | Value | Duration |
|---------|-----|-------|----------|
| Zustand | `token` | access_token | 15 min |
| Zustand | `user` | User object | Session |
| Zustand | `isAuthenticated` | true | Persisted |
| localStorage | `token_expires_at` | timestamp | - |
| localStorage | `refresh_token` | UUID v4 | 30 days |
| localStorage | `refresh_token_expires_at` | timestamp | - |

---

## Field Mapping Reference

| Backend (API) | Frontend (Domain) | Storage Location |
|--------------|------------------|------------------|
| `access_token` | `accessToken` | Zustand: `token` |
| `access_token_expires_in` | `accessTokenExpiresIn` | localStorage: `token_expires_at` |
| `refresh_token` | `refreshToken` | localStorage: `refresh_token` |
| `refresh_token_expires_in` | `refreshTokenExpiresIn` | localStorage: `refresh_token_expires_at` |
| `token_type` | `tokenType` | Not stored |
| `user.profile_picture_url` | `user.profilePictureUrl` | Zustand: `user` |

---

## Code Snippets

### Get Current Tokens
```typescript
import { useAuthStore } from '@/stores/authStore';

// Access token
const accessToken = useAuthStore.getState().token;

// Refresh token
const refreshToken = localStorage.getItem('refresh_token');

// Expiration times
const accessTokenExpiresAt = localStorage.getItem('token_expires_at');
const refreshTokenExpiresAt = localStorage.getItem('refresh_token_expires_at');
```

### Check Token Expiration
```typescript
function isAccessTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return true;
  return Date.now() >= parseInt(expiresAt);
}

function isRefreshTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('refresh_token_expires_at');
  if (!expiresAt) return true;
  return Date.now() >= parseInt(expiresAt);
}
```

### Manual Token Refresh
```typescript
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await apiClient.post('/auth/refresh', {
    refresh_token: refreshToken
  });

  const {
    access_token,
    refresh_token: newRefreshToken,
    access_token_expires_in: expiresIn
  } = response.data;

  // Update tokens
  useAuthStore.getState().setAuth(access_token, useAuthStore.getState().user!);

  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem('token_expires_at', expiresAt.toString());
  localStorage.setItem('refresh_token', newRefreshToken);
}
```

---

## Debugging Commands

### Check All Auth State
```javascript
// In browser console
console.log('Auth Store:', JSON.parse(localStorage.getItem('auth-storage')));
console.log('Access Token Expires:', new Date(parseInt(localStorage.getItem('token_expires_at'))));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
console.log('Refresh Token Expires:', new Date(parseInt(localStorage.getItem('refresh_token_expires_at'))));
console.log('Is Authenticated:', JSON.parse(localStorage.getItem('auth-storage'))?.state?.isAuthenticated);
```

### Force Token Expiration (Testing)
```javascript
// Force access token expiration
localStorage.setItem('token_expires_at', (Date.now() - 1000).toString());

// Force refresh token expiration
localStorage.setItem('refresh_token_expires_at', (Date.now() - 1000).toString());
```

### Clear All Auth Data
```javascript
localStorage.removeItem('auth-storage');
localStorage.removeItem('token_expires_at');
localStorage.removeItem('refresh_token');
localStorage.removeItem('refresh_token_expires_at');
sessionStorage.clear();
location.reload();
```

---

## Common Patterns

### Using Access Token for API Calls
```typescript
// Automatic via axios interceptor
import { apiClient } from '@/api/client';

// Token automatically added to Authorization header
const response = await apiClient.get('/transactions');
```

### Handling Token Expiration
```typescript
// Automatic via refresh interceptor
// Just make API calls normally - refresh happens automatically
try {
  const response = await apiClient.get('/transactions');
} catch (error) {
  // If refresh also fails, user is logged out
}
```

### Logout with Token Revocation
```typescript
import { useAuth } from '@/hooks/useAuth';

const { logout } = useAuth();

// Logout from current device
await logout();

// Logout from all devices (future feature)
// await logout(true); // Pass allDevices: true
```

---

## Response Examples

### Successful Login
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expires_in": 900,
  "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
  "refresh_token_expires_in": 2592000,
  "token_type": "Bearer",
  "user": {
    "id": "65b3f2a1c4e5d6f7a8b9c0d1",
    "email": "user@example.com",
    "username": "John Doe",
    "profile_picture_url": "https://...",
    "provider": "google",
    "role": "USER"
  }
}
```

### Token Expired Error
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Access token has expired. Use refresh token to obtain a new access token.",
  "timestamp": "2026-01-31T10:30:00Z"
}
```

### Invalid Refresh Token
```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token is invalid or has been revoked",
  "timestamp": "2026-01-31T10:30:00Z"
}
```

---

## Environment Variables

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1

# .env.production
VITE_API_BASE_URL=https://api.goldlog.com/api/v1
```

---

## Time Constants

| Duration | Seconds | Milliseconds | Human |
|----------|---------|--------------|-------|
| Access Token | 900 | 900,000 | 15 minutes |
| Refresh Token | 2,592,000 | 2,592,000,000 | 30 days |
| Proactive Refresh Check | 300 | 300,000 | 5 minutes |
| Proactive Refresh Threshold | 600 | 600,000 | 10 minutes |

---

## Status Codes

| Code | Error | Action |
|------|-------|--------|
| 200 | Success | Continue |
| 201 | Created | Continue |
| 204 | No Content | Continue |
| 400 | Validation Error | Show error |
| 401 | TOKEN_EXPIRED | Auto-refresh |
| 401 | INVALID_REFRESH_TOKEN | Logout |
| 401 | REFRESH_TOKEN_EXPIRED | Logout |
| 401 | REFRESH_TOKEN_REVOKED | Logout |
| 409 | Duplicate | Show error |
| 429 | Rate Limit | Wait & retry |
| 500 | Server Error | Show error |
