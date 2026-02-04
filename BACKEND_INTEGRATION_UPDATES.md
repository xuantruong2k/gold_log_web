# Backend Integration Updates

## Overview

Updated the frontend to match the backend's dual-token authentication implementation. The backend has implemented the OAuth 2.0 + JWT system with access tokens and refresh tokens.

---

## Key Changes

### 1. Response Structure Updates

#### Before (Expected):
```json
{
  "token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": {...}
}
```

#### After (Actual Backend Response):
```json
{
  "access_token": "...",
  "access_token_expires_in": 900,
  "refresh_token": "...",
  "refresh_token_expires_in": 2592000,
  "token_type": "Bearer",
  "user": {...}
}
```

### 2. Token Expiration Times

| Token Type | Duration | Seconds |
|------------|----------|---------|
| Access Token | 15 minutes | 900 |
| Refresh Token | 30 days | 2,592,000 |

### 3. Files Updated

#### a. API Types (`src/api/types.ts`)

**Changed:**
- `token` → `access_token`
- `expires_in` → `access_token_expires_in`
- `refresh_token?` → `refresh_token` (now required)
- **Added:** `refresh_token_expires_in` field

```typescript
export interface ApiLoginResponse {
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  user: ApiUser;
}
```

#### b. Domain Types (`src/types/user.types.ts`)

**Changed:**
- `token` → `accessToken`
- `expiresIn` → `accessTokenExpiresIn`
- `refreshToken?` → `refreshToken` (required)
- **Added:** `refreshTokenExpiresIn`

```typescript
export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  tokenType: string;
  user: User;
}
```

#### c. Transformers (`src/api/transformers.ts`)

Updated to map new field names:
```typescript
export function apiLoginResponseToLoginResponse(apiResponse: ApiLoginResponse): LoginResponse {
  return {
    accessToken: apiResponse.access_token,
    accessTokenExpiresIn: apiResponse.access_token_expires_in,
    refreshToken: apiResponse.refresh_token,
    refreshTokenExpiresIn: apiResponse.refresh_token_expires_in,
    tokenType: apiResponse.token_type,
    user: apiUserToUser(apiResponse.user),
  };
}
```

#### d. useAuth Hook (`src/hooks/useAuth.ts`)

**Changes:**
1. Store both token expiration times:
   - `token_expires_at` (access token)
   - `refresh_token_expires_at` (refresh token)

2. Logout now sends refresh token to backend:
```typescript
const refreshToken = localStorage.getItem('refresh_token');
await authApi.logout(refreshToken || undefined);
```

3. Clean up both expiration times on logout

#### e. Refresh Interceptor (`src/api/refresh-interceptor.ts`)

Updated to use backend's response structure:
```typescript
const {
  access_token,
  refresh_token: newRefreshToken,
  access_token_expires_in: expiresIn
} = response.data;
```

#### f. Proactive Refresh Hook (`src/hooks/useProactiveTokenRefresh.ts`)

Updated to use backend's response structure:
```typescript
const {
  access_token: newToken,
  refresh_token: newRefreshToken,
  access_token_expires_in: expiresIn
} = response.data;
```

#### g. Logout API (`src/api/auth.api.ts`)

Enhanced to support refresh token revocation:
```typescript
async logout(refreshToken?: string, allDevices?: boolean): Promise<void> {
  const body: { refresh_token?: string; all_devices?: boolean } = {};

  if (refreshToken) {
    body.refresh_token = refreshToken;
  }

  if (allDevices !== undefined) {
    body.all_devices = allDevices;
  }

  await apiClient.post('/auth/logout', body);
}
```

---

## Backend Implementation Features

### 1. Token Rotation
- **Enabled by default**
- New refresh token issued on each refresh
- Old refresh token becomes invalid after successful refresh

### 2. Device Limits
- Maximum **5 active refresh tokens** per user
- Oldest token automatically revoked when limit reached

### 3. Rate Limiting
- **10 refresh requests per minute** per token
- Prevents brute force attacks

### 4. Automatic Cleanup
- Expired tokens removed via database TTL
- No manual cleanup required

### 5. Logout Options
- **Single device**: Revokes specific refresh token
- **All devices**: Revokes all user's refresh tokens
- Access token blacklisted (expires after remaining lifetime, max 15 minutes)

---

## Frontend Token Management

### Storage Strategy

| Item | Storage | Key | Duration |
|------|---------|-----|----------|
| Access Token | Zustand Store | `token` | 15 minutes |
| Refresh Token | localStorage | `refresh_token` | 30 days |
| Access Token Expiry | localStorage | `token_expires_at` | - |
| Refresh Token Expiry | localStorage | `refresh_token_expires_at` | - |
| User Info | Zustand Store | `user` | Session |
| Auth Status | Zustand Store | `isAuthenticated` | Persisted |

### Automatic Refresh Flow

1. **Reactive Refresh (401 Error)**:
   - Axios interceptor catches 401 errors
   - Automatically calls refresh endpoint
   - Retries original request with new token
   - Queues concurrent requests during refresh

2. **Proactive Refresh (Before Expiration)**:
   - Checks every 5 minutes
   - Refreshes if token expires in < 10 minutes
   - Prevents user disruption
   - Silent refresh in background

### Error Handling

| Error | Status | Action |
|-------|--------|--------|
| `TOKEN_EXPIRED` | 401 | Auto-refresh with refresh token |
| `INVALID_REFRESH_TOKEN` | 401 | Logout and redirect to login |
| `REFRESH_TOKEN_EXPIRED` | 401 | Logout and redirect to login |
| `REFRESH_TOKEN_REVOKED` | 401 | Logout and redirect to login |
| `TOO_MANY_REQUESTS` | 429 | Show rate limit error, retry later |

---

## Testing Checklist

### ✅ OAuth Login Flow
- [x] Login redirects to Google OAuth
- [x] Callback saves access_token and refresh_token
- [x] Both expiration times saved to localStorage
- [x] User redirected to dashboard
- [x] User stays logged in on refresh

### ✅ Token Refresh
- [x] 401 error triggers automatic refresh
- [x] New access token and refresh token received
- [x] Original request retried successfully
- [x] Concurrent requests queued during refresh
- [x] Proactive refresh happens before expiration

### ✅ Logout
- [x] Logout sends refresh token to backend
- [x] All tokens cleared from storage
- [x] User redirected to landing page
- [x] User cannot access protected routes after logout

### ✅ Token Expiration
- [x] Access token expires after 15 minutes
- [x] Refresh token expires after 30 days
- [x] Expired refresh token redirects to login
- [x] User sees appropriate error messages

---

## Security Considerations

### ✅ Implemented
- HTTPS-only in production (configured in env)
- Access tokens stored in memory (Zustand)
- Refresh tokens in localStorage (acceptable for MVP)
- CSRF protection via OAuth state parameter
- Automatic token rotation
- Rate limiting on refresh endpoint
- Device limits (max 5 tokens per user)

### 🔄 Future Enhancements
- Move refresh token to httpOnly cookies
- Implement token fingerprinting
- Add suspicious activity detection
- Implement token revocation UI (view/revoke devices)

---

## API Endpoints Used

### 1. OAuth Authorization
```http
GET /auth/oauth/{provider}/url?redirectUri={redirectUri}
```

### 2. OAuth Callback
```http
POST /auth/oauth/{provider}/callback
Content-Type: application/json

{
  "code": "auth-code",
  "state": "csrf-token"
}
```

### 3. Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "uuid-v4"
}
```

### 4. Logout
```http
POST /auth/logout
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "refresh_token": "uuid-v4",
  "all_devices": false
}
```

### 5. Current User
```http
GET /auth/me
Authorization: Bearer {access_token}
```

---

## Version Information

- **Frontend Updated**: January 31, 2026
- **Backend API Version**: 1.0.0
- **Auth System**: OAuth 2.0 + JWT with dual-token rotation
- **Compatible Backend**: Javalin 6.x with dual-token implementation

---

## Migration Notes

### Breaking Changes from Previous Implementation

1. **Response Field Names**: All token-related fields renamed to match backend
2. **Refresh Token Required**: Refresh token is now always provided (not optional)
3. **Expiration Times**: Access token lifetime changed from 1 hour to 15 minutes
4. **Logout Payload**: Logout now accepts refresh token and all_devices flag

### No Breaking Changes for Users
- Existing sessions remain valid until token expiration
- Users will need to re-login after 15 minutes (down from 1 hour)
- Proactive refresh prevents disruption for active users

---

## Troubleshooting

### Issue: User logged out on refresh
**Solution**: isAuthenticated now persisted in Zustand store ✅

### Issue: Token refresh fails with 401
**Solution**: Check refresh token in localStorage, verify not expired

### Issue: Rate limit errors
**Solution**: Reduce proactive refresh frequency, respect 10 req/min limit

### Issue: "INVALID_REFRESH_TOKEN" error
**Solution**: Clear localStorage and re-login, token may be revoked or expired

---

## References

- [API Documentation](./API_DOCUMENTATION.md)
- [Hybrid Auth Implementation](./HYBRID_AUTH_IMPLEMENTATION.md)
- [Hybrid Auth Flow](./HYBRID_AUTH_FLOW.md)
- [Architecture Specification](./ARCHITECTURE.md)
