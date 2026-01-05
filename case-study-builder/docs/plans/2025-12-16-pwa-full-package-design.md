# PWA Full Package Enhancement Design

**Date:** 2025-12-16
**Status:** Approved
**Priority:** High

---

## Overview

Comprehensive PWA enhancement to enable full offline functionality for the Case Study Builder application, including offline case study creation with photos, auto-sync, mobile responsiveness fixes, and PWA navigation improvements.

---

## Scope

1. Re-enable and fix service worker build
2. Add PWA back button (standalone mode only)
3. Fix mobile responsiveness (leaderboard + all pages audit)
4. Enable full offline case study creation (text + photos as base64)
5. Immediate auto-sync with toast notifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PWA ARCHITECTURE                      │
├─────────────────────────────────────────────────────────┤
│  Components (New/Modified)                               │
│  ├── pwa-back-button.tsx (NEW)                          │
│  ├── sync-notification.tsx (NEW)                        │
│  └── leaderboard/page.tsx (FIX responsive)              │
├─────────────────────────────────────────────────────────┤
│  IndexedDB (Existing + Enhanced)                         │
│  ├── caseStudies (add base64 images)                    │
│  ├── pendingChanges (queue for sync)                    │
│  └── offlineImages (NEW - base64 storage)               │
├─────────────────────────────────────────────────────────┤
│  Service Worker (FIX build issue)                        │
│  ├── sw.ts → sw.js (production build)                   │
│  └── Enable in layout.tsx                               │
├─────────────────────────────────────────────────────────┤
│  Sync Service (Enhanced)                                 │
│  ├── syncAll() with image upload                        │
│  └── Toast notifications during sync                    │
└─────────────────────────────────────────────────────────┘
```

---

## Component Designs

### 1. PWA Back Button (`pwa-back-button.tsx`)

**Behavior:**
- Only renders when `display-mode: standalone` (installed PWA)
- Integrated into the existing `top-bar.tsx` component
- Uses `window.history.back()` for navigation
- Hidden on dashboard root (`/dashboard`)
- Shows on all other internal pages

**Standalone Mode Detection:**
```tsx
const useIsStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mq.matches || (navigator as any).standalone);
    mq.addEventListener('change', (e) => setIsStandalone(e.matches));
  }, []);

  return isStandalone;
};
```

**UI Specifications:**
- Arrow-left icon (ChevronLeft from Lucide)
- 44x44px touch target (iOS guidelines)
- Positioned left side of top bar
- Subtle background on hover/active
- Respects dark mode

---

### 2. Offline Case Study Creation

**New IndexedDB Table: `offlineImages`**
```typescript
offlineImages: '++id, caseStudyTempId, fieldName, base64Data, mimeType, fileName, size, createdAt, _syncStatus'
```

**Enhanced `caseStudies` table:**
- Add `_tempId` for offline-created cases (before server ID exists)
- Add `_offlineImageIds` array linking to offlineImages

**Offline Flow:**
```
User creates case study offline:
┌──────────────────────────────────────────────────┐
│ 1. Challenge Qualifier → Stores in IndexedDB     │
│ 2. Step 1-5 form data → Stores in IndexedDB      │
│ 3. Photo capture/select:                         │
│    - Convert to base64                           │
│    - Store in offlineImages table                │
│    - Show thumbnail with "pending" badge         │
│ 4. WPS/Cost Calculator → Stores in IndexedDB     │
│ 5. Save Draft → pendingChanges queue             │
└──────────────────────────────────────────────────┘

When online restored:
┌──────────────────────────────────────────────────┐
│ 1. Sync service detects online                   │
│ 2. Upload images to Cloudinary first             │
│ 3. Replace base64 refs with Cloudinary URLs      │
│ 4. Create/update case study on server            │
│ 5. Clear synced data from IndexedDB              │
│ 6. Show success notification                     │
└──────────────────────────────────────────────────┘
```

**Storage Limits:**
- Max 50MB total for offline images
- Show warning at 40MB usage
- Max 5MB per image (auto-compress larger)
- Display storage usage in offline-settings

---

### 3. Sync Notifications (`sync-notification.tsx`)

**Toast Notification States:**

```
Online detected:
┌─────────────────────────────────────────┐
│ 🔄 Syncing 3 pending changes...         │
│ ████████░░░░░░░░ 2/3                    │
└─────────────────────────────────────────┘

Success:
┌─────────────────────────────────────────┐
│ ✓ All changes synced successfully       │
│   3 case studies, 5 images uploaded     │
└─────────────────────────────────────────┘

Partial failure:
┌─────────────────────────────────────────┐
│ ⚠ 2 of 3 changes synced                 │
│   1 failed - will retry automatically   │
│   [View Details]                        │
└─────────────────────────────────────────┘
```

**Sync Service Events:**
```typescript
onSyncStart: (pendingCount: number) => void
onSyncProgress: (completed: number, total: number) => void
onSyncComplete: (results: SyncResult) => void
onSyncError: (error: Error) => void
```

**UI Library:** Use existing `sonner` toast

---

### 4. Mobile Responsiveness Fixes

**Critical Fix - Leaderboard Podium:**
```tsx
// Before (broken)
<div className="grid grid-cols-3 gap-4">

// After (fixed)
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
```

**Pages to Audit & Fix:**

| Page | Current Issue | Fix |
|------|--------------|-----|
| `/dashboard/leaderboard` | Podium 3-col fixed | Add `sm:` breakpoint |
| `/dashboard/analytics` | Charts fixed height | Add responsive heights |
| `/dashboard/compare` | Side-by-side only | Stack on mobile |
| `/dashboard/approvals` | Table overflow | Horizontal scroll wrapper |
| `/dashboard/admin/*` | Tables overflow | Horizontal scroll wrapper |

**Global Patterns:**

Table wrapper:
```tsx
<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
  <Table>...</Table>
</div>
```

Chart responsive heights:
```tsx
className="h-[250px] sm:h-[300px] lg:h-[350px]"
```

Card grid patterns:
```tsx
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
```

---

### 5. Service Worker Fix

**Current Issue:**
Service worker disabled in `layout.tsx` with comment: "service worker not building in production"

**Fix Strategy:**

1. Verify Serwist config in `next.config.ts`
2. Test service worker build: `npm run build`
3. Check if `public/sw.js` is generated
4. Re-enable `<ServiceWorkerRegister />` in layout.tsx
5. Add error handling with graceful fallback

**Caching Strategy:**
- Static assets: Cache-first (long TTL)
- API routes: Network-first with cache fallback
- Images: Cache-first with 30-day expiry
- Navigation: Network-first, fallback to `/offline`

---

## Implementation Tasks

1. [ ] Fix service worker build issue
2. [ ] Create PWA back button component
3. [ ] Integrate back button into top-bar.tsx
4. [ ] Fix leaderboard mobile responsiveness
5. [ ] Audit all dashboard pages for mobile
6. [ ] Add offlineImages table to IndexedDB schema
7. [ ] Create image-to-base64 utility
8. [ ] Enhance case study form for offline mode
9. [ ] Add sync event emitters to syncService
10. [ ] Create sync notification component
11. [ ] Test full offline flow end-to-end
12. [ ] Test PWA installation on iOS and Android

---

## Testing Plan

1. **Service Worker:**
   - Build succeeds without errors
   - SW registers in production
   - Offline page loads when offline

2. **Back Button:**
   - Only visible in standalone mode
   - Hidden on dashboard root
   - Navigation works correctly

3. **Offline Case Study:**
   - Can complete Challenge Qualifier offline
   - Can fill all form steps offline
   - Photos save as base64
   - Storage warnings appear at limits

4. **Sync:**
   - Auto-sync triggers when online
   - Progress toast shows correctly
   - Images upload to Cloudinary
   - Case study created on server
   - IndexedDB cleared after sync

5. **Responsiveness:**
   - Leaderboard works on 320px width
   - All pages usable on mobile
   - Touch targets meet 44px minimum

---

*Design approved: 2025-12-16*
