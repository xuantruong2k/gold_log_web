# Testing Guide: Backend Integration

## Quick Test Steps

### 1. OAuth Login Test

```bash
# Start the dev server
npm run dev
```

1. Navigate to http://localhost:5173
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify you land on dashboard
5. **Check browser console** for:
   ```
   Token expires at: [timestamp]
   Refresh token expires at: [timestamp]
   ```
6. **Check localStorage** (DevTools → Application → Local Storage):
   - `auth-storage` should contain: `token`, `user`, `isAuthenticated`
   - `token_expires_at` (15 minutes from now)
   - `refresh_token` (UUID v4 format)
   - `refresh_token_expires_at` (30 days from now)

---

### 2. Persistence Test

1. After logging in, refresh the page (F5)
2. **Expected**: You stay logged in ✅
3. **Check**: User info still displayed in header
4. **Check**: Can still access dashboard and transactions

---

### 3. Automatic Refresh Test (401 Error)

**Option A: Wait for Token Expiration**
1. Login and wait 15 minutes
2. Make an API request (e.g., view transactions)
3. **Expected**: Request automatically retried after token refresh
4. **Check console** for:
   ```
   Token expired, refreshing...
   Token refreshed successfully
   ```

**Option B: Force Token Expiration (Quick Test)**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Change `token_expires_at` to a past timestamp (e.g., `1609459200000`)
4. Try to view transactions page
5. **Expected**: Automatic refresh happens, transactions load successfully

---

### 4. Proactive Refresh Test

1. Login successfully
2. Open DevTools Console
3. Change `token_expires_at` to 9 minutes from now:
   ```javascript
   // In browser console
   const nineMinutesFromNow = Date.now() + 9 * 60 * 1000;
   localStorage.setItem('token_expires_at', nineMinutesFromNow.toString());
   ```
4. Wait 5 minutes (proactive refresh checks every 5 min)
5. **Expected**: Token automatically refreshes in background
6. **Check console** for:
   ```
   Proactive token refresh triggered
   Token refreshed successfully
   ```

---

### 5. Token Rotation Test

1. Login successfully
2. Note the `refresh_token` value in localStorage (let's call it TOKEN_A)
3. Force a token refresh (using Option B above)
4. Check `refresh_token` in localStorage again (should be TOKEN_B, different from TOKEN_A)
5. **Expected**: Refresh token changes after each refresh ✅

---

### 6. Logout Test

**Test 1: Normal Logout**
1. Login successfully
2. Click logout button (or profile menu → logout)
3. **Expected**:
   - Redirected to landing page
   - localStorage cleared (check: `refresh_token`, `token_expires_at` removed)
   - Zustand store cleared (check: `auth-storage` = null or empty)
   - Cannot access dashboard anymore (redirects to home)

**Test 2: Logout with Backend Verification**
1. Login successfully
2. Open DevTools → Network tab
3. Click logout
4. Check the POST request to `/auth/logout`:
   - Request body should contain: `{"refresh_token": "uuid-here"}`
   - Response: 204 No Content
5. **Expected**: Backend receives refresh token for revocation

---

### 7. Error Handling Tests

**Test 7.1: Invalid Refresh Token**
1. Login successfully
2. Open DevTools → Application → Local Storage
3. Change `refresh_token` to invalid value (e.g., "invalid-token")
4. Force token expiration (change `token_expires_at` to past)
5. Try to access transactions
6. **Expected**:
   - 401 error from refresh endpoint
   - User redirected to login page
   - localStorage cleared

**Test 7.2: Expired Refresh Token**
1. Login successfully
2. Change `refresh_token_expires_at` to past timestamp
3. Force access token expiration
4. Try to access transactions
5. **Expected**: Redirect to login (refresh token expired)

**Test 7.3: Network Error During Refresh**
1. Login successfully
2. Open DevTools → Network tab → Throttling → Offline
3. Force token expiration
4. Try to access transactions
5. **Expected**: Error message shown, user not logged out
6. Go online and retry - should work

---

### 8. Concurrent Requests Test

1. Login successfully
2. Force token expiration (past timestamp in `token_expires_at`)
3. Open multiple tabs/windows with the app
4. In all tabs simultaneously, try to:
   - View transactions
   - View dashboard
   - View gold prices
5. **Expected**:
   - Only ONE refresh request sent to backend
   - All requests queued and retried after refresh
   - All tabs work correctly after refresh

**How to verify:**
- Check Network tab: only ONE `/auth/refresh` request
- Check console: "Token refresh in progress, queueing request" messages

---

### 9. Rate Limiting Test (Backend Limit: 10 req/min)

**Don't actually do this in production!**

1. Login successfully
2. Open DevTools Console
3. Run this script to trigger multiple refreshes:
   ```javascript
   // Force 11 refresh attempts
   async function testRateLimit() {
     const token = localStorage.getItem('refresh_token');
     for (let i = 0; i < 11; i++) {
       try {
         const response = await fetch('http://localhost:8080/api/v1/auth/refresh', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ refresh_token: token })
         });
         console.log(`Request ${i + 1}: ${response.status}`);
       } catch (err) {
         console.error(`Request ${i + 1} failed:`, err);
       }
     }
   }
   testRateLimit();
   ```
4. **Expected**:
   - First 10 requests: 200 OK
   - 11th request: 429 Too Many Requests

---

## Manual Testing Checklist

Use this checklist to verify all functionality:

### Authentication
- [ ] OAuth login redirects to Google
- [ ] Callback saves tokens and expiration times
- [ ] User info displayed after login
- [ ] User stays logged in on page refresh
- [ ] User can access protected routes

### Token Management
- [ ] Access token saved in Zustand store
- [ ] Refresh token saved in localStorage
- [ ] Both expiration times saved correctly
- [ ] Access token expires after 15 minutes (configurable)
- [ ] Refresh token expires after 30 days

### Automatic Refresh (Reactive)
- [ ] 401 error triggers refresh
- [ ] Original request retried after refresh
- [ ] New tokens saved correctly
- [ ] Token rotation works (new refresh token)
- [ ] Concurrent requests queued during refresh

### Proactive Refresh
- [ ] Check runs every 5 minutes
- [ ] Refresh triggered when < 10 min remaining
- [ ] Silent refresh (no user disruption)
- [ ] Visual indicator shows during refresh
- [ ] New tokens saved correctly

### Logout
- [ ] Logout sends refresh token to backend
- [ ] All tokens cleared from storage
- [ ] User redirected to landing page
- [ ] Cannot access protected routes after logout
- [ ] Backend receives revocation request

### Error Handling
- [ ] Invalid refresh token → redirect to login
- [ ] Expired refresh token → redirect to login
- [ ] Network error → error message shown
- [ ] Rate limit → appropriate error message
- [ ] All errors logged to console

### UI/UX
- [ ] Loading states shown during auth operations
- [ ] Error messages displayed clearly
- [ ] Success notifications for login/logout
- [ ] Token refresh indicator (optional)
- [ ] Responsive on mobile devices

---

## Automated Testing

Run the test suite:

```bash
# Unit tests
npm run test

# Type checking
npm run type-check

# Lint
npm run lint

# All checks
npm run validate
```

---

## Debugging Tips

### Check Token State
```javascript
// In browser console
console.log('Auth Store:', JSON.parse(localStorage.getItem('auth-storage')));
console.log('Access Token Expires:', new Date(parseInt(localStorage.getItem('token_expires_at'))));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
console.log('Refresh Token Expires:', new Date(parseInt(localStorage.getItem('refresh_token_expires_at'))));
```

### Monitor Token Refresh
```javascript
// Add to browser console to monitor refreshes
window.addEventListener('storage', (e) => {
  if (e.key === 'auth-storage' || e.key === 'refresh_token') {
    console.log('Token updated:', e.key, e.newValue);
  }
});
```

### Test Token Expiration
```javascript
// Force token expiration for testing
localStorage.setItem('token_expires_at', (Date.now() - 1000).toString());
```

### Clear All Auth Data
```javascript
// Reset authentication state
localStorage.removeItem('auth-storage');
localStorage.removeItem('token_expires_at');
localStorage.removeItem('refresh_token');
localStorage.removeItem('refresh_token_expires_at');
sessionStorage.clear();
location.reload();
```

---

## Common Issues & Solutions

### Issue: "User logged out on refresh"
**Solution**: Check that `isAuthenticated` is in Zustand persist config ✅

### Issue: "Token refresh fails with 401"
**Diagnosis**:
1. Check refresh token format (should be UUID v4)
2. Check refresh token expiration
3. Check backend is running
4. Verify refresh endpoint URL correct

### Issue: "Infinite refresh loop"
**Diagnosis**:
1. Check backend returns correct field names (`access_token`, not `token`)
2. Verify token saved to store after refresh
3. Check axios interceptor not triggering on refresh endpoint itself

### Issue: "Proactive refresh not working"
**Diagnosis**:
1. Check `useProactiveTokenRefresh` is called in App.tsx
2. Verify 5-minute interval running
3. Check token expiration calculation correct
4. Look for console logs

---

## Backend Requirements

Ensure your backend is running with these endpoints:

```bash
# Health check
curl http://localhost:8080/api/v1/health

# OAuth authorization URL
curl "http://localhost:8080/api/v1/auth/oauth/google/url?redirectUri=http://localhost:5173/auth/callback/google"

# Token refresh (test with valid refresh token)
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-uuid-v4-token"}'

# Logout (test with valid tokens)
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "your-refresh-token"}'
```

---

## Success Criteria

All tests should pass:
- ✅ OAuth login works
- ✅ User stays logged in on refresh
- ✅ Automatic token refresh on 401
- ✅ Proactive token refresh before expiration
- ✅ Token rotation (new refresh token each time)
- ✅ Logout revokes tokens
- ✅ Error handling works correctly
- ✅ No TypeScript errors
- ✅ No console errors (except expected test cases)

---

## Next Steps After Testing

1. **If all tests pass**: Deploy to staging/production
2. **If tests fail**: Check [BACKEND_INTEGRATION_UPDATES.md](./BACKEND_INTEGRATION_UPDATES.md) for troubleshooting
3. **Optional enhancements**:
   - Add token revocation UI (view/manage devices)
   - Move refresh token to httpOnly cookies
   - Add suspicious activity detection
   - Implement remember me feature
