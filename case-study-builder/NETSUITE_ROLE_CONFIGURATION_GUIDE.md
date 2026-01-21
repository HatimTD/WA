# NetSuite Role Configuration Guide for RESTlet Access

## ⚠️ Critical Issue: "INVALID_LOGIN_ATTEMPT" (403 Error)

Your OAuth credentials are being rejected by NetSuite. This is **almost always** a role permission issue.

## Step-by-Step Verification Process

### Step 1: Find Your Token Information

1. Log into NetSuite
2. Navigate to: **Setup → Users/Roles → Access Tokens → Manage Tokens**
3. Search for Token ID: `ff6fe602b352cacb5c3db4e24decf1054469bf2de52b58d8b5602859050b41cc`
4. **Note down:**
   - Token Status (must be "Active")
   - Role assigned to this token
   - Application Name
   - User associated with the token

### Step 2: Verify Token Status

**Check that:**
- ✅ Status = "Active" (not Revoked, Expired, or Inactive)
- ✅ Token shows no expiration date (or far future date)
- ✅ Token is assigned to a valid NetSuite user

**If token is not Active:**
- Generate a new access token
- Update your .env.local with new NETSUITE_TOKEN_ID and NETSUITE_TOKEN_SECRET

---

### Step 3: Check Integration Record

1. Navigate to: **Setup → Integration → Manage Integrations**
2. Find integration with Consumer Key: `a2a1ff67e62a2f9348df06b6ba0b6567b495930101e2a4998760924c76e10ef3`
3. **Verify these settings:**
   - ✅ State = "Enabled"
   - ✅ "Token-Based Authentication" = CHECKED (Enabled)
   - ✅ "TBA: Authorization Flow" section exists
   - ✅ "User Credentials" = Optional (for token-based auth)

**If integration is not enabled or TBA not checked:**
- Edit the integration
- Check "Token-Based Authentication"
- Save

---

### Step 4: Check Role Permissions (CRITICAL)

This is the **most common cause** of 403 errors!

1. Navigate to: **Setup → Users/Roles → Manage Roles**
2. Find the role from Step 1 (the role assigned to your token)
3. Click **Edit** on that role

#### Required Permissions:

**A. Permissions Tab:**

Find the "Setup" section and verify:
- ✅ **Web Services** = Full (or at minimum: View, Edit)
- ❌ **Web Services Only** = NOT CHECKED

**⚠️ CRITICAL:** If "Web Services Only" is checked, **RESTlets will NOT work!** This is a NetSuite restriction.

**B. Restrictions Tab:**

Check the "Restrictions" section:
- ❌ Ensure no IP restrictions that would block your server IP
- ❌ Ensure no time restrictions that would block current time

**C. Custom Records Tab (if applicable):**

If your RESTlet accesses custom records, ensure the role has:
- View, Create, Edit permissions for those records

---

### Step 5: Verify Script Deployment Permissions

1. Navigate to: **Customization → Scripting → Scripts**
2. Find your RESTlet script (Script ID: **10293**)
3. Click on the **Deployments** subtab
4. Find deployment ID: **1**
5. Click **Edit** on that deployment

**Verify:**
- ✅ Status = "Released"
- ✅ "Audience" section → Check if role is listed
  - If specific roles are listed, your token's role MUST be in this list
  - If "All Roles" is selected, that's fine

**Deployment URL should be:**
```
https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=10293&deploy=1
```

---

### Step 6: Check Script Record Itself

1. Navigate to: **Customization → Scripting → Scripts**
2. Find Script ID: **10293**
3. Click **Edit**

**Verify:**
- ✅ Status = "Testing" or "Released"
- ✅ Script file is attached
- ✅ No errors in the script record

---

## Common Issues and Solutions

### Issue 1: "Web Services Only" Role

**Problem:** Role has "Web Services Only" restriction checked

**Solution:**
1. Edit the role (Setup → Users/Roles → Manage Roles)
2. Go to "Restrictions" tab
3. **UNCHECK** "Web Services Only"
4. Save the role
5. Test again

### Issue 2: Missing Web Services Permission

**Problem:** Role doesn't have "Web Services" permission

**Solution:**
1. Edit the role
2. Go to "Permissions" tab → "Setup" section
3. Find "Web Services" row
4. Set level to "Full" or at minimum "View"
5. Save the role

### Issue 3: Script Not Accessible to Role

**Problem:** RESTlet deployment doesn't allow your role

**Solution:**
1. Go to script deployment (Customization → Scripting → Scripts → Script 10293 → Deployment 1)
2. Edit deployment
3. In "Audience" section, either:
   - Select "All Roles", OR
   - Add your specific role to the list
4. Save deployment

### Issue 4: Integration Not Enabled

**Problem:** Integration doesn't have TBA enabled

**Solution:**
1. Setup → Integration → Manage Integrations
2. Find your integration
3. Edit it
4. Check "Token-Based Authentication"
5. Save

### Issue 5: Token Expired or Revoked

**Problem:** Token is no longer valid

**Solution:**
1. Generate new access token (Setup → Users/Roles → Access Tokens → New)
2. Use the same integration and role
3. Update .env.local with new NETSUITE_TOKEN_ID and NETSUITE_TOKEN_SECRET
4. Restart your development server

---

## Testing Checklist

After making changes, verify:

- [ ] Token status is "Active"
- [ ] Integration has "Token-Based Authentication" enabled
- [ ] Role has "Web Services" permission (Full or View/Edit)
- [ ] Role does NOT have "Web Services Only" restriction
- [ ] Script 10293 deployment 1 is "Released"
- [ ] Script deployment allows your role (All Roles or specific list includes your role)
- [ ] No IP restrictions blocking your requests
- [ ] No time restrictions blocking current time

---

## How to Generate a New Token (If Needed)

1. Navigate to: **Setup → Users/Roles → Access Tokens → New**
2. Fill in:
   - Application Name: Select your integration
   - User: Select a user (can be your admin user)
   - Role: Select a role WITHOUT "Web Services Only" restriction
   - Token Name: e.g., "Case Study Builder Token"
3. Click **Save**
4. NetSuite will display:
   - Token ID
   - Token Secret
5. **Copy these immediately** (Token Secret is only shown once!)
6. Update your `.env.local`:
   ```
   NETSUITE_TOKEN_ID="new-token-id-here"
   NETSUITE_TOKEN_SECRET="new-token-secret-here"
   ```
7. Restart your dev server: `npm run dev`

---

## Quick Reference: What You're Testing

**RESTlet URL:**
```
https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=10293&deploy=1
```

**Test Parameters:**
- `waType=customer` - Fetch customers
- `waType=item` - Fetch items (products)
- `waId=176542` - Fetch specific item by ID

**Expected Success Response:**
```json
{
  "customers": [...],
  // or
  "items": [...]
}
```

**Current Error Response:**
```json
{
  "error": {
    "code": "INVALID_LOGIN_ATTEMPT",
    "message": "Invalid login attempt."
  }
}
```

---

## After Fixing Permissions

Once you've verified and fixed the role configuration:

1. Test using the web UI: `http://localhost:3010/dashboard/admin/netsuite-test`
2. Click "Check Configuration" to verify credentials are loaded
3. Click "Test Connection" to test the RESTlet
4. You should see a success response with actual customer/item data

---

## Need Help?

If you've verified all the above and still getting errors:

1. Check NetSuite Login Audit Trail:
   - Setup → Users/Roles → Login Audit Trail
   - Look for failed login attempts from your Token ID
   - Error messages may provide more details

2. Contact your NetSuite Administrator:
   - They can verify role permissions
   - They can check if there are account-level restrictions
   - They can verify the RESTlet script is functioning

3. NetSuite Support:
   - Case ID: Provide Token ID and Integration details
   - Include the error message and timestamp
   - Reference: Token-Based Authentication for RESTlets

---

## Reference Documentation

- [NetSuite TBA Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1530099787.html)
- [RESTlet Authentication](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2971402.html)
- [OAuth 1.0 Signature](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1534941088.html)
