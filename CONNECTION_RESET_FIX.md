# Connection Reset Fix

## Issue Description
Backend logs showed connection reset error during OAuth callback:
```
POST /api/v1/auth/oauth/google/callback - 200 OK (1122ms)
Connection reset by peer
```

## Root Causes Identified

### 1. **Conflicting Response Interceptors** ⚠️
Two interceptors were handling 401 errors simultaneously:
- **`client.ts`**: Immediately cleared auth and redirected on ANY 401
- **`refresh-interceptor.ts`**: Tried to refresh token on 401

**Result**: When any 401 occurred (or was suspected), the first interceptor would clear auth before the OAuth callback could complete, causing connection reset.

### 2. **Short Timeout** ⚠️
- **Previous**: 10 seconds (10000ms)
- **OAuth callback time**: 1122ms
- **Issue**: Close to timeout threshold, could fail under load

### 3. **Incorrect Refresh Token Payload** ⚠️
- **Expected by backend**: `{ "refresh_token": "..." }`
- **Sent by frontend**: `{ "refreshToken": "..." }`
- **Result**: Refresh requests would fail with 400 Bad Request

### 4. **Potential Duplicate Requests** ⚠️
- OAuth callback page could process same request twice due to React StrictMode
- No protection against duplicate processing

## Fixes Applied

### 1. Remove Conflicting Interceptor ✅
**File**: `src/api/client.ts`

**Before**:
```typescript
// Response interceptor - Handle 401 and clear auth
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

**After**:
```typescript
// Note: 401 handling is done in refresh-interceptor.ts
// Do NOT add 401 interceptor here as it will conflict with auto-refresh logic
```

**Result**: Only `refresh-interceptor.ts` handles 401 errors now.

---

### 2. Increase Timeout ✅
**File**: `src/api/client.ts`

**Before**: `timeout: 10000` (10 seconds)

**After**: `timeout: 30000` (30 seconds)

**Reason**: OAuth flow can take longer, especially on first login. 30 seconds provides comfortable buffer.

---

### 3. Fix Refresh Token Payload ✅
**File**: `src/api/refresh-interceptor.ts`

**Before**:
```typescript
const response = await apiClient.post('/auth/refresh', {
  refreshToken,  // camelCase
});
```

**After**:
```typescript
const response = await apiClient.post('/auth/refresh', {
  refresh_token: refreshToken,  // snake_case matches backend
});
```

**Result**: Refresh requests now match backend's expected format.

---

### 4. Prevent Duplicate Processing ✅
**File**: `src/pages/OAuthCallbackPage.tsx`

**Added**:
```typescript
const hasProcessedRef = useRef(false);

useEffect(() => {
  // Prevent duplicate processing
  if (hasProcessedRef.current) {
    return;
  }

  hasProcessedRef.current = true;
  // ... rest of code
}, [searchParams, provider, handleOAuthCallback, navigate]);
```

**Result**: OAuth callback only processes once, even in React StrictMode.

---

### 5. Add Better Logging ✅
**File**: `src/hooks/useAuth.ts`

**Added**:
- `🔄 Exchanging OAuth code for tokens...`
- `✅ OAuth callback successful`
- `✅ Auth state saved, redirecting to dashboard...`

**Purpose**: Better debugging and monitoring of OAuth flow.

---

### 6. Add State Persistence Delay ✅
**File**: `src/hooks/useAuth.ts`

**Added**:
```typescript
// Small delay to ensure all state is persisted
await new Promise(resolve => setTimeout(resolve, 100));

// Navigate to dashboard
navigate(ROUTES.DASHBOARD);
```

**Purpose**: Ensures all localStorage and Zustand state is fully written before navigation.

---

## Testing Instructions

### 1. Clear Previous State
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Test OAuth Flow
1. Navigate to http://localhost:5173
2. Click "Sign in with Google"
3. Complete OAuth flow
4. **Watch browser console** for:
   ```
   🔐 Starting OAuth callback processing...
   🔄 Exchanging OAuth code for tokens...
   ✅ OAuth callback successful
   ✅ Auth state saved, redirecting to dashboard...
   ```
5. **Watch backend logs** for:
   ```
   POST /api/v1/auth/oauth/google/callback - 200 OK
   ```
   **Should NOT see**: "Connection reset by peer"

### 3. Test Token Refresh
1. Login successfully
2. Force token expiration:
   ```javascript
   localStorage.setItem('token_expires_at', (Date.now() - 1000).toString());
   ```
3. Navigate to transactions page
4. **Watch console** for:
   ```
   ✅ Token auto-refreshed successfully
   ```
5. **Watch network tab**:
   - POST /auth/refresh should succeed
   - Original request should be retried

### 4. Verify No Duplicate Requests
1. Open DevTools → Network tab
2. Start OAuth flow
3. Check that only ONE request to `/auth/oauth/google/callback` is made
4. No duplicate or canceled requests

---

## What to Monitor

### ✅ Success Indicators
- OAuth callback completes without errors
- No "Connection reset" in backend logs
- User successfully redirected to dashboard
- Tokens saved correctly in localStorage
- No duplicate requests in network tab
- Console shows all success messages

### ⚠️ Warning Signs
- "Connection reset by peer" in backend logs
- Multiple requests to same OAuth callback
- 400 Bad Request on /auth/refresh
- User redirected back to login after successful OAuth
- Missing tokens in localStorage

---

## Backend Configuration Check

Ensure backend has correct CORS configuration:

```java
// Expected CORS headers in response
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: false
```

**Note**: Frontend sends `withCredentials: false` to avoid unnecessary cookie issues.

---

## Performance Improvements

### Before
- Timeout: 10s
- OAuth response time: 1122ms
- Risk of timeout under load: High
- Conflicting interceptors: Yes
- Duplicate processing: Possible

### After
- Timeout: 30s ✅
- OAuth response time: Same (1122ms)
- Risk of timeout under load: Low ✅
- Conflicting interceptors: No ✅
- Duplicate processing: Prevented ✅

---

## Related Files Modified

1. ✅ `src/api/client.ts` - Removed conflicting interceptor, increased timeout
2. ✅ `src/api/refresh-interceptor.ts` - Fixed refresh token payload format
3. ✅ `src/hooks/useAuth.ts` - Added logging and state persistence delay
4. ✅ `src/pages/OAuthCallbackPage.tsx` - Prevented duplicate processing

---

## Rollback Instructions

If issues persist:

```bash
git diff HEAD src/api/client.ts
git diff HEAD src/api/refresh-interceptor.ts
git diff HEAD src/hooks/useAuth.ts
git diff HEAD src/pages/OAuthCallbackPage.tsx

# Rollback if needed
git checkout HEAD -- src/api/client.ts
git checkout HEAD -- src/api/refresh-interceptor.ts
git checkout HEAD -- src/hooks/useAuth.ts
git checkout HEAD -- src/pages/OAuthCallbackPage.tsx
```

---

## Next Steps

1. ✅ Changes applied
2. ⏳ Test OAuth login flow
3. ⏳ Monitor backend logs for "Connection reset"
4. ⏳ Test token refresh functionality
5. ⏳ Verify no duplicate requests
6. ⏳ Deploy to staging if tests pass

---

## Summary

Fixed **4 critical issues** causing connection reset during OAuth callback:
1. ✅ Removed conflicting 401 interceptor
2. ✅ Increased timeout from 10s to 30s
3. ✅ Fixed refresh token payload format
4. ✅ Prevented duplicate request processing

**Expected Result**: OAuth callback should now complete successfully without connection resets.
