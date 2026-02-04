# Authentication Persistence Guide

This guide explains how authentication persistence works in Gold Log and what the backend needs to implement.

---

## Problem: User Logged Out on Page Refresh

**Issue**: After logging in successfully, refreshing the page caused the user to be automatically logged out.

**Root Cause**: The `isAuthenticated` flag in Zustand store was not being persisted to localStorage, so it defaulted to `false` on page refresh even though the token and user data were restored.

**Solution**: Added `isAuthenticated` to the Zustand persist `partialize` function.

---

## Current Frontend Implementation

### 1. **Authentication State Persistence** (Zustand)

**File**: `src/stores/authStore.ts`

```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated, // ✅ NOW PERSISTED
      }),
    }
  )
);
```

**What's Stored in localStorage**:
- ✅ `token`: JWT access token
- ✅ `user`: User profile (id, email, username, profilePictureUrl, provider, role)
- ✅ `isAuthenticated`: Boolean flag
- ✅ `token_expires_at`: Token expiration timestamp (separate from Zustand)
- ✅ `refresh_token`: Refresh token (if backend provides it)

### 2. **Token Expiration Monitoring**

**File**: `src/hooks/useTokenExpiration.ts`

Monitors token expiration every 60 seconds and logs out users when token expires.

```typescript
useEffect(() => {
  const checkTokenExpiration = () => {
    const expiresAtStr = localStorage.getItem('token_expires_at');
    if (!expiresAtStr) return;

    const expiresAt = parseInt(expiresAtStr, 10);
    const now = Date.now();
    const timeRemaining = expiresAt - now;

    if (timeRemaining <= 0) {
      console.log('🔐 Token expired, logging out...');
      clearAuth();
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem('refresh_token');
    }
  };

  const intervalId = setInterval(checkTokenExpiration, 60000); // Check every 60 seconds
  return () => clearInterval(intervalId);
}, [clearAuth]);
```

### 3. **OAuth Login Flow**

**File**: `src/hooks/useAuth.ts`

Saves token, user, and expiration time after successful OAuth callback:

```typescript
// Exchange code for token
const response = await authApi.handleOAuthCallback(provider, { code, state });

// Save auth state
setAuth(response.token, response.user);

// Calculate token expiration time
const expiresAt = Date.now() + response.expiresIn * 1000;
localStorage.setItem('token_expires_at', expiresAt.toString());

// Save refresh token if provided
if (response.refreshToken) {
  localStorage.setItem('refresh_token', response.refreshToken);
}
```

### 4. **Automatic Token Refresh** (Optional)

**File**: `src/api/refresh-interceptor.ts`

Automatically refreshes expired tokens using refresh token endpoint:

```typescript
// Intercepts 401 responses and attempts to refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      const response = await apiClient.post('/auth/refresh', { refreshToken });

      // Update tokens and retry original request
      setAuth(response.data.token, user);
      localStorage.setItem('refresh_token', response.data.refreshToken);
    }
  }
);
```

---

## Backend Requirements (Javalin)

### Option 1: **Quick Fix - Increase Token Expiration**

**Current**: Tokens expire after 1 hour (3600 seconds)
**Recommendation**: Increase to 7 days or more

```kotlin
// In your JWT token generation
val expiresIn = 604800 // 7 days in seconds

// Or use "Remember Me" pattern
val expiresIn = if (rememberMe) 2592000 else 3600 // 30 days vs 1 hour
```

**Pros**:
- ✅ Simple to implement
- ✅ No database changes needed
- ✅ Works immediately

**Cons**:
- ❌ Less secure (longer-lived tokens)
- ❌ No way to revoke tokens early
- ❌ Users stay logged in even after long inactivity

---

### Option 2: **Best Practice - Implement Refresh Tokens**

This is the industry-standard approach used by Google, Facebook, GitHub, etc.

#### 2.1. Create Refresh Token Endpoint

```kotlin
// POST /api/v1/auth/refresh
app.post("/api/v1/auth/refresh") { ctx ->
    val requestBody = ctx.bodyAsClass<RefreshTokenRequest>()

    // Validate refresh token
    val refreshToken = refreshTokenRepository.findByToken(requestBody.refreshToken)
        ?: throw UnauthorizedException("Invalid refresh token")

    // Check if token is expired
    if (refreshToken.expiresAt < Instant.now().toEpochMilli()) {
        refreshTokenRepository.delete(refreshToken.id)
        throw UnauthorizedException("Refresh token expired")
    }

    // Generate new access token
    val userId = refreshToken.userId
    val user = userRepository.findById(userId)
        ?: throw UnauthorizedException("User not found")

    val newAccessToken = jwtService.generateAccessToken(user)
    val newRefreshToken = jwtService.generateRefreshToken(user)

    // Save new refresh token and delete old one
    refreshTokenRepository.delete(refreshToken.id)
    refreshTokenRepository.save(newRefreshToken)

    ctx.json(mapOf(
        "token" to newAccessToken.token,
        "refreshToken" to newRefreshToken.token,
        "expiresIn" to newAccessToken.expiresIn
    ))
}
```

#### 2.2. Update OAuth Callback to Return Refresh Token

```kotlin
// POST /api/v1/auth/oauth/{provider}/callback
app.post("/api/v1/auth/oauth/:provider/callback") { ctx ->
    val provider = ctx.pathParam("provider")
    val request = ctx.bodyAsClass<OAuthCallbackRequest>()

    // Exchange code for user info
    val oauthUser = oauthService.handleCallback(provider, request.code, request.state)

    // Find or create user
    val user = userRepository.findOrCreate(oauthUser)

    // Generate access token (short-lived: 1 hour)
    val accessToken = jwtService.generateAccessToken(user)

    // Generate refresh token (long-lived: 30 days)
    val refreshToken = jwtService.generateRefreshToken(user)

    // Save refresh token to database
    refreshTokenRepository.save(RefreshToken(
        token = refreshToken.token,
        userId = user.id,
        expiresAt = Instant.now().plusSeconds(2592000).toEpochMilli(), // 30 days
        createdAt = Instant.now().toEpochMilli()
    ))

    ctx.json(mapOf(
        "token" to accessToken.token,
        "token_type" to "Bearer",
        "expires_in" to accessToken.expiresIn,
        "refresh_token" to refreshToken.token, // ✅ NEW
        "user" to user.toApiUser()
    ))
}
```

#### 2.3. Database Schema for Refresh Tokens

```sql
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

#### 2.4. JWT Service Updates

```kotlin
class JwtService(private val secret: String) {

    fun generateAccessToken(user: User): TokenResult {
        val expiresIn = 3600 // 1 hour
        val expiresAt = Instant.now().plusSeconds(expiresIn.toLong())

        val token = JWT.create()
            .withSubject(user.id)
            .withClaim("email", user.email)
            .withClaim("role", user.role.name)
            .withExpiresAt(Date.from(expiresAt))
            .sign(Algorithm.HMAC256(secret))

        return TokenResult(token, expiresIn)
    }

    fun generateRefreshToken(user: User): TokenResult {
        val expiresIn = 2592000 // 30 days
        val expiresAt = Instant.now().plusSeconds(expiresIn.toLong())

        val token = JWT.create()
            .withSubject(user.id)
            .withClaim("type", "refresh")
            .withExpiresAt(Date.from(expiresAt))
            .sign(Algorithm.HMAC256(secret))

        return TokenResult(token, expiresIn)
    }

    fun verifyToken(token: String): DecodedJWT {
        val verifier = JWT.require(Algorithm.HMAC256(secret)).build()
        return verifier.verify(token)
    }
}
```

---

### Option 3: **Hybrid Approach** (Recommended)

Combine both approaches:

1. **Access tokens**: Short-lived (1 hour) for security
2. **Refresh tokens**: Long-lived (30 days) for convenience
3. **Auto-refresh**: Frontend automatically refreshes tokens before expiration

**Benefits**:
- ✅ Secure (short-lived access tokens)
- ✅ Convenient (users stay logged in)
- ✅ Revocable (can delete refresh tokens from database)
- ✅ Industry standard

---

## Testing the Solution

### 1. Test Authentication Persistence

```bash
# Login via OAuth
1. Go to http://localhost:3000
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify you're redirected to dashboard

# Test persistence
5. Refresh the page (Cmd+R or F5)
6. ✅ Verify you're still logged in
7. ✅ Check browser console for "Token valid" message
8. ✅ Check localStorage for auth-storage, token_expires_at

# Test expiration
9. Open DevTools > Application > Local Storage
10. Change token_expires_at to a past timestamp
11. Wait 60 seconds
12. ✅ Verify auto-logout happens
```

### 2. Test Refresh Token Flow (if implemented)

```bash
# Setup
1. Backend implements refresh token endpoint
2. Frontend has refresh-interceptor.ts imported in main.tsx

# Test auto-refresh
3. Login successfully
4. Wait for token to expire (or manually expire it)
5. Make an API call (e.g., fetch transactions)
6. ✅ Verify 401 triggers auto-refresh
7. ✅ Verify API call succeeds after refresh
8. ✅ Check Network tab for /auth/refresh call
```

---

## Deployment Checklist

### Frontend Changes

- [x] `isAuthenticated` added to Zustand persist
- [x] Token expiration monitoring improved
- [x] Refresh token support added to types
- [x] Refresh token cleanup in logout
- [ ] Import refresh interceptor in main.tsx (if using refresh tokens)

### Backend Requirements

- [ ] **Option 1**: Increase JWT token expiration to 7+ days
- [ ] **Option 2**: Implement refresh token endpoint `/api/v1/auth/refresh`
- [ ] **Option 2**: Add refresh token to OAuth callback response
- [ ] **Option 2**: Create `refresh_tokens` database table
- [ ] **Option 2**: Add cleanup job to delete expired refresh tokens
- [ ] Test token expiration behavior
- [ ] Verify CORS headers allow refresh endpoint
- [ ] Document token lifetimes in API docs

---

## Security Considerations

### Access Token Best Practices

- ✅ Short expiration (1 hour recommended)
- ✅ Stored in memory or localStorage (not cookies to avoid CSRF)
- ✅ Include minimal claims (user ID, role)
- ✅ Validated on every request

### Refresh Token Best Practices

- ✅ Long expiration (7-30 days)
- ✅ Stored in database (can be revoked)
- ✅ One-time use (delete after refresh)
- ✅ Rotate on every refresh
- ✅ Include user agent / IP binding (optional)

### Additional Security

- ✅ Use HTTPS in production (prevent token interception)
- ✅ Implement rate limiting on refresh endpoint
- ✅ Log all token refresh attempts
- ✅ Allow users to view/revoke active sessions
- ✅ Add "Last Activity" timestamp to sessions

---

## Troubleshooting

### Issue: User logged out on refresh

**Check**:
1. Open DevTools > Application > Local Storage
2. Verify `auth-storage` contains: `{"state":{"token":"...","user":{...},"isAuthenticated":true},...}`
3. Verify `token_expires_at` is in the future
4. Check console for token expiration logs

**Fix**:
- Ensure `isAuthenticated` is in Zustand `partialize`
- Ensure `token_expires_at` is set correctly
- Increase token expiration on backend

### Issue: Token expires too quickly

**Check**:
1. Check backend JWT token expiration setting
2. Verify frontend saves `expiresIn` correctly
3. Check `token_expires_at` value in localStorage

**Fix**:
- Increase backend token expiration
- Implement refresh token flow
- Add "Remember Me" checkbox with longer expiration

### Issue: Auto-refresh not working

**Check**:
1. Verify backend `/auth/refresh` endpoint exists
2. Check `refresh_token` exists in localStorage
3. Check Network tab for 401 responses
4. Check console for refresh interceptor errors

**Fix**:
- Import and setup refresh interceptor in main.tsx
- Verify refresh token is saved on login
- Check backend refresh endpoint implementation

---

## Next Steps

### Immediate (Current Solution)

✅ Test authentication persistence with current fix
✅ Verify users stay logged in after refresh
✅ Monitor token expiration behavior

### Short-term (Backend Changes)

1. Choose approach: Increase expiration vs. Refresh tokens
2. Implement backend changes
3. Test with frontend integration
4. Update API documentation

### Long-term (Enhancements)

1. Add "Remember Me" checkbox for longer sessions
2. Show active sessions in user profile
3. Add "Logout from all devices" feature
4. Implement session activity tracking
5. Add push notifications for new logins

---

## References

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Refresh Tokens](https://tools.ietf.org/html/rfc6749#section-6)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Auth0 Token Best Practices](https://auth0.com/docs/secure/tokens/token-best-practices)

---

**Last Updated**: January 31, 2026
