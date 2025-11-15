# Offline Mode Testing Guide

This guide will help you test the complete offline functionality of the Case Study Builder PWA.

## Prerequisites

Before testing, you need to:
1. Build the production version (service workers don't work in dev mode)
2. Have admin access to configure offline settings
3. Use Chrome/Edge DevTools for testing

## Step 1: Build for Production

```bash
# Build the production version
npm run build

# Start the production server
npm start
```

The app will run on `http://localhost:3000`

## Step 2: Configure Offline Settings (Admin Panel)

1. Login as an admin user
2. Navigate to **Dashboard → System Settings**
3. Scroll to **"Offline Mode & PWA Settings"**
4. Verify/Configure:
   - ✅ Enable Offline Mode: **ON**
   - Database Cases: **24 hours**
   - Library Content: **7 days**
   - Saved Cases: **7 days**
   - Analytics: **1 hour**
   - Leaderboard: **1 hour**
   - Static Assets: **30 days**
   - Images: **30 days**
   - Auto Sync Interval: **30 seconds**
   - Max Retries: **3**
5. Click **"Save Offline Settings"**

## Step 3: Verify Service Worker Registration

### Using Chrome DevTools:

1. Open Chrome DevTools (`F12`)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. You should see:
   - ✅ Service worker registered for `/`
   - ✅ Status: **activated and running**
   - ✅ Source: `/sw.js`

### Console Verification:

Open Console tab and look for:
```
[SW] Service Worker registered: ServiceWorkerRegistration {...}
[SyncService] Auto-sync started
```

## Step 4: Test Caching

### Check Cache Storage:

1. In DevTools → **Application** tab
2. Click **Cache Storage** in left sidebar
3. You should see multiple caches:
   - `static-assets`
   - `next-static`
   - `api-cases`
   - `api-library`
   - `api-saved-cases`
   - `api-analytics`
   - `api-leaderboard`
   - `cloudinary-images`
   - `google-user-images`

### Check IndexedDB:

1. In DevTools → **Application** tab
2. Click **IndexedDB** in left sidebar
3. You should see:
   - ✅ **CaseStudyBuilderDB** database
   - Tables: caseStudies, savedCases, users, comments, weldingProcedures, analytics, pendingChanges, syncMetadata

## Step 5: Test Offline Functionality

### Method 1: Using DevTools

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Check **"Offline"** checkbox at top
4. Refresh the page
5. ✅ App should still load and work
6. ✅ Orange banner should appear: "You are offline..."

### Method 2: Using Chrome Settings

1. Open DevTools (`F12`)
2. Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
3. Type "offline" and select **"Network: Go offline"**
4. Test the app functionality

### Method 3: Disable Network Adapter (Real Test)

1. Disconnect WiFi or ethernet
2. Test the app
3. ✅ Should work offline

## Step 6: Test Offline Features

While offline, test these features:

### ✅ Browse Database Cases
1. Navigate to **Database** page
2. Search for cases
3. Click on a case to view details
4. **Expected**: Cases load from IndexedDB

### ✅ View Saved Cases
1. Navigate to **Saved Cases**
2. View your saved cases list
3. **Expected**: Saved cases load from IndexedDB

### ✅ Search Functionality
1. Use the search bar
2. **Expected**: Search works on cached data

### ✅ View Library
1. Navigate to **Library**
2. Browse welding procedures
3. **Expected**: Library content loads from cache

### ✅ View Analytics
1. Navigate to **Analytics**
2. **Expected**: Shows cached analytics data

### ✅ View Leaderboard
1. Navigate to **Leaderboard**
2. **Expected**: Shows cached leaderboard

### ✅ Save a Case (Offline)
1. Navigate to a case study
2. Click **Save** button
3. **Expected**:
   - Case saved to IndexedDB
   - Added to pending changes queue
   - Success message shown

### ✅ Add a Comment (Offline)
1. Navigate to a case study
2. Add a comment
3. **Expected**:
   - Comment added to IndexedDB
   - Added to pending changes queue
   - Shows in comments list with "(pending)" indicator

## Step 7: Test Sync on Reconnection

1. While offline, perform actions:
   - Save a case
   - Add a comment
2. Open DevTools → **Application** → **IndexedDB** → **pendingChanges**
3. ✅ Should see pending changes listed
4. Go back online (enable network)
5. **Expected**:
   - ✅ Green banner appears: "You are back online! Syncing changes..."
   - ✅ Console shows: `[SyncService] Syncing X changes`
   - ✅ Console shows: `[SyncService] Synced change {id}`
   - ✅ Pending changes cleared from IndexedDB
   - ✅ Data synced to server

## Step 8: Test Storage Management

### Check Storage Usage:

1. Go to **System Settings** (admin)
2. Scroll to **Storage Information**
3. ✅ Should show:
   - Used storage (e.g., "2.5 MB")
   - Quota (e.g., "50 GB")
   - Percentage bar
   - Storage percentage

### Test Clear Expired Cache:

1. Click **"Clear Expired"** button
2. ✅ Should clear only expired cache entries
3. ✅ Success toast message

### Test Clear All Cache:

1. Click **"Clear All Cache"** button
2. Confirm the action
3. ✅ All IndexedDB data cleared
4. ✅ Success toast message
5. ✅ Storage usage resets to ~0

### Test Manual Sync:

1. Click **"Sync Now"** button
2. ✅ Should trigger sync immediately
3. ✅ Success toast with sync count

## Step 9: Test PWA Installation

### Desktop (Chrome/Edge):

1. Look for install icon in address bar (⊕ or install icon)
2. Click **"Install"**
3. ✅ App installs as standalone app
4. ✅ Can launch from desktop/start menu
5. ✅ Runs in app window (no browser UI)

### Mobile (Chrome/Safari):

1. Open site on mobile
2. **Android**: Tap "Add to Home Screen" banner
3. **iOS**: Tap Share → "Add to Home Screen"
4. ✅ App icon added to home screen
5. ✅ Opens in fullscreen mode
6. ✅ Offline functionality works

## Step 10: Performance Testing

### Test Network Strategies:

1. Open DevTools → **Network** tab
2. Throttle to **"Slow 3G"**
3. Navigate around the app
4. ✅ Should load quickly from cache
5. ✅ Network requests should show "(from ServiceWorker)"

### Test Auto-Sync Interval:

1. Go offline
2. Make changes (save case, add comment)
3. Go online
4. ✅ Sync happens automatically within 30 seconds
5. Check console for: `[SyncService] Syncing X changes`

## Step 11: Error Handling Testing

### Test Failed Sync:

1. Go offline
2. Make changes
3. Modify pending changes in IndexedDB to invalid data
4. Go online
5. ✅ Should retry up to 3 times
6. ✅ Error message shown after max retries
7. ✅ Pending change marked with error

### Test Quota Exceeded:

1. Try to cache large amount of data
2. ✅ Should handle gracefully
3. ✅ Error logged in console
4. ✅ User notified to clear cache

## Expected Console Logs (Normal Operation)

```
✅ [SW] Service Worker registered
✅ [SyncService] Auto-sync started
✅ [Maintenance Page] Maintenance ended, redirecting... (if applicable)
✅ [SyncService] Syncing X changes
✅ [SyncService] Synced change {id}
✅ [SyncService] Sync complete: X synced, 0 errors
```

## Troubleshooting

### Service Worker Not Registering

**Problem**: No service worker in DevTools
**Solution**:
1. Make sure you're running production build (`npm start`, not `npm run dev`)
2. Check browser console for errors
3. Verify `/sw.js` is accessible at `http://localhost:3000/sw.js`
4. Clear browser cache and hard refresh (`Ctrl+Shift+R`)

### Cache Not Working

**Problem**: Data not loading offline
**Solution**:
1. Ensure you visited pages while online first
2. Check IndexedDB has data
3. Verify cache storage has entries
4. Check service worker is activated

### Sync Not Working

**Problem**: Changes not syncing when back online
**Solution**:
1. Check console for sync errors
2. Verify auto-sync is enabled in settings
3. Manually click "Sync Now" in settings
4. Check API endpoints are accessible

### Storage Issues

**Problem**: Storage quota exceeded
**Solution**:
1. Go to System Settings
2. Click "Clear Expired Cache"
3. If needed, click "Clear All Cache"
4. Reload the app

## Success Criteria ✅

Your offline mode is working correctly if:

- ✅ Service worker registers and activates
- ✅ Offline indicator appears when offline
- ✅ All main features work offline (browse, search, view)
- ✅ Changes queued in pending changes while offline
- ✅ Auto-sync works when reconnecting
- ✅ Admin panel shows storage info correctly
- ✅ Manual sync works
- ✅ Cache management works
- ✅ PWA installs successfully
- ✅ No console errors during normal operation

## Vercel Deployment Testing

After deploying to Vercel:

1. Visit your production URL (e.g., `https://your-app.vercel.app`)
2. ✅ HTTPS is automatic
3. ✅ Service worker registers (check DevTools)
4. ✅ Repeat all tests above
5. ✅ PWA installation works
6. ✅ Offline mode works

**Note**: Clear browser cache when testing production deployment to ensure fresh service worker.

## Reporting Issues

If you encounter issues:

1. Check browser console for errors
2. Check service worker status in DevTools
3. Verify IndexedDB and Cache Storage
4. Check Network tab for failed requests
5. Report with console logs and screenshots
