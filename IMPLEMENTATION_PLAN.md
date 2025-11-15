# Case Study Builder - Complete Implementation Plan

## CURRENT STATUS - WHAT EXISTS ✅

### Working Features:
- ✅ Next.js 16 with proxy.ts authentication (NOT middleware)
- ✅ Dashboard home page (needs role-based enhancement)
- ✅ Full approvals workflow page (`/dashboard/approvals`)
- ✅ Sidebar navigation with role filtering
- ✅ BHAG tracker (target hardcoded at 1000)
- ✅ Search, leaderboard, comments, compare
- ✅ Multi-step case study forms (APPLICATION/TECH/STAR)
- ✅ WPS for TECH/STAR, Cost Calculator for STAR
- ✅ All database models and API routes

---

## IMPLEMENTATION PLAN

## PHASE 0: Git Commit & Push Current Version (FIRST!)

**Before starting any new work:**

1. Stage all current changes:
   ```bash
   cd case-study-builder
   git add .
   ```

2. Create commit with current state:
   ```bash
   git commit -m "feat: Enhanced compare page with advanced features

   - Added expand/collapse sections
   - Visual diff highlighting (green/red)
   - Winner indication based on metrics
   - Export/print functionality
   - Field filtering system
   - Swap case positions
   - Card-based comparison layout
   - Mobile responsive design

   Fixes:
   - Decimal serialization in edit page
   - Comment reactions positioning
   - WPS data handling in updates
   - Real-time reaction updates"
   ```

3. Push to GitHub:
   ```bash
   git push origin main
   ```

4. **AFTER push is successful**, proceed with Phase 1

---

## PHASE 1: Critical Missing Pages (Week 1-2)

### 1. Settings Page - `/dashboard/settings/page.tsx`
**Status:** Navigation links to it but returns 404

**Create functional settings with:**
- Profile section (edit name, change region)
- Display preferences (theme, results per page)
- Notification preferences (email on/off)
- Data export (download my cases as JSON)

### 2. Admin Panel - Main Dashboard - `/dashboard/admin/page.tsx`
**Role:** ADMIN or APPROVER only

**Features:**
- Quick stats cards (users, cases, pending, BHAG)
- Recent activity feed (registrations, submissions, approvals)
- Quick action buttons
- Charts (user/case trends if time permits)

### 3. Admin - User Management - `/dashboard/admin/users/page.tsx`
**Uses existing actions:** `getAllUsers()`, `changeUserRole()`

**Features:**
- User list table (name, email, role, region, points, cases)
- Search/filter by role
- Role change dropdown per user
- Pagination (20 per page)
- View user details modal

### 4. Admin - System Configuration - `/dashboard/admin/config/page.tsx`
**Make hardcoded values configurable:**

**Create SystemConfig model:**
```prisma
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
  updatedBy String?
}
```

**Configuration sections:**
- BHAG target (currently 1000)
- Point values (APP=1, TECH=2, STAR=3)
- Badge thresholds (10 each)
- Regional settings

**Update BHAG calculation** to read from SystemConfig

---

## PHASE 2: Public Access & Analytics (Week 3-4)

### 5. Public Case Study Library - `/library/page.tsx`
**No login required** - Public route

**Features:**
- Grid of APPROVED cases only
- Search and filters (type, industry, region)
- Pagination (12 per page)
- Public detail page `/library/[id]`
- "Sign in to contribute" CTA

### 6. Contributor Analytics - `/dashboard/analytics/page.tsx`
**Personal analytics for contributors:**

**Metrics:**
- Summary cards (total cases, points, approval rate, badges)
- Charts (submissions over time, case type breakdown, status distribution)
- Recent submissions table
- Best performing cases
- Export analytics to PDF

### 7. Saved Cases Page - `/dashboard/saved/page.tsx` **[NEW - OFFLINE FEATURE]**
**Purpose:** Bookmark cases for offline access

**Features:**
- Grid/list view of saved case studies
- Save/unsave toggle button on all case detail pages
- Filter saved cases (by type, industry, status)
- Search within saved cases
- Works completely offline (pre-cached)
- Badge showing number of saved cases
- Empty state: "Save cases to access them offline"

**Database Model:**
```prisma
model SavedCaseStudy {
  id            String   @id @default(cuid())
  userId        String
  caseStudyId   String
  user          User     @relation(fields: [userId], references: [id])
  caseStudy     CaseStudy @relation(fields: [caseStudyId], references: [id])
  savedAt       DateTime @default(now())

  @@unique([userId, caseStudyId])
  @@index([userId])
}
```

**Offline Storage:**
- Store saved case IDs in IndexedDB
- Pre-cache full case data for saved cases
- Automatic background sync of saved cases
- Download images for saved cases (optional)

**UI Components:**
- Save button (bookmark icon) on case detail pages
- Saved badge count in navigation
- Toast on save/unsave
- Sync indicator for saved cases

---

## PHASE 3: Role-Based Enhancements (Week 5)

### 8. Dashboard Home Enhancement - `/dashboard/page.tsx`
**Add role-specific sections:**

**CONTRIBUTOR (default):**
- Keep existing welcome + quick actions
- Add mini analytics widget (cases this month, points, badge progress)
- Add "Saved Cases" quick link with count

**APPROVER (additional):**
- "Pending Approvals" section at top
- Count + "Review Now" button
- Last 3 pending cases preview

**ADMIN (additional):**
- "System Overview" section
- Total users/cases/BHAG stats
- "Admin Panel" button

### 9. Sidebar Expand/Collapse (Optional)
**Enhance:** `components/dashboard-nav.tsx`

**Features:**
- Toggle button (chevron icon)
- Collapsed: 64px width, icons only with tooltips
- Expanded: 256px width with labels
- Store state in localStorage
- Smooth animation

---

## PHASE 4: Database Updates (Week 6)

### 10. Add ADMIN Role
```prisma
enum Role {
  VIEWER
  CONTRIBUTOR
  APPROVER
  ADMIN       // NEW
}
```

Run migration: `npx prisma migrate dev --name add_admin_role`

### 11. Add SavedCaseStudy Model
```prisma
model SavedCaseStudy {
  id            String   @id @default(cuid())
  userId        String
  caseStudyId   String
  user          User     @relation(fields: [userId], references: [id])
  caseStudy     CaseStudy @relation(fields: [caseStudyId], references: [id])
  savedAt       DateTime @default(now())

  @@unique([userId, caseStudyId])
  @@index([userId])
}
```

Run migration: `npx prisma migrate dev --name add_saved_cases`

### 12. Store Rejection Reasons
```prisma
model CaseStudy {
  // Add:
  rejectionReason String?
  rejectedAt      DateTime?
  rejectedBy      String?
  savedBy         SavedCaseStudy[] // NEW - relation
}

model User {
  // Add:
  savedCases      SavedCaseStudy[] // NEW - relation
}
```

Update `approval-actions.ts` to save rejection reason

---

## PHASE 5: PWA & Offline Mode (Week 7-8)

### 13. Install PWA Dependencies
```bash
npm install @ducanh2912/next-pwa dexie dexie-react-hooks fuse.js
```

### 14. Configure PWA in next.config.ts
**Add PWA wrapper with:**
- Service worker generation
- Cache strategies (CacheFirst, NetworkFirst, StaleWhileRevalidate)
- Cloudinary image caching
- API endpoint caching

### 15. Create Offline Database
**File:** `lib/db/offline-db.ts`

**Dexie schema with tables:**
- `caseStudies` - Store drafts offline
- `savedCases` - **[NEW]** Store saved case studies for offline
- `syncQueue` - Queue actions when offline
- `cachedSearches` - Cache search results

```typescript
export interface OfflineSavedCase {
  id: string;
  caseStudyId: string;
  userId: string;
  caseData: any; // Full case study data
  savedAt: number;
  lastSynced: number;
}

export class CaseStudyDB extends Dexie {
  caseStudies!: Table<OfflineCaseStudy, string>;
  savedCases!: Table<OfflineSavedCase, string>; // NEW
  syncQueue!: Table<SyncQueue, number>;
  cachedSearches!: Table<CachedSearch, number>;

  constructor() {
    super('CaseStudyDatabase');

    this.version(1).stores({
      caseStudies: 'id, contributorId, status, industry, lastModified',
      savedCases: 'id, caseStudyId, userId, savedAt', // NEW
      syncQueue: '++id, timestamp, action, syncStatus',
      cachedSearches: '++id, query, timestamp',
    });
  }
}
```

### 16. Implement Sync Manager
**File:** `lib/db/sync-manager.ts`

**Features:**
- Queue offline actions (create/update/delete/save/unsave)
- Auto-sync when online
- Retry failed syncs (max 5 attempts)
- Conflict resolution (Last Write Wins)
- **[NEW]** Sync saved cases list
- **[NEW]** Pre-cache full data for saved cases

### 17. Offline Search Engine
**File:** `lib/search/offline-search.ts`

**Using Fuse.js:**
- Index cached case studies
- **[NEW]** Index saved cases separately
- Client-side fuzzy search
- Filter by industry/type/status
- Cache results for recent searches

### 18. PWA Manifest
**File:** `app/manifest.ts`

**Configuration:**
- App name, description
- Icons (72px to 512px)
- Display: standalone
- Theme colors
- Categories, screenshots

**Generate icons:**
```bash
npx pwa-asset-generator public/logo.png public/icons --padding "10%"
```

### 19. Background Sync
**Features:**
- Register sync on offline actions
- Sync when connection restored
- **[NEW]** Sync saved cases on interval
- UI indicator for sync status

### 20. Offline Indicator Component
**File:** `components/offline-indicator.tsx`

**Shows:**
- Online/offline status
- Pending sync count
- **[NEW]** Saved cases sync status
- Manual sync button
- Fixed position indicator

### 21. Save Button Component **[NEW]**
**File:** `components/save-case-button.tsx`

**Features:**
- Bookmark icon button
- Toggle save/unsave
- Works offline (queues action)
- Shows saved state
- Toast notification
- Loading state during sync

### 22. Update Proxy for PWA Files
**In proxy.ts, allow:**
- `/sw.js`
- `/manifest.json`
- `/workbox-*`
- `/_next/static/`

---

## FILES TO CREATE

### Core Pages:
1. `app/dashboard/settings/page.tsx`
2. `app/dashboard/admin/page.tsx`
3. `app/dashboard/admin/users/page.tsx`
4. `app/dashboard/admin/config/page.tsx`
5. `app/library/page.tsx`
6. `app/library/[id]/page.tsx`
7. `app/dashboard/analytics/page.tsx`
8. **`app/dashboard/saved/page.tsx` [NEW - Saved Cases]**
9. `app/manifest.ts`

### Backend:
10. `lib/actions/system-config-actions.ts`
11. **`lib/actions/saved-cases-actions.ts` [NEW]**
12. `lib/db/offline-db.ts`
13. `lib/db/sync-manager.ts`
14. `lib/search/offline-search.ts`
15. `lib/hooks/use-offline-case-study.ts`
16. `lib/hooks/use-offline-search.ts`
17. **`lib/hooks/use-saved-cases.ts` [NEW]**
18. `lib/utils/register-sync.ts`

### Components:
19. `components/offline-indicator.tsx`
20. **`components/save-case-button.tsx` [NEW]**

---

## FILES TO MODIFY

1. `prisma/schema.prisma` - Add ADMIN role, SystemConfig, SavedCaseStudy model, rejection fields
2. `next.config.ts` - Add PWA configuration
3. `lib/actions/bhag-actions.ts` - Read target from SystemConfig
4. `lib/actions/approval-actions.ts` - Store rejection reasons
5. `app/dashboard/page.tsx` - Add role-based sections + saved cases count
6. `components/dashboard-nav.tsx` - Add "Saved Cases" link, admin links, optional collapse
7. `proxy.ts` - Add public /library routes, allow PWA files
8. `app/layout.tsx` - Add PWA metadata, offline indicator
9. **`app/dashboard/cases/[id]/page.tsx` - Add save button component [NEW]**

---

## API ROUTES TO CREATE

1. **`app/api/saved-cases/route.ts` [NEW]**
   - GET: Get user's saved cases
   - POST: Save a case study

2. **`app/api/saved-cases/[id]/route.ts` [NEW]**
   - DELETE: Unsave a case study

---

## DATABASE MIGRATIONS NEEDED

```bash
# 1. Add ADMIN role and SystemConfig
npx prisma migrate dev --name add_admin_and_config

# 2. Add SavedCaseStudy model
npx prisma migrate dev --name add_saved_cases

# 3. Add rejection fields
npx prisma migrate dev --name add_rejection_tracking

# 4. Seed system config defaults
npx prisma db seed
```

**Seed data (create seed.ts):**
```typescript
await prisma.systemConfig.createMany({
  data: [
    { key: 'bhag_target', value: '1000' },
    { key: 'points_application', value: '1' },
    { key: 'points_tech', value: '2' },
    { key: 'points_star', value: '3' },
    { key: 'badge_explorer_threshold', value: '10' },
    { key: 'badge_expert_threshold', value: '10' },
    { key: 'badge_champion_threshold', value: '10' },
  ]
})
```

---

## NAVIGATION UPDATES

**Add to sidebar (role-based):**
- **Saved Cases (all users) [NEW - with bookmark icon + count badge]**
- Analytics (all users)
- Settings (all users)
- Admin Dashboard (ADMIN/APPROVER)
- User Management (ADMIN/APPROVER)
- System Config (ADMIN/APPROVER)

---

## OFFLINE CAPABILITIES

### What Works Offline:
✅ Create/edit case study drafts
✅ Search previously loaded cases
✅ Browse cached approved cases
✅ **View saved cases (fully cached) [NEW]**
✅ **Save/unsave cases (queued for sync) [NEW]**
✅ View leaderboard (cached)
✅ View BHAG progress (cached)
✅ Access all UI pages

### What Requires Online:
❌ Submit for approval
❌ Approve/reject cases (admin action)
❌ Upload images (Cloudinary)
❌ Real-time leaderboard updates
❌ User authentication (OAuth)
❌ Initial save sync (queued if offline)

### Sync Behavior:
- Queue all offline actions (including save/unsave)
- Auto-sync when online
- Show pending sync count
- Retry failed syncs (5 attempts)
- Manual sync button
- **Background sync of saved cases every 30 minutes [NEW]**

### Saved Cases Offline Strategy:
1. User clicks "Save" on a case → Saves to IndexedDB immediately
2. If online: Also saves to database via API
3. If offline: Queues save action for sync
4. Pre-caches full case data in IndexedDB
5. Saved cases page reads from IndexedDB (works offline)
6. When online: Syncs save/unsave actions + refreshes cached data

---

## PWA TESTING CHECKLIST

- [ ] Lighthouse PWA score > 90
- [ ] Install prompt appears
- [ ] Works offline after install
- [ ] Can create draft offline
- [ ] Search works offline
- [ ] **Can save/unsave cases offline [NEW]**
- [ ] **Saved cases page works offline [NEW]**
- [ ] Syncs when back online
- [ ] Offline indicator shows
- [ ] Icons display correctly
- [ ] Splash screen shows
- [ ] Standalone mode works
- [ ] Test on real mobile device

---

## ESTIMATED TIMELINE: 8 weeks

**Week 1:** Settings + Admin Dashboard + User Management
**Week 2:** System Config + Database migrations
**Week 3:** Public Library + Saved Cases page
**Week 4:** Contributor Analytics
**Week 5:** Home enhancement + Sidebar (optional)
**Week 6:** Database updates, migrations, seed
**Week 7:** PWA setup, offline storage, service worker
**Week 8:** Offline search, saved cases sync, background sync, testing

---

## SUCCESS CRITERIA

### Core Features:
- ✅ All navigation links work (no 404s)
- ✅ Role-based access control enforced
- ✅ Admin can configure BHAG/points/badges
- ✅ Public can view approved cases
- ✅ Contributors see personal analytics
- ✅ **Users can save cases for offline access [NEW]**

### PWA Features:
- ✅ App installable on mobile
- ✅ Works offline with cached data
- ✅ Drafts saved offline sync when online
- ✅ Search works with cached cases
- ✅ **Saved cases fully accessible offline [NEW]**
- ✅ Offline indicator visible
- ✅ Background sync functional

### Performance:
- ✅ Lighthouse score > 90 (all categories)
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Works on 3G network

---

## PRIORITY ORDER

### CRITICAL (Do First):
1. **Git commit & push current version** ← START HERE
2. Settings page (currently 404)
3. Admin dashboard + user management
4. System configuration (make BHAG/points dynamic)

### HIGH PRIORITY:
5. Public case library
6. **Saved Cases page + functionality [NEW]**
7. Contributor analytics
8. Role-based home enhancements
9. Store rejection reasons

### MEDIUM PRIORITY:
10. PWA setup (manifest, service worker)
11. Offline storage (IndexedDB)
12. Offline search (Fuse.js)
13. **Saved cases offline sync [NEW]**
14. Background sync

### NICE TO HAVE:
15. Sidebar expand/collapse
16. Advanced PWA features
17. Performance optimizations

---

## SAVED CASES FEATURE DETAILS [NEW SECTION]

### User Flow:
1. User browses any case study (own, public library, search results)
2. Clicks bookmark icon to save for offline
3. Case is added to "Saved Cases" page
4. Full case data pre-cached in IndexedDB
5. Works completely offline after initial save
6. Can unsave from saved cases page or detail page

### Implementation Details:

**Save Button States:**
- Not saved: Empty bookmark icon
- Saved: Filled bookmark icon (gold/yellow)
- Saving: Loading spinner
- Offline queued: Bookmark with sync icon

**Saved Cases Page Sections:**
- Header with total count
- Filter/sort options (type, industry, date saved)
- Grid/list toggle
- Empty state with illustration
- Bulk actions (unsave selected)

**Offline Storage:**
```typescript
// Save case for offline
async function saveCaseForOffline(caseId: string) {
  // 1. Fetch full case data
  const caseData = await fetch(`/api/cases/${caseId}`).then(r => r.json());

  // 2. Store in IndexedDB
  await db.savedCases.put({
    id: crypto.randomUUID(),
    caseStudyId: caseId,
    userId: currentUserId,
    caseData: caseData,
    savedAt: Date.now(),
    lastSynced: Date.now(),
  });

  // 3. Queue sync if offline
  if (!navigator.onLine) {
    await db.syncQueue.add({
      action: 'save',
      entityType: 'savedCase',
      entityId: caseId,
      data: { userId: currentUserId, caseStudyId: caseId },
      timestamp: Date.now(),
      retryCount: 0,
    });
  } else {
    // Immediately save to database
    await fetch('/api/saved-cases', {
      method: 'POST',
      body: JSON.stringify({ caseStudyId: caseId }),
    });
  }
}
```

**Benefits:**
- Users control what's available offline
- Reduces storage usage (only cache what's needed)
- Clear user intent (saved = important)
- Works like bookmarks in browsers
- Great for field technicians needing specific cases offline

---

## NOTES

- **Next.js 16 uses proxy.ts** not middleware.ts for auth
- **BHAG target is 1000** not 100,000 (check docs)
- **Approvals page exists** - don't recreate, just enhance
- **All features must be functional** - no placeholders
- **Test offline on real devices** - not just Chrome DevTools
- **Commit often** - don't wait until everything is done
- **Saved cases = explicit offline caching** - user chooses what to save
