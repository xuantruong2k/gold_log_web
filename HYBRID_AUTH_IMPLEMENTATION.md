# Option 3: Hybrid Authentication Implementation Guide

This guide provides the complete implementation for the Hybrid authentication approach with short-lived access tokens, long-lived refresh tokens, and automatic token refresh.

---

## 🎯 Overview

**What's Implemented (Frontend)**:
- ✅ Short-lived access tokens (1 hour)
- ✅ Long-lived refresh tokens (30 days)
- ✅ Automatic token refresh on 401 errors
- ✅ Proactive token refresh (before expiration)
- ✅ Visual refresh indicator
- ✅ Queued request handling during refresh

**What Backend Needs to Implement**:
1. `/api/v1/auth/refresh` endpoint
2. Return `refresh_token` in OAuth callback
3. Refresh token database storage
4. Token rotation on refresh

---

## 🔧 Frontend Implementation (Completed)

### 1. **Automatic Refresh on 401 Errors**

**File**: `src/api/refresh-interceptor.ts`

When any API call receives a 401 response:
1. Automatically calls `/auth/refresh` with stored refresh token
2. Updates access token and refresh token
3. Retries the original failed request
4. Queues subsequent requests until refresh completes

**Key Features**:
- Request queueing (prevents multiple simultaneous refresh calls)
- Automatic retry of failed requests
- Graceful logout on refresh failure

### 2. **Proactive Token Refresh**

**File**: `src/hooks/useProactiveTokenRefresh.ts`

Checks every 5 minutes:
- If token expires in < 10 minutes → refresh proactively
- Prevents user from experiencing 401 errors
- Seamless user experience

### 3. **Visual Feedback**

**File**: `src/hooks/useTokenRefreshStatus.tsx`

Shows subtle notification during refresh:
- "Refreshing session..." (blue badge, spinning icon)
- "Session refreshed" (green badge, checkmark, auto-hide after 3s)

### 4. **Token Expiration Monitoring**

**File**: `src/hooks/useTokenExpiration.ts`

Background monitor (checks every 60 seconds):
- Logs out user when token expires
- Safety net if refresh fails
- Shows remaining time in console

---

## 🔨 Backend Implementation (Required)

### Step 1: Create Refresh Token Endpoint

**Endpoint**: `POST /api/v1/auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Success - 200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

**Response** (Error - 401):
```json
{
  "error": "INVALID_REFRESH_TOKEN",
  "message": "Refresh token is invalid or expired",
  "timestamp": "2026-01-31T10:30:00Z"
}
```

**Kotlin Implementation** (Javalin):

```kotlin
// POST /api/v1/auth/refresh
app.post("/api/v1/auth/refresh") { ctx ->
    try {
        val request = ctx.bodyAsClass<RefreshTokenRequest>()

        // 1. Validate refresh token exists
        val refreshToken = refreshTokenRepository.findByToken(request.refreshToken)
            ?: throw UnauthorizedException("Invalid refresh token")

        // 2. Check if token is expired
        if (refreshToken.expiresAt < Instant.now().toEpochMilli()) {
            refreshTokenRepository.delete(refreshToken.id)
            throw UnauthorizedException("Refresh token expired")
        }

        // 3. Get user
        val user = userRepository.findById(refreshToken.userId)
            ?: throw UnauthorizedException("User not found")

        // 4. Generate new access token (1 hour)
        val newAccessToken = jwtService.generateAccessToken(user)

        // 5. Generate new refresh token (30 days) - ROTATION
        val newRefreshToken = jwtService.generateRefreshToken(user)

        // 6. Save new refresh token
        val refreshTokenEntity = RefreshToken(
            id = UUID.randomUUID().toString(),
            token = newRefreshToken.token,
            userId = user.id,
            expiresAt = Instant.now().plusSeconds(2592000).toEpochMilli(), // 30 days
            createdAt = Instant.now().toEpochMilli()
        )
        refreshTokenRepository.save(refreshTokenEntity)

        // 7. Delete old refresh token (security best practice)
        refreshTokenRepository.delete(refreshToken.id)

        // 8. Return tokens
        ctx.json(mapOf(
            "token" to newAccessToken.token,
            "refresh_token" to newRefreshToken.token,
            "expires_in" to newAccessToken.expiresIn
        ))

    } catch (e: UnauthorizedException) {
        ctx.status(401).json(mapOf(
            "error" to "INVALID_REFRESH_TOKEN",
            "message" to e.message,
            "timestamp" to Instant.now().toString()
        ))
    } catch (e: Exception) {
        logger.error("Refresh token error", e)
        ctx.status(500).json(mapOf(
            "error" to "INTERNAL_SERVER_ERROR",
            "message" to "Failed to refresh token",
            "timestamp" to Instant.now().toString()
        ))
    }
}
```

### Step 2: Update OAuth Callback

**Endpoint**: `POST /api/v1/auth/oauth/{provider}/callback`

**Updated Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "John Doe",
    "profile_picture_url": "https://...",
    "provider": "google",
    "role": "USER"
  }
}
```

**Kotlin Implementation**:

```kotlin
// POST /api/v1/auth/oauth/:provider/callback
app.post("/api/v1/auth/oauth/:provider/callback") { ctx ->
    val provider = ctx.pathParam("provider")
    val request = ctx.bodyAsClass<OAuthCallbackRequest>()

    // Exchange code for user info
    val oauthUser = oauthService.handleCallback(provider, request.code, request.state)

    // Find or create user
    val user = userRepository.findOrCreate(oauthUser)

    // Generate access token (1 hour)
    val accessToken = jwtService.generateAccessToken(user)

    // Generate refresh token (30 days)
    val refreshToken = jwtService.generateRefreshToken(user)

    // Save refresh token to database
    val refreshTokenEntity = RefreshToken(
        id = UUID.randomUUID().toString(),
        token = refreshToken.token,
        userId = user.id,
        expiresAt = Instant.now().plusSeconds(2592000).toEpochMilli(), // 30 days
        createdAt = Instant.now().toEpochMilli()
    )
    refreshTokenRepository.save(refreshTokenEntity)

    // Return tokens
    ctx.json(mapOf(
        "token" to accessToken.token,
        "token_type" to "Bearer",
        "expires_in" to accessToken.expiresIn,
        "refresh_token" to refreshToken.token, // NEW FIELD
        "user" to user.toApiUser()
    ))
}
```

### Step 3: Database Schema

**Table**: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Kotlin Entity**:

```kotlin
data class RefreshToken(
    val id: String,
    val token: String,
    val userId: String,
    val expiresAt: Long,  // Unix timestamp (milliseconds)
    val createdAt: Long
)
```

### Step 4: JWT Service Updates

```kotlin
class JwtService(
    private val secret: String,
    private val issuer: String = "gold-log-api"
) {

    /**
     * Generate short-lived access token (1 hour)
     * Used for API authentication
     */
    fun generateAccessToken(user: User): TokenResult {
        val expiresIn = 3600 // 1 hour
        val expiresAt = Instant.now().plusSeconds(expiresIn.toLong())

        val token = JWT.create()
            .withIssuer(issuer)
            .withSubject(user.id)
            .withClaim("email", user.email)
            .withClaim("role", user.role.name)
            .withClaim("type", "access")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(expiresAt))
            .sign(Algorithm.HMAC256(secret))

        return TokenResult(token, expiresIn)
    }

    /**
     * Generate long-lived refresh token (30 days)
     * Used to obtain new access tokens
     */
    fun generateRefreshToken(user: User): TokenResult {
        val expiresIn = 2592000 // 30 days
        val expiresAt = Instant.now().plusSeconds(expiresIn.toLong())

        val token = JWT.create()
            .withIssuer(issuer)
            .withSubject(user.id)
            .withClaim("type", "refresh")
            .withIssuedAt(Date.from(Instant.now()))
            .withExpiresAt(Date.from(expiresAt))
            .sign(Algorithm.HMAC256(secret))

        return TokenResult(token, expiresIn)
    }

    /**
     * Verify and decode JWT token
     */
    fun verifyToken(token: String): DecodedJWT {
        val verifier = JWT.require(Algorithm.HMAC256(secret))
            .withIssuer(issuer)
            .build()
        return verifier.verify(token)
    }

    /**
     * Check if token is expired
     */
    fun isTokenExpired(token: String): Boolean {
        return try {
            val decoded = verifyToken(token)
            decoded.expiresAt.before(Date())
        } catch (e: Exception) {
            true
        }
    }
}

data class TokenResult(
    val token: String,
    val expiresIn: Int
)
```

### Step 5: Repository Implementation

```kotlin
interface RefreshTokenRepository {
    fun save(refreshToken: RefreshToken): RefreshToken
    fun findByToken(token: String): RefreshToken?
    fun findAllByUserId(userId: String): List<RefreshToken>
    fun delete(id: String)
    fun deleteExpired(): Int
    fun deleteAllByUserId(userId: String): Int
}

class RefreshTokenRepositoryImpl(private val db: Database) : RefreshTokenRepository {

    override fun save(refreshToken: RefreshToken): RefreshToken {
        db.useConnection { conn ->
            conn.prepareStatement("""
                INSERT INTO refresh_tokens (id, token, user_id, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?)
            """).use { stmt ->
                stmt.setString(1, refreshToken.id)
                stmt.setString(2, refreshToken.token)
                stmt.setString(3, refreshToken.userId)
                stmt.setLong(4, refreshToken.expiresAt)
                stmt.setLong(5, refreshToken.createdAt)
                stmt.executeUpdate()
            }
        }
        return refreshToken
    }

    override fun findByToken(token: String): RefreshToken? {
        return db.useConnection { conn ->
            conn.prepareStatement("""
                SELECT id, token, user_id, expires_at, created_at
                FROM refresh_tokens
                WHERE token = ?
            """).use { stmt ->
                stmt.setString(1, token)
                val rs = stmt.executeQuery()
                if (rs.next()) {
                    RefreshToken(
                        id = rs.getString("id"),
                        token = rs.getString("token"),
                        userId = rs.getString("user_id"),
                        expiresAt = rs.getLong("expires_at"),
                        createdAt = rs.getLong("created_at")
                    )
                } else {
                    null
                }
            }
        }
    }

    override fun findAllByUserId(userId: String): List<RefreshToken> {
        return db.useConnection { conn ->
            conn.prepareStatement("""
                SELECT id, token, user_id, expires_at, created_at
                FROM refresh_tokens
                WHERE user_id = ?
                ORDER BY created_at DESC
            """).use { stmt ->
                stmt.setString(1, userId)
                val rs = stmt.executeQuery()
                val tokens = mutableListOf<RefreshToken>()
                while (rs.next()) {
                    tokens.add(RefreshToken(
                        id = rs.getString("id"),
                        token = rs.getString("token"),
                        userId = rs.getString("user_id"),
                        expiresAt = rs.getLong("expires_at"),
                        createdAt = rs.getLong("created_at")
                    ))
                }
                tokens
            }
        }
    }

    override fun delete(id: String) {
        db.useConnection { conn ->
            conn.prepareStatement("DELETE FROM refresh_tokens WHERE id = ?").use { stmt ->
                stmt.setString(1, id)
                stmt.executeUpdate()
            }
        }
    }

    override fun deleteExpired(): Int {
        return db.useConnection { conn ->
            conn.prepareStatement("""
                DELETE FROM refresh_tokens WHERE expires_at < ?
            """).use { stmt ->
                stmt.setLong(1, Instant.now().toEpochMilli())
                stmt.executeUpdate()
            }
        }
    }

    override fun deleteAllByUserId(userId: String): Int {
        return db.useConnection { conn ->
            conn.prepareStatement("DELETE FROM refresh_tokens WHERE user_id = ?").use { stmt ->
                stmt.setString(1, userId)
                stmt.executeUpdate()
            }
        }
    }
}
```

### Step 6: Scheduled Cleanup Job

Clean up expired tokens periodically:

```kotlin
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class RefreshTokenCleanupJob(
    private val refreshTokenRepository: RefreshTokenRepository
) {
    private val scheduler = Executors.newScheduledThreadPool(1)

    fun start() {
        scheduler.scheduleAtFixedRate(
            {
                try {
                    val deletedCount = refreshTokenRepository.deleteExpired()
                    if (deletedCount > 0) {
                        logger.info("Cleaned up $deletedCount expired refresh tokens")
                    }
                } catch (e: Exception) {
                    logger.error("Failed to clean up expired refresh tokens", e)
                }
            },
            1, // Initial delay
            24, // Repeat every 24 hours
            TimeUnit.HOURS
        )
        logger.info("Refresh token cleanup job started")
    }

    fun stop() {
        scheduler.shutdown()
        logger.info("Refresh token cleanup job stopped")
    }
}

// In your main application startup
val cleanupJob = RefreshTokenCleanupJob(refreshTokenRepository)
cleanupJob.start()

// Register shutdown hook
Runtime.getRuntime().addShutdownHook(Thread {
    cleanupJob.stop()
})
```

### Step 7: Update Logout Endpoint

Revoke all refresh tokens on logout:

```kotlin
// POST /api/v1/auth/logout
app.post("/api/v1/auth/logout") { ctx ->
    try {
        val userId = ctx.attribute<String>("userId") // From JWT

        // Delete all refresh tokens for this user
        val revokedCount = refreshTokenRepository.deleteAllByUserId(userId)

        logger.info("Logout: Revoked $revokedCount refresh tokens for user $userId")

        ctx.status(204) // No content

    } catch (e: Exception) {
        logger.error("Logout error", e)
        ctx.status(500).json(mapOf(
            "error" to "INTERNAL_SERVER_ERROR",
            "message" to "Failed to logout",
            "timestamp" to Instant.now().toString()
        ))
    }
}
```

---

## 🔒 Security Considerations

### Token Security

1. **Access Token** (1 hour):
   - ✅ Short expiration minimizes damage if stolen
   - ✅ Stored in memory/localStorage
   - ✅ Validated on every API request

2. **Refresh Token** (30 days):
   - ✅ Stored in database (can be revoked)
   - ✅ One-time use (rotated on every refresh)
   - ✅ Deleted after use
   - ✅ Cleaned up when expired

### Additional Security Measures

1. **Rate Limiting**:
```kotlin
// Limit refresh attempts to 10 per minute per IP
val rateLimiter = RateLimiter(10, 60) // 10 requests per 60 seconds

app.post("/api/v1/auth/refresh") { ctx ->
    val clientIp = ctx.ip()
    if (!rateLimiter.allow(clientIp)) {
        ctx.status(429).json(mapOf(
            "error" to "RATE_LIMIT_EXCEEDED",
            "message" to "Too many refresh attempts"
        ))
        return@post
    }
    // ... rest of refresh logic
}
```

2. **Token Binding** (Optional):
```kotlin
// Store user agent with refresh token
data class RefreshToken(
    val id: String,
    val token: String,
    val userId: String,
    val expiresAt: Long,
    val createdAt: Long,
    val userAgent: String? = null,  // NEW
    val ipAddress: String? = null   // NEW
)

// Verify user agent on refresh
if (refreshToken.userAgent != null &&
    refreshToken.userAgent != ctx.userAgent()) {
    throw UnauthorizedException("User agent mismatch")
}
```

3. **Audit Logging**:
```kotlin
// Log all refresh token operations
fun logRefreshTokenOperation(
    operation: String,
    userId: String,
    success: Boolean,
    ipAddress: String
) {
    auditLogger.info(mapOf(
        "operation" to operation,
        "userId" to userId,
        "success" to success,
        "ipAddress" to ipAddress,
        "timestamp" to Instant.now()
    ))
}
```

---

## 🧪 Testing

### Manual Testing

1. **Test OAuth Login**:
```bash
# 1. Login via Google OAuth
curl -X GET "http://localhost:8080/api/v1/auth/oauth/google/url?redirectUri=http://localhost:3000/auth/callback/google"

# 2. Complete OAuth flow in browser

# 3. Verify tokens in response
# Should receive: token, refresh_token, expires_in, user
```

2. **Test Token Refresh**:
```bash
# 1. Use refresh token from login
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# 2. Verify new tokens received
# Should receive: token, refresh_token, expires_in

# 3. Try using old refresh token again
# Should receive: 401 Unauthorized
```

3. **Test Auto-Refresh on 401**:
```bash
# 1. Login and get tokens
# 2. Wait for access token to expire (or manually set expired token)
# 3. Make any API call (e.g., get transactions)
# 4. Frontend should automatically refresh and retry
# 5. Check browser console for "Token auto-refreshed successfully"
```

4. **Test Proactive Refresh**:
```bash
# 1. Login
# 2. Change token_expires_at in localStorage to expire in 9 minutes
# 3. Wait for proactive refresh (checks every 5 minutes)
# 4. Check console for "Token expires in X minutes, refreshing proactively..."
```

### Database Verification

```sql
-- Check refresh tokens
SELECT * FROM refresh_tokens ORDER BY created_at DESC LIMIT 10;

-- Check expired tokens
SELECT COUNT(*) FROM refresh_tokens WHERE expires_at < UNIX_TIMESTAMP() * 1000;

-- Check tokens per user
SELECT user_id, COUNT(*) as token_count
FROM refresh_tokens
GROUP BY user_id;
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Token Refresh Rate**:
   - Average refreshes per user per day
   - Peak refresh times

2. **Token Expiration**:
   - Percentage of tokens that expire vs. refreshed
   - Average token lifetime

3. **Failed Refreshes**:
   - Count of 401 errors from refresh endpoint
   - Reasons for failure

4. **Database Growth**:
   - Number of active refresh tokens
   - Storage size of refresh_tokens table

### Logging

```kotlin
logger.info("Token refresh successful", mapOf(
    "userId" to user.id,
    "ipAddress" to ctx.ip(),
    "userAgent" to ctx.userAgent(),
    "timestamp" to Instant.now()
))

logger.warn("Token refresh failed", mapOf(
    "reason" to "Token expired",
    "ipAddress" to ctx.ip(),
    "timestamp" to Instant.now()
))
```

---

## 🚀 Deployment Checklist

### Backend

- [ ] Create `refresh_tokens` table in database
- [ ] Implement `/api/v1/auth/refresh` endpoint
- [ ] Update OAuth callback to return `refresh_token`
- [ ] Add cleanup job for expired tokens
- [ ] Update logout to revoke refresh tokens
- [ ] Add rate limiting to refresh endpoint
- [ ] Set up monitoring and logging
- [ ] Test all flows in staging environment
- [ ] Configure CORS for production domain
- [ ] Update API documentation

### Frontend

- [x] Setup refresh interceptor (completed)
- [x] Add proactive token refresh (completed)
- [x] Add visual refresh indicator (completed)
- [x] Handle token expiration (completed)
- [ ] Test complete flow end-to-end
- [ ] Verify persistence after page refresh
- [ ] Test network failure scenarios

### Production

- [ ] Use HTTPS for all token transmission
- [ ] Rotate JWT secret keys periodically
- [ ] Monitor refresh token usage patterns
- [ ] Set up alerts for high refresh failure rates
- [ ] Document token lifetimes in API docs
- [ ] Provide user-facing session management UI (future)

---

## 📚 Additional Features (Future)

1. **Active Sessions Management**:
   - Show user all active sessions
   - Allow revoking individual sessions
   - Show last activity timestamp

2. **"Remember Me" Option**:
   - Extend refresh token to 90 days
   - Stored as user preference

3. **Push Notifications**:
   - Alert on new login from unknown device
   - Alert on suspicious activity

4. **Token Analytics**:
   - Dashboard showing token usage
   - Identify unusual patterns

---

## 🆘 Troubleshooting

### Issue: Infinite Refresh Loop

**Symptoms**: Frontend keeps calling refresh endpoint
**Causes**:
- Backend not returning valid tokens
- Token expiration time not set correctly

**Fix**:
- Verify backend response format matches expected structure
- Check `expires_in` value is in seconds, not milliseconds
- Ensure new tokens are actually valid

### Issue: 401 Even After Refresh

**Symptoms**: API calls still fail after successful refresh
**Causes**:
- New token not saved to store
- Request interceptor not adding token header

**Fix**:
- Check Zustand store is updated
- Verify axios interceptor adds Authorization header
- Check localStorage for updated token

### Issue: Tokens Not Persisting

**Symptoms**: User logged out after page refresh
**Causes**:
- `isAuthenticated` not in Zustand persist
- Token expiration time not saved

**Fix**:
- Verify `partialize` includes `isAuthenticated`
- Check `token_expires_at` in localStorage
- Ensure refresh token is saved

---

**Last Updated**: January 31, 2026
**Frontend Version**: Fully Implemented ✅
**Backend Version**: Implementation Guide Provided
