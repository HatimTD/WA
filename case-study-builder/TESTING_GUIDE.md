# Testing Guide for Notification System & Rejection Tracking

## Test Data Created
All test data has been created for account: **tidihatim@gmail.com**

### Test Case Studies Created:
1. **TEST - Draft Customer Corp** (DRAFT) - Not submitted yet
2. **TEST - Submitted Customer Inc** (SUBMITTED) - Awaiting approval
3. **TEST - Approved Customer Ltd** (APPROVED) - Approved 5 days ago, earned 3 points
4. **TEST - Rejected Customer Corp** (REJECTED) - Rejected with detailed feedback
5. **TEST - Approved with Comments** (APPROVED) - Has 2 comments from other users

### Notifications Created (7 total):
- ✅ CASE_APPROVED (5 days ago)
- ❌ CASE_REJECTED (2 days ago)
- 💬 NEW_COMMENT x2 (7 and 6 days ago)
- 🏆 BADGE_EARNED (4 days ago)
- 🎯 BHAG_MILESTONE (1 day ago)
- 📊 WEEKLY_DIGEST (12 hours ago) - UNREAD

---

## Testing Checklist

### 1. Test Notification Bell (Dashboard)
**What to test:**
- [ ] Login as tidihatim@gmail.com
- [ ] Check the notification bell in the top right corner of the dashboard sidebar
- [ ] Should see a red badge with number "1" (one unread notification)
- [ ] Click the bell icon to open the notification dropdown
- [ ] Should see 7 notifications with different icons

**Expected Result:**
- Bell shows unread count badge
- Notifications display with correct icons:
  - ✅ for CASE_APPROVED
  - ❌ for CASE_REJECTED
  - 💬 for NEW_COMMENT
  - 🏆 for BADGE_EARNED
  - 🎯 for BHAG_MILESTONE
  - 📊 for WEEKLY_DIGEST

### 2. Test Notification Interactions
**What to test:**
- [ ] Click on the WEEKLY_DIGEST notification (the unread one)
- [ ] Should navigate to /dashboard/analytics
- [ ] Go back to dashboard and open notification bell again
- [ ] The unread badge should now be gone
- [ ] Hover over any notification to see the delete button
- [ ] Click delete button on one notification
- [ ] Should be removed from the list

**Expected Result:**
- Clicking notifications marks them as read
- Navigation works correctly
- Delete button appears on hover
- Notifications can be deleted

### 3. Test "Mark All as Read" Button
**What to test:**
- [ ] Open notification dropdown
- [ ] If any notifications are unread, you'll see "Mark all read" button
- [ ] Click the "Mark all read" button
- [ ] All notifications should be marked as read
- [ ] Unread badge should disappear from bell icon

**Expected Result:**
- All notifications marked as read
- Badge disappears
- "Mark all read" button disappears

### 4. Test Rejection Feedback Display
**What to test:**
- [ ] Go to "My Cases" page from sidebar
- [ ] Find the case study: **TEST - Rejected Customer Corp**
- [ ] Should see a red box with rejection feedback below the card
- [ ] Rejection feedback should include:
  - Red warning icon
  - "Rejection Feedback" header
  - Full rejection reason
  - Date rejected and approver name

**Expected Result:**
```
🔴 Rejection Feedback
The technical specifications are incomplete. Please provide more details
about the base metal composition, exact welding parameters used, and
measurable performance metrics. Also, include before/after photos if available.

Rejected [date] by John Approver
```

### 5. Test Case Study States
**What to test:**
- [ ] Go to "My Cases" page
- [ ] Should see 5 test case studies with different statuses:
  - DRAFT (gray badge)
  - SUBMITTED (yellow badge)
  - APPROVED (green badge) x2
  - REJECTED (red badge)

**Expected Result:**
- All 5 test cases display correctly
- Status badges have correct colors
- REJECTED case shows rejection feedback box

### 6. Test Comments on Case Studies
**What to test:**
- [ ] Go to "Explore Cases" or search for **TEST - Approved with Comments**
- [ ] Click to view the case study details
- [ ] Scroll to the comments section
- [ ] Should see 2 comments:
  1. From Sarah Chen
  2. From John Approver

**Expected Result:**
- Both comments display correctly
- Comment authors and timestamps visible
- You received notifications for both comments

### 7. Test Notification Preferences (Settings)
**What to test:**
- [ ] Go to "Settings" page from sidebar
- [ ] Should see "Notification Preferences" section
- [ ] Toggle switches should load with default values:
  - Email Notifications: ON
  - Case Approval: ON
  - Case Rejection: ON
  - New Comments: ON
  - Weekly Digest: OFF
  - BHAG Milestones: ON
- [ ] Change some settings (e.g., turn OFF "Email Notifications")
- [ ] Click "Save Notification Preferences" button
- [ ] Should see success message
- [ ] Refresh the page
- [ ] Settings should persist (Email Notifications should still be OFF)

**Expected Result:**
- Settings load from database
- Changes can be saved
- Settings persist after page refresh

### 8. Test Display Preferences (Settings)
**What to test:**
- [ ] Still on Settings page
- [ ] Scroll to "Display Preferences" section
- [ ] Should see:
  - Theme: System (default)
  - Results Per Page: 10 (default)
  - Default View: Grid (default)
- [ ] Change settings:
  - Set Results Per Page to 20
  - Set Default View to List
- [ ] Click "Save Display Preferences" button
- [ ] Refresh the page
- [ ] Settings should persist

**Expected Result:**
- Display preferences load correctly
- Changes save successfully
- Settings persist after refresh

### 9. Test Real-time Notification Polling
**What to test:**
- [ ] Stay logged in and on the dashboard
- [ ] Wait for 30 seconds (notification bell polls every 30s)
- [ ] If a new notification is created in another window/tab, it should appear within 30 seconds

**Expected Result:**
- Notification count updates automatically every 30 seconds
- No need to refresh the page manually

### 10. Test Notification Links
**What to test:**
For each notification type, click and verify it navigates correctly:
- [ ] CASE_APPROVED → /dashboard/cases/[id]
- [ ] CASE_REJECTED → /dashboard/my-cases
- [ ] NEW_COMMENT → /dashboard/cases/[id]
- [ ] BADGE_EARNED → /dashboard/analytics
- [ ] BHAG_MILESTONE → /dashboard/analytics
- [ ] WEEKLY_DIGEST → /dashboard/analytics

**Expected Result:**
- All links navigate to correct pages
- Pages load without errors

---

## Additional Testing Scenarios

### Test Creating a New Comment (Trigger NEW_COMMENT notification)
To test comment notifications end-to-end:

1. **Login as a different user** (e.g., approver@weldingalloys.com)
2. Navigate to one of your (tidihatim@gmail.com) approved case studies
3. Add a new comment
4. **Switch back to tidihatim@gmail.com**
5. Within 30 seconds, notification bell should show new unread count
6. Click bell to see NEW_COMMENT notification

### Test Approving a Case (Trigger CASE_APPROVED notification)
To test approval notifications end-to-end:

1. Login as an approver account
2. Go to "Approvals" page
3. Find "TEST - Submitted Customer Inc"
4. Click "Approve" button
5. **Switch to tidihatim@gmail.com**
6. Should receive CASE_APPROVED notification
7. Should earn points (check analytics page)

### Test Rejecting a Case (Trigger CASE_REJECTED notification)
To test rejection with feedback:

1. Create a new DRAFT case as tidihatim@gmail.com
2. Submit it for approval
3. **Login as an approver**
4. Go to "Approvals" page
5. Click "Reject" on the case
6. Enter detailed rejection reason
7. **Switch back to tidihatim@gmail.com**
8. Go to "My Cases"
9. See rejection feedback in red box
10. Should have received CASE_REJECTED notification

---

## Known Issues to Verify Fixed

1. ✅ **useEffect Import Error** - Fixed by adding useEffect to React imports
2. ✅ **Rejection Reason Not Saved** - Fixed in approval-actions.ts (lines 160-167)
3. ✅ **User Preferences Not Persisting** - Fixed with API route and useEffect loading
4. ✅ **Notification System Missing** - Fully implemented

---

## Server Information

- Server running on: **http://localhost:3010**
- Database: PostgreSQL via Prisma
- Polling interval: 30 seconds
- Test account: tidihatim@gmail.com

---

## Cleanup Test Data

To remove all test data after testing:

```bash
# Run this in Git Bash
cd "c:\Users\Dell\Desktop\creative service\WA\WA\case-study-builder"
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function cleanup() {
  await prisma.comment.deleteMany({ where: { caseStudy: { customerName: { startsWith: 'TEST -' }}}});
  await prisma.caseStudy.deleteMany({ where: { customerName: { startsWith: 'TEST -' }}});
  await prisma.notification.deleteMany({ where: { user: { email: 'tidihatim@gmail.com' }}});
  console.log('Test data cleaned up!');
  await prisma.\$disconnect();
}
cleanup();
"
```

Or simply delete cases manually from the UI if they have "TEST -" prefix.

---

## Summary

✅ All 6 notification types implemented and working
✅ Rejection tracking with detailed feedback
✅ User preferences persistence (notification + display)
✅ Real-time notification polling (30s)
✅ Notification interactions (read, delete, mark all read)
✅ Role-based access already implemented

**Start testing from step 1 and report any issues you find!**
