# Option 3: Hybrid Authentication - Visual Flow Diagram

## 🔄 Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          OPTION 3: HYBRID AUTHENTICATION                         │
│              Short-lived Access Tokens + Long-lived Refresh Tokens              │
└─────────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║                        1. INITIAL LOGIN (OAuth Flow)                          ║
╚═══════════════════════════════════════════════════════════════════════════════╝

   User                  Frontend              Backend              Database
    │                       │                     │                     │
    │  Click "Sign in"      │                     │                     │
    ├──────────────────────>│                     │                     │
    │                       │  Get Auth URL       │                     │
    │                       ├────────────────────>│                     │
    │                       │                     │                     │
    │  Redirect to Google   │                     │                     │
    │<──────────────────────┤                     │                     │
    │                       │                     │                     │
    │  Login at Google      │                     │                     │
    │  ................      │                     │                     │
    │                       │                     │                     │
    │  Redirect back        │                     │                     │
    ├──────────────────────>│                     │                     │
    │                       │  Exchange code      │                     │
    │                       ├────────────────────>│                     │
    │                       │                     │  Create/Update User │
    │                       │                     ├────────────────────>│
    │                       │                     │                     │
    │                       │                     │  Save Refresh Token │
    │                       │                     ├────────────────────>│
    │                       │   TOKENS            │                     │
    │                       │<────────────────────┤                     │
    │                       │   • access_token    │                     │
    │                       │   • refresh_token   │                     │
    │                       │   • expires_in      │                     │
    │                       │                     │                     │
    │  Dashboard            │  Save to:           │                     │
    │<──────────────────────┤  • localStorage     │                     │
    │                       │  • Zustand store    │                     │


╔═══════════════════════════════════════════════════════════════════════════════╗
║              2. AUTOMATIC REFRESH ON 401 (Reactive Approach)                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

   User                  Frontend              Backend              Database
    │                       │                     │                     │
    │  Using app...         │                     │                     │
    │                       │                     │                     │
    │                       │  API Call           │                     │
    │                       │  (expired token)    │                     │
    │                       ├────────────────────>│                     │
    │                       │   ❌ 401            │                     │
    │                       │<────────────────────┤                     │
    │                       │                     │                     │
    │  🔵 Shows:            │  Auto-refresh!      │                     │
    │  "Refreshing..."      │  (interceptor)      │                     │
    │<──────────────────────┤                     │                     │
    │                       │  POST /auth/refresh │                     │
    │                       │  { refreshToken }   │                     │
    │                       ├────────────────────>│                     │
    │                       │                     │  Validate token     │
    │                       │                     ├────────────────────>│
    │                       │                     │  Delete old token   │
    │                       │                     ├────────────────────>│
    │                       │                     │  Save new token     │
    │                       │                     ├────────────────────>│
    │                       │   NEW TOKENS        │                     │
    │                       │<────────────────────┤                     │
    │                       │   • new access      │                     │
    │                       │   • new refresh     │                     │
    │                       │                     │                     │
    │  🟢 Shows:            │  Update tokens      │                     │
    │  "Session refreshed"  │  Retry API call     │                     │
    │<──────────────────────┤────────────────────>│                     │
    │                       │   ✅ 200 OK         │                     │
    │  Data displayed       │<────────────────────┤                     │
    │<──────────────────────┤                     │                     │


╔═══════════════════════════════════════════════════════════════════════════════╗
║           3. PROACTIVE REFRESH (Before Expiration - Preventive)               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

   User                  Frontend              Backend              Database
    │                       │                     │                     │
    │  Using app...         │                     │                     │
    │                       │                     │                     │
    │                       │  [Every 5 min]      │                     │
    │                       │  Check expiration   │                     │
    │                       │  ................   │                     │
    │                       │                     │                     │
    │                       │  Token expires in   │                     │
    │                       │  9 minutes!         │                     │
    │                       │  Refresh now!       │                     │
    │                       │                     │                     │
    │  🔵 Shows:            │  POST /auth/refresh │                     │
    │  "Refreshing..."      │  { refreshToken }   │                     │
    │<──────────────────────┤────────────────────>│                     │
    │                       │                     │  Validate & Rotate  │
    │                       │                     ├────────────────────>│
    │                       │   NEW TOKENS        │                     │
    │                       │<────────────────────┤                     │
    │  🟢 Shows:            │  Update tokens      │                     │
    │  "Session refreshed"  │  Continue using app │                     │
    │<──────────────────────┤                     │                     │
    │                       │                     │                     │
    │  ✅ No interruption!  │                     │                     │
    │  User never sees 401! │                     │                     │


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         4. LOGOUT (Revoke All Tokens)                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

   User                  Frontend              Backend              Database
    │                       │                     │                     │
    │  Click "Logout"       │                     │                     │
    ├──────────────────────>│                     │                     │
    │                       │  POST /auth/logout  │                     │
    │                       ├────────────────────>│                     │
    │                       │                     │  Delete all tokens  │
    │                       │                     │  for this user      │
    │                       │                     ├────────────────────>│
    │                       │   ✅ 204            │                     │
    │                       │<────────────────────┤                     │
    │                       │  Clear:             │                     │
    │                       │  • localStorage     │                     │
    │                       │  • Zustand store    │                     │
    │  Redirect to home     │                     │                     │
    │<──────────────────────┤                     │                     │


╔═══════════════════════════════════════════════════════════════════════════════╗
║                       5. DAILY CLEANUP JOB (Maintenance)                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                           Backend              Database
                              │                     │
                              │  [Daily at 2 AM]    │
                              │  Cleanup expired    │
                              │  tokens             │
                              ├────────────────────>│
                              │                     │
                              │  DELETE WHERE       │
                              │  expires_at < now   │
                              │                     │
                              │  ✅ 50 deleted      │
                              │<────────────────────┤


╔═══════════════════════════════════════════════════════════════════════════════╗
║                           TOKEN LIFETIMES & STORAGE                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│                              ACCESS TOKEN                                    │
│                                                                              │
│  Lifetime:  1 hour (3600 seconds)                                           │
│  Storage:   Frontend - localStorage + Zustand store                         │
│  Purpose:   API authentication on every request                             │
│  Security:  Short-lived = Less damage if stolen                             │
│  Format:    JWT with claims: userId, email, role, type: "access"           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             REFRESH TOKEN                                    │
│                                                                              │
│  Lifetime:  30 days (2,592,000 seconds)                                     │
│  Storage:   Frontend - localStorage                                         │
│             Backend  - Database (can be revoked)                            │
│  Purpose:   Obtain new access tokens                                        │
│  Security:  Can be revoked, rotated on use, database-backed                │
│  Format:    JWT with claims: userId, type: "refresh"                        │
│  Rotation:  New token on every refresh, old token deleted                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════════╗
║                            ERROR HANDLING FLOW                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

         API Call with Expired Token
                    │
                    ▼
          ┌─────────────────┐
          │  401 Received   │
          └────────┬────────┘
                   │
        ┌──────────▼──────────┐
        │ Refresh Interceptor │
        └──────────┬──────────┘
                   │
        ┌──────────▼────────────┐
        │ Has refresh_token?    │
        └───────┬───────┬───────┘
                │ YES   │ NO
                │       │
                │       └──────────> ❌ Logout & Redirect
                │
                ▼
        ┌────────────────────┐
        │ Call /auth/refresh │
        └────────┬───────────┘
                 │
        ┌────────▼────────────┐
        │ Refresh successful? │
        └───────┬───────┬─────┘
                │ YES   │ NO
                │       │
                │       └──────────> ❌ Logout & Redirect
                │
                ▼
        ┌───────────────────┐
        │ Update tokens     │
        │ Retry API call    │
        └────────┬──────────┘
                 │
                 ▼
          ✅ Success!


╔═══════════════════════════════════════════════════════════════════════════════╗
║                         SECURITY MEASURES IN PLACE                            ║
╚═══════════════════════════════════════════════════════════════════════════════╝

🔒 Token Rotation
   ├─ New refresh token on every refresh
   ├─ Old refresh token immediately deleted
   └─ Prevents token reuse attacks

🔒 Short-lived Access Tokens
   ├─ 1 hour expiration
   ├─ Limited damage if stolen
   └─ Must be refreshed regularly

🔒 Database-backed Refresh Tokens
   ├─ Can be revoked at any time
   ├─ Admin can delete user's tokens
   └─ Logout deletes all user tokens

🔒 Request Queuing
   ├─ Only one refresh call at a time
   ├─ Other requests wait in queue
   └─ Prevents refresh storms

🔒 Proactive Refresh
   ├─ Refreshes before expiration
   ├─ User never sees 401 errors
   └─ Seamless user experience

🔒 HTTPS Only (Production)
   ├─ All tokens encrypted in transit
   ├─ Prevents interception
   └─ Required for production


╔═══════════════════════════════════════════════════════════════════════════════╗
║                       WHAT HAPPENS IN DIFFERENT SCENARIOS                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ Scenario 1: User Opens App After 1 Day                                      │
│                                                                              │
│  1. Access token expired (more than 1 hour old)                             │
│  2. Refresh token still valid (less than 30 days old)                       │
│  3. First API call gets 401                                                 │
│  4. Auto-refresh triggered                                                  │
│  5. New tokens obtained                                                     │
│  6. Original API call retried                                               │
│  7. ✅ User sees their data - no re-login needed                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Scenario 2: User Actively Using App                                         │
│                                                                              │
│  1. User logged in 50 minutes ago                                           │
│  2. Proactive refresh checks every 5 minutes                                │
│  3. Detects token expires in 10 minutes                                     │
│  4. Proactively refreshes token                                             │
│  5. Shows brief "Session refreshed" message                                 │
│  6. ✅ User continues without interruption                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Scenario 3: User Returns After 31 Days                                      │
│                                                                              │
│  1. Both access and refresh tokens expired                                  │
│  2. First API call gets 401                                                 │
│  3. Auto-refresh tries to refresh                                           │
│  4. Backend returns 401 (refresh token expired)                             │
│  5. Frontend clears all auth data                                           │
│  6. ❌ Redirects to login page                                              │
│  7. User needs to login again                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Scenario 4: User Logs Out                                                   │
│                                                                              │
│  1. User clicks logout                                                      │
│  2. Frontend calls /auth/logout                                             │
│  3. Backend deletes all refresh tokens for user                             │
│  4. Frontend clears localStorage and Zustand                                │
│  5. ✅ Clean logout, tokens revoked                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Scenario 5: Refresh Token Stolen                                            │
│                                                                              │
│  1. Attacker obtains refresh token                                          │
│  2. Admin detects suspicious activity                                       │
│  3. Admin deletes refresh token from database                               │
│  4. Next refresh attempt fails                                              │
│  5. ✅ Attacker can't use the token anymore                                 │
│  6. Real user gets logged out, needs to re-login                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════════╗
║                            KEY IMPLEMENTATION NOTES                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

✅ Frontend Complete:
   • Refresh interceptor installed in App.tsx
   • Proactive refresh monitoring every 5 minutes
   • Visual feedback component for user
   • Token expiration safety monitor
   • Request queuing during refresh

⚠️  Backend Required:
   • POST /auth/refresh endpoint
   • refresh_tokens database table
   • Token rotation logic
   • Cleanup job for expired tokens
   • Updated OAuth callback

📚 Full backend implementation guide:
   HYBRID_AUTH_IMPLEMENTATION.md
   • Complete Kotlin/Javalin code
   • Database schema
   • Repository implementation
   • Security best practices
   • Testing guide

🧪 Testing:
   Frontend ready to test once backend implements:
   1. /auth/refresh endpoint
   2. Returns refresh_token in OAuth callback
   3. Database table created

🚀 Benefits:
   • ✅ Secure (short-lived access tokens)
   • ✅ Convenient (30-day refresh tokens)
   • ✅ Revocable (database-backed)
   • ✅ Industry standard (Google, Facebook pattern)
   • ✅ User-friendly (transparent background refresh)
```
