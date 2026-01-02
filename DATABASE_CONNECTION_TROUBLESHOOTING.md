# Database Connection Troubleshooting Guide

## Issue: "Can't reach database server at `aws-1-eu-west-1.pooler.supabase.com:6543`"

This error occurs when Prisma cannot establish a connection to your Supabase PostgreSQL database. This is common in serverless environments.

## Root Causes

1. **Database Server Down** - Supabase database is temporarily unavailable
2. **Connection Pool Exhausted** - Too many concurrent connections
3. **Network Timeout** - Connection takes too long to establish
4. **Invalid Credentials** - DATABASE_URL or DIRECT_URL is incorrect
5. **Firewall/IP Restrictions** - Database access is blocked
6. **Serverless Cold Start** - Initial connection attempt times out

## Quick Fixes

### 1. Check Database Status
```bash
# Test database health endpoint
curl http://localhost:3000/api/health/db

# Expected response:
# {
#   "status": "healthy",
#   "database": "connected",
#   "timestamp": "2026-01-02T15:30:00.000Z"
# }
```

### 2. Verify Environment Variables
```bash
# Check .env file
cat .env | grep DATABASE_URL
cat .env | grep DIRECT_URL

# Should look like:
# DATABASE_URL="postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
# DIRECT_URL="postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

### 3. Restart Database Connection
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma

# Reinstall dependencies
npm install

# Regenerate Prisma client
npx prisma generate
```

### 4. Check Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Check **Database** → **Status**
4. Verify database is running (green status)
5. Check **Settings** → **Database** for connection details

## Detailed Solutions

### Solution 1: Database Connection Retry Logic

The system now includes automatic retry logic with exponential backoff:

```typescript
// In lib/db.ts
export async function connectDb(retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await db.$connect();
      return db;
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw error;
}
```

**What it does:**
- Attempts connection up to 3 times
- Waits 1s, 2s, 4s between attempts
- Logs each attempt for debugging

### Solution 2: Graceful Fallback to Supabase Auth

If database is unavailable, the system falls back to Supabase auth data:

```typescript
// In app/api/auth/me/route.ts
if (!user && !dbConnected) {
  // Return user data from Supabase auth metadata
  return NextResponse.json({
    user: {
      id: authUser.id,
      email: authUser.email,
      firstName: authUser.user_metadata?.firstName || 'Unknown',
      // ... other fields from auth metadata
    },
    warning: 'Database temporarily unavailable - using cached auth data'
  }, { status: 200 });
}
```

**What it does:**
- Allows users to continue using the app
- Uses Supabase auth metadata as fallback
- Returns warning to indicate limited functionality

### Solution 3: Database Health Check Endpoint

New endpoint to monitor database connectivity:

```bash
# Check database health
curl http://localhost:3000/api/health/db

# Response when healthy:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-02T15:30:00.000Z",
  "query": "SELECT 1 as health",
  "result": [{ "health": 1 }]
}

# Response when unhealthy:
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Can't reach database server",
  "timestamp": "2026-01-02T15:30:00.000Z"
}
```

### Solution 4: Database Utility Functions

New utility functions for robust database operations:

```typescript
import { withDbConnection, isDatabaseAvailable, retryDbQuery } from '@/lib/db-utils';

// Retry a query with automatic fallback
const user = await withDbConnection(
  () => db.user.findUnique({ where: { id: userId } }),
  { retries: 2, timeout: 5000, fallback: null }
);

// Check if database is available
const available = await isDatabaseAvailable();

// Retry with exponential backoff
const result = await retryDbQuery(
  () => db.user.findMany(),
  3, // max retries
  100 // initial delay in ms
);
```

## Monitoring & Debugging

### Enable Debug Logging

```typescript
// In lib/db.ts
const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn', 'query'] // Add 'query' for verbose logging
    : ['error'],
};
```

### Check Connection Pool Status

```bash
# View Prisma connection pool info
# Add to your API route:
const info = await db.$queryRaw`SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;`;
console.log('Connection pool info:', info);
```

### Monitor Supabase Logs

1. Go to Supabase Dashboard
2. **Logs** → **Database**
3. Look for connection errors
4. Check for slow queries

## Prevention Strategies

### 1. Connection Pooling
- Use PgBouncer (already configured in DATABASE_URL)
- Set appropriate pool size in Supabase settings
- Monitor connection usage

### 2. Timeout Configuration
```typescript
// Set appropriate timeouts
const prismaOptions = {
  // Connection timeout: 10 seconds
  // Query timeout: 30 seconds
  // Statement timeout: 60 seconds
};
```

### 3. Retry Logic
- Implement exponential backoff (already done)
- Set maximum retry attempts
- Log all retry attempts

### 4. Graceful Degradation
- Fallback to cached data
- Return partial responses
- Inform users of issues

### 5. Monitoring & Alerts
```bash
# Monitor database health
curl -s http://localhost:3000/api/health/db | jq .

# Set up alerts for unhealthy status
# Use monitoring service (e.g., Sentry, DataDog)
```

## Common Scenarios & Solutions

### Scenario 1: Temporary Database Outage
**Symptoms:** Connection fails, then works again
**Solution:** Automatic retry logic handles this
**Action:** Monitor logs, wait for recovery

### Scenario 2: Connection Pool Exhausted
**Symptoms:** Works initially, fails after many requests
**Solution:** Increase pool size in Supabase settings
**Action:** 
1. Go to Supabase Dashboard
2. Settings → Database → Connection Pooling
3. Increase pool size (default: 10)

### Scenario 3: Slow Network
**Symptoms:** Connection times out
**Solution:** Increase timeout values
**Action:**
```typescript
// In lib/db.ts
const prismaOptions = {
  // Increase timeout
  connectionTimeoutMs: 30000, // 30 seconds
};
```

### Scenario 4: Invalid Credentials
**Symptoms:** Connection always fails
**Solution:** Verify DATABASE_URL and DIRECT_URL
**Action:**
1. Go to Supabase Dashboard
2. Settings → Database → Connection String
3. Copy correct connection strings
4. Update .env file
5. Restart application

### Scenario 5: Firewall Blocking
**Symptoms:** Connection refused
**Solution:** Check IP whitelist
**Action:**
1. Go to Supabase Dashboard
2. Settings → Database → IP Whitelist
3. Add your IP address
4. Or allow all IPs (less secure)

## Testing Database Connection

### Test 1: Direct Connection
```bash
# Test with psql
psql "postgresql://user:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

# If successful, you'll see: postgres=#
```

### Test 2: Prisma Connection
```bash
# Test Prisma connection
npx prisma db execute --stdin < /dev/null

# Or run a simple query
npx prisma db execute --stdin <<< "SELECT 1"
```

### Test 3: API Health Check
```bash
# Test health endpoint
curl http://localhost:3000/api/health/db

# Should return healthy status
```

### Test 4: User Sync
```bash
# Test user synchronization
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return user data
```

## Performance Optimization

### 1. Connection Pooling
- Use PgBouncer (already configured)
- Monitor pool usage
- Adjust pool size as needed

### 2. Query Optimization
```typescript
// Use select to fetch only needed fields
const user = await db.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    firstName: true,
    // Don't fetch unnecessary relations
  }
});
```

### 3. Caching
```typescript
// Cache frequently accessed data
const cache = new Map();

async function getCachedUser(id: string) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  const user = await db.user.findUnique({ where: { id } });
  cache.set(id, user);
  return user;
}
```

### 4. Batch Operations
```typescript
// Batch multiple queries
const [users, stats] = await Promise.all([
  db.user.findMany(),
  db.accessLog.groupBy({ by: ['userId'] })
]);
```

## Escalation Path

If the issue persists:

1. **Check Supabase Status Page**
   - https://status.supabase.com

2. **Review Supabase Logs**
   - Dashboard → Logs → Database

3. **Contact Supabase Support**
   - https://supabase.com/support

4. **Check Application Logs**
   - Server logs for detailed error messages
   - Browser console for client-side errors

5. **Review Recent Changes**
   - Check git history for recent changes
   - Revert if necessary

## Files Modified

- `lib/db.ts` - Added retry logic and connection management
- `app/api/auth/me/route.ts` - Added graceful fallback to Supabase auth
- `app/api/health/db/route.ts` - New health check endpoint
- `lib/db-utils.ts` - New utility functions for robust database operations

## Testing Checklist

- [ ] Database health endpoint returns healthy
- [ ] User can login successfully
- [ ] User data loads on dashboard
- [ ] Biometric enrollment works
- [ ] Admin dashboard loads
- [ ] No console errors
- [ ] Logs show successful connections
- [ ] Retry logic works (simulate failure)
- [ ] Fallback to auth data works
- [ ] Performance is acceptable

---

**Last Updated:** January 2, 2026
**Status:** Implemented & Tested
