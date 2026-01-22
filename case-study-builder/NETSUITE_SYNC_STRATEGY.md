# NetSuite Integration - Caching & Sync Strategy

## Overview

The NetSuite integration uses a **hybrid multi-tier caching strategy** to provide **INSTANT customer/item searches** while keeping data synchronized with NetSuite ERP.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER SEARCHES FOR CUSTOMER                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   Check Redis Cache  │◄─── Tier 1: INSTANT (in-memory)
                  │   TTL: 1 week        │     Chunked storage (~5MB chunks)
                  │   Key: netsuite:*    │     Preloaded on server startup
                  └──────────┬───────────┘
                             │
                 ┌───────────┴───────────┐
                 │ HIT                   │ MISS
                 │                       │
                 ▼                       ▼
        ┌────────────────┐    ┌──────────────────────┐
        │ Return Results │    │  Fetch from NetSuite │◄─── Tier 2: API Call
        │   (INSTANT)    │    │  RESTlet + OAuth 1.0a│     ~35s for all customers
        └────────────────┘    │  Security: TBA tokens│     Security sanitized
                              └──────────┬───────────┘
                                         │
                         ┌───────────────┴───────────────┐
                         │ Cache in Redis (chunked)      │
                         │ Cache in PostgreSQL           │
                         │ Return to user                │
                         └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DAILY BACKGROUND SYNC (11 PM Paris)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Vercel Cron Job     │
                  │  POST /api/cron/     │
                  │    netsuite-sync     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Fetch ALL customers  │
                  │ from NetSuite API    │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Delta Sync to       │◄─── Tier 3: PostgreSQL Cache
                  │  PostgreSQL Cache    │     WaNetSuiteCustomerCache
                  │  (only changed data) │     Persistent storage
                  └──────────────────────┘     Fallback source
```

## Three-Tier Caching Strategy

### Tier 1: Redis Cache (Upstash) - INSTANT ⚡

**Purpose:** In-memory cache for lightning-fast searches

**Configuration:**
- **Provider:** Upstash Redis
- **TTL:** 1 week (604,800 seconds)
- **Storage:** Chunked (~5MB per chunk) to handle 10MB Upstash limit
- **Keys:**
  - `netsuite:customers` - All customer data
  - `netsuite:items` - All product data
  - `netsuite:customers:meta` - Metadata (chunk count, total items)
  - `netsuite:items:meta` - Metadata

**Preload Strategy:**
- **When:** Server startup (`instrumentation.ts`)
- **How:** Background, non-blocking
- **Duration:** ~70 seconds total
  - Customers: ~35 seconds
  - Items: ~28 seconds
- **Result:** All searches INSTANT after preload completes

**Code Location:**
```typescript
// instrumentation.ts (runs on server startup)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { netsuiteClient } = await import('./lib/integrations/netsuite');

    // Start background preload (non-blocking)
    netsuiteClient.preloadCache().catch((error) => {
      console.error('[Server] Background cache preload failed:', error);
    });
  }
}
```

**Environment Variables:**
```bash
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Tier 2: PostgreSQL Cache - Daily Sync 💾

**Purpose:** Persistent cache updated daily, fallback when Redis expires

**Tables:**
- `WaNetSuiteCustomerCache` - Customer data cache
- `WaNetSuiteSyncJob` - Sync job tracking

**Schema:**
```prisma
model WaNetSuiteCustomerCache {
  id            String   @id @default(cuid())
  netsuiteId    String   @unique
  entityId      String?
  companyName   String
  address       String?
  city          String?
  country       String?
  industry      String?
  syncStatus    String   @default("PENDING")  // PENDING, SYNCED, FAILED
  syncError     String?
  lastSyncedAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WaNetSuiteSyncJob {
  id             String   @id @default(cuid())
  status         String   // RUNNING, COMPLETED, FAILED
  startedAt      DateTime @default(now())
  completedAt    DateTime?
  totalRecords   Int      @default(0)
  newRecords     Int      @default(0)
  updatedRecords Int      @default(0)
  failedRecords  Int      @default(0)
  errorMessage   String?
}
```

**Sync Schedule:**
- **Frequency:** Daily
- **Time:** 10:00 PM UTC / 11:00 PM Paris (CET)
- **Cron Expression:** `0 22 * * *`
- **Configuration:** `vercel.json`

**Sync Logic:**
```typescript
// lib/integrations/netsuite-sync.ts
export async function runNetSuiteSync(): Promise<SyncResult> {
  // 1. Create sync job record
  const job = await prisma.waNetSuiteSyncJob.create({
    data: { status: 'RUNNING' }
  });

  // 2. Fetch ALL customers from NetSuite
  const customers = await fetchAllNetSuiteCustomers();

  // 3. Delta sync - only update changed records
  for (const customer of customers) {
    const existing = await prisma.waNetSuiteCustomerCache.findUnique({
      where: { netsuiteId: customer.id }
    });

    const hasChanges = existing && (
      existing.companyName !== customer.companyName ||
      existing.address !== customer.address ||
      existing.city !== customer.city ||
      existing.country !== customer.country ||
      existing.industry !== customer.industry
    );

    if (!existing) {
      await prisma.waNetSuiteCustomerCache.create({ data: {...} });
      newRecords++;
    } else if (hasChanges) {
      await prisma.waNetSuiteCustomerCache.update({ data: {...} });
      updatedRecords++;
    }
  }

  // 4. Update job status
  await prisma.waNetSuiteSyncJob.update({
    where: { id: job.id },
    data: { status: 'COMPLETED', totalRecords, newRecords, updatedRecords }
  });
}
```

**Manual Trigger:**
```bash
# Trigger sync manually (requires CRON_SECRET in production)
curl -X POST http://localhost:3010/api/cron/netsuite-sync \
  -H "Authorization: Bearer $CRON_SECRET"

# Check sync status
curl http://localhost:3010/api/cron/netsuite-sync
```

### Tier 3: Mock Database - Development/Testing 🧪

**Purpose:** Fallback for development when NetSuite unavailable

**Tables:**
- `WaMockCustomer` - Mock customer data
- `WaMockItem` - Mock product data

**When Used:**
- NetSuite credentials not configured
- NetSuite API fails
- `NETSUITE_DATA_SOURCE=mock` environment variable

**Auto-Detection:**
```typescript
// lib/integrations/netsuite-dual-source.ts
async function waAutoDetectSource(): Promise<'netsuite' | 'mock'> {
  if (!waIsNetSuiteConfigured()) {
    return 'mock';
  }

  const mockCount = await prisma.waMockCustomer.count();
  if (mockCount === 0) {
    return 'netsuite';
  }

  // Default to mock for safety during testing
  return 'mock';
}
```

## Data Flow Examples

### Example 1: First User Search (Cold Start)

**Scenario:** Server just started, Redis cache empty

```
Time: 0s
User clicks "Search Customer"
  ↓
Check Redis Cache → MISS
  ↓
Fetch from NetSuite API
  (35 seconds - fetches ALL customers)
  ↓
Store in Redis (chunked, 1 week TTL)
Store in PostgreSQL Cache
  ↓
Time: 35s
Filter results by user query
Return to user
  ↓
All subsequent searches: INSTANT (from Redis)
```

### Example 2: Subsequent User Searches (Warm Cache)

**Scenario:** Redis cache populated (within 1 week)

```
Time: 0s
User clicks "Search Customer"
  ↓
Check Redis Cache → HIT
  ↓
Filter results by query (client-side)
  ↓
Time: <100ms
Return to user (INSTANT)
```

### Example 3: Daily Sync (Background)

**Scenario:** 11 PM Paris every night

```
Time: 23:00 Paris (22:00 UTC)
Vercel Cron triggers POST /api/cron/netsuite-sync
  ↓
Create WaNetSuiteSyncJob (status: RUNNING)
  ↓
Fetch ALL customers from NetSuite
  ↓
For each customer:
  - Check if exists in WaNetSuiteCustomerCache
  - Compare data (companyName, address, city, country, industry)
  - If NEW → Create record (newRecords++)
  - If CHANGED → Update record (updatedRecords++)
  - If UNCHANGED → Update lastSyncedAt only
  ↓
Update WaNetSuiteSyncJob (status: COMPLETED)
  ↓
Log results:
  Total: 1,234 customers
  New: 15 customers
  Updated: 42 customers
  Failed: 0 customers
```

### Example 4: Server Startup Preload

**Scenario:** Vercel deployment or server restart

```
Time: 0s
Server starts → instrumentation.ts runs
  ↓
netsuiteClient.preloadCache() starts (background, non-blocking)
  ↓
Server ready to accept requests (IMMEDIATELY)
  ↓
Background: Fetch ALL customers from NetSuite (~35s)
Background: Fetch ALL items from NetSuite (~28s)
  ↓
Time: 70s
Cache customers to Redis (chunked, 1 week TTL)
Cache items to Redis (chunked, 1 week TTL)
  ↓
All searches now INSTANT ⚡
  ↓
Cache expires after 1 week
Next search triggers fresh fetch + re-cache
```

## Configuration

### Environment Variables

```bash
# NetSuite API Credentials (OAuth 1.0a TBA)
NETSUITE_ACCOUNT_ID="4129093"
NETSUITE_CONSUMER_KEY="..."
NETSUITE_CONSUMER_SECRET="..."
NETSUITE_TOKEN_ID="..."
NETSUITE_TOKEN_SECRET="..."
NETSUITE_REST_URL="https://4129093.suitetalk.api.netsuite.com/services/rest"
NETSUITE_RESTLET_URL="https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1"

# Data Source Configuration
NETSUITE_DATA_SOURCE="auto"  # Options: netsuite, mock, auto (default)

# Cron Security (Production Only)
CRON_SECRET="your-secret-key"  # Vercel provides this automatically

# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### Vercel Cron Configuration

**File:** `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/netsuite-sync",
      "schedule": "0 22 * * *"
    }
  ]
}
```

**Cron Schedule Syntax:**
```
┌────── minute (0 - 59)
│ ┌──── hour (0 - 23)
│ │ ┌── day of month (1 - 31)
│ │ │ ┌ month (1 - 12)
│ │ │ │ ┌ day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
0 22 * * *  = Daily at 10 PM UTC (11 PM Paris CET)
```

**Common Schedules:**
- `0 22 * * *` - Daily at 10 PM UTC (11 PM Paris CET)
- `0 21 * * *` - Daily at 9 PM UTC (11 PM Paris CEST)
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight

## Monitoring & Debugging

### Check Cache Status

**API Endpoint:**
```bash
GET /api/cron/netsuite-sync
```

**Response:**
```json
{
  "success": true,
  "totalCachedCustomers": 1234,
  "lastSuccessfulSync": "2026-01-22T22:00:00Z",
  "lastSyncStats": {
    "totalRecords": 1234,
    "newRecords": 15,
    "updatedRecords": 42
  },
  "recentJobs": [
    {
      "id": "cm123abc",
      "status": "COMPLETED",
      "startedAt": "2026-01-22T22:00:00Z",
      "completedAt": "2026-01-22T22:02:15Z",
      "totalRecords": 1234,
      "newRecords": 15,
      "updatedRecords": 42,
      "failedRecords": 0
    }
  ]
}
```

### Check Redis Cache

**Server-side (in code):**
```typescript
import { netsuiteClient } from '@/lib/integrations/netsuite';

const status = await netsuiteClient.getCacheStatus();
console.log(status);
// {
//   customers: { cached: true, count: 1234 },
//   items: { cached: true, count: 567 },
//   redis: { connected: true, type: 'redis' }
// }
```

### View Sync History

**Database Query:**
```sql
-- Last 10 sync jobs
SELECT * FROM "WaNetSuiteSyncJob"
ORDER BY "startedAt" DESC
LIMIT 10;

-- Failed syncs
SELECT * FROM "WaNetSuiteSyncJob"
WHERE status = 'FAILED'
ORDER BY "startedAt" DESC;

-- Sync performance
SELECT
  id,
  status,
  EXTRACT(EPOCH FROM ("completedAt" - "startedAt")) as duration_seconds,
  "totalRecords",
  "newRecords",
  "updatedRecords",
  "failedRecords"
FROM "WaNetSuiteSyncJob"
WHERE status = 'COMPLETED'
ORDER BY "completedAt" DESC
LIMIT 20;
```

### Logs

**Startup Preload:**
```
[Server] Initializing...
[Server] Background cache preload started
[Server] Server is ready to accept requests
[NetSuite] 🚀 Starting background cache preload...
[NetSuite] This will take ~70 seconds (customers + items)
[NetSuite] Fetching all customers from NetSuite RESTlet...
[NetSuite] ✅ Preloaded 1,234 customers in 35.42s (chunked)
[NetSuite] Fetching all items from NetSuite RESTlet...
[NetSuite] ✅ Preloaded 567 items in 28.15s (chunked)
[NetSuite] 🎉 Cache preload complete in 70.23s
[NetSuite] All searches will now be INSTANT! ⚡
[NetSuite] Cache valid for 1 week
```

**Daily Sync:**
```
[NetSuite Cron] Sync triggered
[NetSuite Sync] Starting sync job: cm123abc
[NetSuite Sync] Fetched customers: 1234
[NetSuite Sync] Processing customer 1/1234...
[NetSuite Sync] Processing customer 1234/1234...
[NetSuite Sync] Sync completed in 125000 ms
[NetSuite Cron] Sync completed: {
  success: true,
  jobId: 'cm123abc',
  totalRecords: 1234,
  newRecords: 15,
  updatedRecords: 42,
  failedRecords: 0,
  duration: 125000
}
```

## Performance Metrics

### Expected Performance

| Metric | Value | Notes |
|--------|-------|-------|
| **First Search (Cold)** | ~35 seconds | Fetches ALL customers from NetSuite |
| **Searches (Warm)** | <100ms | From Redis cache (INSTANT) |
| **Cache TTL** | 1 week | 604,800 seconds |
| **Startup Preload** | ~70 seconds | Background, non-blocking |
| **Daily Sync** | ~2-5 minutes | Depends on customer count |
| **Redis Storage** | ~5MB per chunk | Compressed JSON |
| **PostgreSQL Storage** | ~1KB per customer | Persistent cache |

### Scalability

| Customer Count | Redis Storage | Fetch Time | Chunks |
|----------------|---------------|------------|--------|
| 100 | ~500KB | ~5s | 1 |
| 1,000 | ~5MB | ~20s | 1-2 |
| 10,000 | ~50MB | ~3min | 10 |
| 50,000 | ~250MB | ~15min | 50 |

**Note:** Chunked storage handles any size, but Upstash free tier has 10MB total limit.

## Troubleshooting

### Issue: Searches are slow (>5 seconds)

**Possible Causes:**
1. Redis cache empty or expired
2. First search after server restart
3. NetSuite API slow/down

**Solution:**
```bash
# Check cache status
curl http://localhost:3010/api/cron/netsuite-sync

# Manually trigger preload
curl -X POST http://localhost:3010/api/cron/netsuite-sync \
  -H "Authorization: Bearer $CRON_SECRET"

# Check Redis connection
# (In code)
const status = await netsuiteClient.getCacheStatus();
console.log(status.redis.connected);  // Should be true
```

### Issue: Daily sync failing

**Check Logs:**
```sql
SELECT * FROM "WaNetSuiteSyncJob"
WHERE status = 'FAILED'
ORDER BY "startedAt" DESC
LIMIT 1;
```

**Common Errors:**
- **OAuth 401:** Check NetSuite credentials
- **Timeout:** NetSuite slow, increase timeout
- **Rate Limit:** Too many API calls, add delay
- **Database Lock:** Sync already running

### Issue: Mock data showing instead of NetSuite

**Check Configuration:**
```typescript
import { waGetDataSourceStatus } from '@/lib/integrations/netsuite-dual-source';

const status = await waGetDataSourceStatus();
console.log(status);
// {
//   configured: 'auto',
//   activeSource: 'mock',  // ← Should be 'netsuite'
//   netsuiteConfigured: false,  // ← Should be true
//   mockData: { customers: 10, items: 20 }
// }
```

**Solution:**
- Verify all 5 NetSuite environment variables are set
- Check `NETSUITE_DATA_SOURCE` is `auto` or `netsuite`
- Test NetSuite connection manually

### Issue: Cron not running

**Vercel Dashboard:**
1. Go to Vercel Dashboard → Project → Crons
2. Check if cron is listed
3. View execution logs
4. Check for errors

**Local Testing:**
```bash
# Cron doesn't run locally - test manually
curl -X POST http://localhost:3010/api/cron/netsuite-sync
```

## Best Practices

### 1. Cache Invalidation

**When to Clear Cache:**
- Major NetSuite data changes (bulk update)
- After NetSuite migration
- Testing cache functionality

**How to Clear:**
```typescript
import { netsuiteClient } from '@/lib/integrations/netsuite';

await netsuiteClient.clearCache();
console.log('Cache cleared - next search will fetch fresh data');
```

### 2. Monitoring

**Set up alerts for:**
- Sync job failures (check `WaNetSuiteSyncJob.status = 'FAILED'`)
- Long sync duration (>10 minutes)
- Redis connection errors
- High failed record count

### 3. Data Consistency

**Delta Sync Fields:**
The sync only updates if these fields change:
- `companyName`
- `address`
- `city`
- `country`
- `industry`

**To add more fields:**
```typescript
// lib/integrations/netsuite-sync.ts
const hasChanges =
  existing.companyName !== customer.companyName ||
  existing.address !== customer.address ||
  existing.city !== customer.city ||
  existing.country !== customer.country ||
  existing.industry !== customer.industry ||
  existing.phone !== customer.phone;  // Add new field
```

### 4. Security

**Cron Endpoint Protection:**
- Production: Requires `CRON_SECRET` or Vercel cron header
- Development: Open for testing
- Never expose `CRON_SECRET` in client code

**NetSuite Credentials:**
- Store in Vercel environment variables (encrypted)
- Never commit to git
- Use different credentials per environment

## Migration & Deployment

### Initial Setup

1. **Configure NetSuite Credentials:**
   ```bash
   # Vercel Dashboard → Project → Settings → Environment Variables
   NETSUITE_ACCOUNT_ID="4129093"
   NETSUITE_CONSUMER_KEY="..."
   NETSUITE_CONSUMER_SECRET="..."
   NETSUITE_TOKEN_ID="..."
   NETSUITE_TOKEN_SECRET="..."
   NETSUITE_RESTLET_URL="..."
   ```

2. **Configure Redis:**
   ```bash
   # Upstash Dashboard → Create Database → Copy credentials
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```

3. **Deploy to Vercel:**
   ```bash
   git push origin main
   # Vercel auto-deploys
   # Cron automatically registers from vercel.json
   ```

4. **Verify Cron:**
   ```bash
   # Vercel Dashboard → Project → Crons
   # Should show: /api/cron/netsuite-sync (Daily at 10 PM UTC)
   ```

5. **Trigger First Sync:**
   ```bash
   # Wait for server startup (automatic preload)
   # OR manually trigger
   curl -X POST https://your-app.vercel.app/api/cron/netsuite-sync \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

6. **Verify Cache:**
   ```bash
   curl https://your-app.vercel.app/api/cron/netsuite-sync
   # Should show totalCachedCustomers > 0
   ```

### Changing Sync Schedule

1. **Update `vercel.json`:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/netsuite-sync",
         "schedule": "0 21 * * *"  // New schedule
       }
     ]
   }
   ```

2. **Deploy:**
   ```bash
   git add vercel.json
   git commit -m "chore: Update cron schedule"
   git push origin main
   ```

3. **Verify in Vercel Dashboard:**
   - Cron → View Details → Next Run Time

## Summary

### ✅ What's Already Implemented

1. **✅ Background Preload on Startup**
   - Runs automatically when server starts
   - Non-blocking (server ready immediately)
   - ~70 seconds to preload all data
   - Users get INSTANT searches after preload

2. **✅ Multi-Tier Caching**
   - Redis (Tier 1): 1 week TTL, INSTANT
   - PostgreSQL (Tier 2): Daily sync, persistent
   - Mock DB (Tier 3): Development fallback

3. **✅ Daily Sync**
   - Now runs at 11 PM Paris (10 PM UTC)
   - Delta sync (only changed records)
   - Tracks sync jobs in database
   - Handles failures gracefully

4. **✅ Dual-Source Strategy**
   - Auto-detects NetSuite vs Mock
   - Falls back on API errors
   - Configurable via environment variable

### 🚀 User Experience

- **First search (cold):** ~35 seconds (rare, only after server restart before preload completes)
- **All other searches:** <100ms (INSTANT from Redis)
- **Cache duration:** 1 week (searches stay fast)
- **Daily updates:** Fresh data every night at 11 PM Paris

### 📊 Data Freshness

- **Real-time:** No (would be too slow)
- **Near real-time:** Yes (within 24 hours via daily sync)
- **Cache expiry:** 1 week (automatically refreshes)
- **Manual refresh:** Supported (clear cache API)

---

**Documentation Version:** 1.0.0
**Last Updated:** 2026-01-22
**Author:** WA Development Team with Claude Sonnet 4.5
