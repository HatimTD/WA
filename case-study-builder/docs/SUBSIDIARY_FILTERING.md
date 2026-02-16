# Subsidiary-Based Customer Filtering

## Overview

This document describes the multi-layer filtering system that restricts which customers users can see based on their assigned NetSuite subsidiaries.

**Key Principle**: CONTRIBUTOR users only see customers from their assigned business units, while ADMIN/APPROVER users see all customers.

---

## Table of Contents

1. [Data Model](#data-model)
2. [Architecture Layers](#architecture-layers)
3. [Caching Strategy](#caching-strategy)
4. [Stale Cache Detection](#stale-cache-detection)
5. [Role-Based Access Control](#role-based-access-control)
6. [Key Files](#key-files)
7. [Performance](#performance)

---

## Data Model

### Database Schema

```
User
├── role: ADMIN | APPROVER | CONTRIBUTOR
├── userRoles[] → UserRole (multiple roles per user)
└── userSubsidiaries[] → UserSubsidiary (multiple subsidiaries per user)

UserSubsidiary
├── userId → User
├── subsidiaryId → Subsidiary
├── source: MANUAL | NETSUITE (how it was assigned)
└── assignedAt: DateTime

Subsidiary
├── id: string
├── name: string (e.g., "Welding Alloys France")
├── region: string (e.g., "Europe")
└── integrationId: string (NetSuite subsidiary ID, e.g., "58")
```

### NetSuite Customer Data

Each customer in NetSuite has a `subsidiarynohierarchy` field:

```json
{
  "internalid": "12345",
  "companyname": "ACME Corp",
  "subsidiarynohierarchy": "58",
  "subsidiarynohierarchyname": "Welding Alloys France",
  "country": "SG"
}
```

> **Important**: `subsidiarynohierarchy` is the subsidiary that **manages** the customer, not where the customer is physically located. A customer in Singapore can be managed by the French subsidiary.

---

## Architecture Layers

### Layer 1: User Subsidiary Assignment (Admin UI)

**File**: `components/user-management-table.tsx`

Admins assign subsidiaries to users via multi-select dropdown. Uses ref-based state tracking to handle rapid clicks without race conditions.

### Layer 2: Subsidiary Storage (Server Action)

**File**: `lib/actions/waUserSubsidiaryActions.ts`

Persists user-subsidiary relationships with `source: 'MANUAL'` to distinguish from NetSuite-synced assignments.

### Layer 3: User Subsidiary API

**File**: `app/api/user/subsidiaries/route.ts`

```
GET /api/user/subsidiaries

Response:
{
  "success": true,
  "data": {
    "shouldFilter": true,
    "subsidiaryIds": ["58", "74", "24"],
    "roles": ["CONTRIBUTOR"]
  }
}
```

### Layer 4: Client-Side Filtering

**File**: `components/netsuite-customer-search.tsx`

Filters cached customers by matching `customer.subsidiarynohierarchy` against user's `subsidiaryIds`.

### Layer 5: Server-Side Filtering (Fallback)

**File**: `lib/actions/waNetsuiteActions.ts`

Applies same filtering logic on server when client cache is empty.

---

## Caching Strategy

### 3-Tier Hybrid Cache

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser (IndexedDB)     Server (Redis)      NetSuite API   │
│  ──────────────────     ──────────────       ────────────   │
│  TTL: 1 week            TTL: 1 week          ~35 seconds    │
│  ~38,000 customers      ~38,000 customers    Live data      │
│  Instant access         ~2-3 seconds         Slow fetch     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Search Flow

1. **Check IndexedDB** → HIT? Return instantly
2. **Check Redis** → HIT? Return + cache in IndexedDB
3. **Fetch NetSuite** → Return + cache in Redis + IndexedDB

---

## Stale Cache Detection

### The Problem

When the `subsidiarynohierarchy` field was added to enable filtering, existing cached data didn't have this field populated. Old cache = broken filtering.

### The Solution

Automatically detect and invalidate stale cache by sampling data quality:

```typescript
// Take a sample of 50 customers from cache
const sampleSize = Math.min(50, allCustomers.length);
const sample = allCustomers.slice(0, sampleSize);

// Count how many have the subsidiary field populated
const withSubsidiary = sample.filter(c =>
  c.subsidiarynohierarchy && c.subsidiarynohierarchy !== ''
).length;

// Calculate percentage
const percentageWithData = (withSubsidiary / sampleSize) * 100;

// If less than 80% have data, cache is stale
if (percentageWithData < 80) {
  await indexedDBCache.del(cacheKey);  // Delete stale cache
  allCustomers = null;                  // Force refetch from server
}
```

### Why 80% Threshold?

| Scenario | % with subsidiary | Action |
|----------|-------------------|--------|
| Fresh cache (good data) | 95-100% | Use cache |
| Some missing in NetSuite | 80-95% | Use cache (normal) |
| Old cache (before fix) | 0-10% | Delete & refetch |
| Partially corrupted | 50-79% | Delete & refetch |

**Why not 100%?**
- Some customers in NetSuite legitimately don't have a subsidiary assigned
- Avoids constant unnecessary refreshes

**Why not lower (e.g., 50%)?**
- Would miss partially stale caches
- 80% provides confidence that data quality is acceptable for filtering

### Flow Diagram

```
┌─────────────────────────────────────┐
│     User searches for customer      │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   Check IndexedDB cache             │
│   Found: 38,922 customers           │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   STALE CHECK: Sample 50 customers  │
│   Count: how many have subsidiary?  │
└─────────────────────────────────────┘
                  │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ≥80% have data    <80% have data
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌──────────────┐
   │Use cache│      │Delete cache  │
   │(instant)│      │Fetch fresh   │
   └─────────┘      │(~35 seconds) │
                    └──────────────┘
```

---

## Role-Based Access Control

| Role | Sees Customers | Filtering Applied |
|------|----------------|-------------------|
| **ADMIN** | All ~38,000 customers | None |
| **APPROVER** | All ~38,000 customers | None |
| **CONTRIBUTOR** | Only assigned subsidiaries | By `subsidiarynohierarchy` |

---

## Key Files

| File | Purpose |
|------|---------|
| `app/api/user/subsidiaries/route.ts` | API to get user's filtering config |
| `lib/actions/waUserSubsidiaryActions.ts` | Manage user-subsidiary assignments |
| `lib/actions/waNetsuiteActions.ts` | Server-side customer search + filtering |
| `lib/integrations/netsuite.ts` | NetSuite API + Redis caching |
| `lib/cache/indexeddb-client.ts` | Browser-side IndexedDB cache |
| `components/netsuite-customer-search.tsx` | Customer search UI + client filtering |
| `components/user-management-table.tsx` | Admin UI for subsidiary assignment |
| `app/api/admin/netsuite/clear-cache/route.ts` | Admin cache management |

---

## Performance

| Operation | Time |
|-----------|------|
| First search (cold cache) | ~35 seconds |
| Search with Redis cache only | ~2-3 seconds |
| Search with IndexedDB cache | **<100ms** (instant) |
| Subsequent searches | **<100ms** (instant) |
| Cache TTL | 1 week |

---

## Admin: Clearing Cache

If filtering issues occur, admins can clear the Redis cache:

```javascript
// Run in browser console (logged in as admin)
fetch('/api/admin/netsuite/clear-cache', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

Users can clear their IndexedDB cache via:
- Browser DevTools → Application → IndexedDB → Delete database
- Or clear browser data for the site

---

## Troubleshooting

### Customers from wrong subsidiaries showing

1. Check user's role - ADMIN/APPROVER see all customers
2. Verify user's assigned subsidiaries in User Management
3. Clear IndexedDB cache and retry

### No customers showing for CONTRIBUTOR

1. Verify user has subsidiaries assigned
2. Check if subsidiaries have `integrationId` set (NetSuite ID)
3. Verify customers exist in NetSuite for those subsidiaries

### Slow searches

1. Check if IndexedDB cache exists (should be instant after first load)
2. Clear stale cache to force fresh fetch
3. Redis cache may have expired (1 week TTL)


  The subsidiarynohierarchy from NetSuite maps to integrationId in the WaSubsidiary table. On Google login:
  1. Find employee by email in WaNetsuiteEmployee
  2. Get their subsidiarynohierarchy (e.g., "26")
  3. Find WaSubsidiary where integrationId = "26"
  4. Create UserSubsidiary assignment with source = "NETSUITE"