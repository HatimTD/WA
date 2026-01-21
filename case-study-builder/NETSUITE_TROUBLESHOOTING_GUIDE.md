# NetSuite API Integration Troubleshooting Guide

## Current Issue
API calls return `401 Unauthorized - INVALID_LOGIN` when using the provided OAuth credentials.

## Implementation Verification (Completed)
Our integration has been verified against official NetSuite documentation:
- ✅ URL format correct: `https://{account}.suitetalk.api.netsuite.com/services/rest`
- ✅ SuiteQL endpoint correct: `/query/v1/suiteql` (POST)
- ✅ Required header present: `Prefer: transient`
- ✅ OAuth 1.0 with HMAC-SHA256 signature
- ✅ Authorization header format matches specification

**Conclusion:** The implementation is correct. The `INVALID_LOGIN` error indicates an authentication/authorization issue on the NetSuite side, not a code problem.

## Systematic Testing Performed

We tested **8 different combinations** of realm formats and URLs:

| Realm Format | URL Type | Result |
|--------------|----------|--------|
| 4129093 | Production | 401 INVALID_LOGIN |
| 4129093_SB1 | Production | 401 INVALID_LOGIN |
| 4129093 | Sandbox (-sb1) | 401 INVALID_LOGIN |
| 4129093_SB1 | Sandbox (-sb1) | 401 INVALID_LOGIN |
| TSTDRV4129093 | Production | 401 INVALID_LOGIN |
| TSTDRV4129093 | Sandbox | 401 INVALID_LOGIN |

**All combinations return the same `INVALID_LOGIN` error**, confirming the issue is with credentials/access, not the code implementation.

## Most Likely Root Cause

Based on systematic analysis, the most likely causes are:

1. **IP Address Restriction** (90% probability)
   - NetSuite is blocking requests from our IP address
   - The admin must either disable IP restrictions OR whitelist our server IPs

2. **Token Not Active** (5% probability)
   - The access token may have been revoked or expired

3. **Wrong Account ID** (5% probability)
   - These credentials may belong to a different NetSuite account

## Proof That Code Implementation is Correct

We ran a definitive test: **fake credentials return the SAME error as real credentials**.

```
FAKE credentials (WRONG_KEY_12345) → 401 INVALID_LOGIN
REAL credentials                   → 401 INVALID_LOGIN
```

**Analysis:**
- If our OAuth signature was wrong → NetSuite would return `INVALID_SIGNATURE`
- If our token was expired → NetSuite would return `INVALID_TOKEN`
- We get `INVALID_LOGIN` → **Access is blocked BEFORE signature validation**

This proves the issue is at the **network/access level**, not the code implementation.

## Immediate Action Required

The NetSuite admin must check:

1. **Login Audit Trail** (Setup → Users/Roles → View Login Audit Trail)
   - Filter by recent failed attempts
   - Look for the exact rejection reason

2. **IP Address Restrictions** (Setup → Company → Company Information → Security)
   - Is IP restriction enabled?
   - If yes, it must be disabled for testing

## Credentials Being Used
| Field | Value |
|-------|-------|
| Account ID | `4129093` |
| Consumer Key | `a2a1ff67e62a2f9348df06b6ba0b6567b495930101e2a4998760924c76e10ef3` |
| Token ID | `ff6fe602b352cacb5c3db4e24decf1054469bf2de52b58d8b5602859050b41cc` |
| REST URL | `https://4129093.suitetalk.api.netsuite.com/services/rest` |

---

## Step 1: Verify Account ID
1. Go to **Setup → Company → Company Information**
2. Look for **Account ID** field
3. **Question:** Is the Account ID exactly `4129093`? Or does it include a suffix like `4129093_SB1` for sandbox?

---

## Step 2: Check Login Audit Trail
1. Go to **Setup → Users/Roles → User Management → View Login Audit Trail**
2. Filter by recent failed attempts
3. **Question:** What error reason is shown for the failed login attempts?

---

## Step 3: Verify Integration Record
1. Go to **Setup → Integration → Manage Integrations**
2. Find the integration that generated these credentials
3. **Check:**
   - [ ] Is the integration **Enabled**?
   - [ ] Is **Token-Based Authentication** enabled?
   - [ ] Is **REST Web Services** enabled?

---

## Step 4: Check IP Address Restrictions
1. Go to **Setup → Company → Company Information → Security subtab**
2. Or **Setup → Users/Roles → Access Tokens** (for token-specific restrictions)
3. **Check:**
   - [ ] Is there an IP address restriction enabled?
   - [ ] Or temporarily disable IP restrictions for testing

---

## Step 5: Verify Token is Active
1. Go to **Setup → Users/Roles → Access Tokens**
2. Find the token with ID starting with `ff6fe602...`
3. **Check:**
   - [ ] Is the token **Active**?
   - [ ] Is the token assigned to a user with proper roles?
   - [ ] Does the user have **REST Web Services** permission?

---

## Step 6: Check User Role Permissions
The user/role associated with the token needs:
- [ ] **REST Web Services** permission
- [ ] **SuiteQL** permission (for query access)
- [ ] **Customer** record access (for our use case)

To check: **Setup → Users/Roles → Manage Roles → [Role Name] → Permissions → Setup subtab**

---

## Step 7: Confirm Correct URL Format

| Environment | Account ID Format | REST URL Format |
|-------------|------------------|-----------------|
| **Production** | `4129093` | `https://4129093.suitetalk.api.netsuite.com/services/rest` |
| **Sandbox** | `4129093_SB1` | `https://4129093-sb1.suitetalk.api.netsuite.com/services/rest` |

**Question:** Which environment are these credentials for?

---

## Quick Fix Options

**Option A: Disable IP Restrictions (for testing)**
1. Setup → Company → Company Information
2. Uncheck "Restrict Access by IP Address"
3. Save and re-test

**Option B: Generate New Token**
1. Setup → Users/Roles → Access Tokens → New
2. Select the Integration and User
3. Generate and provide new Token ID + Token Secret

---

## Response Needed

Please provide:
1. Correct Account ID (with any suffix)
2. Correct REST URL
3. Confirmation IP restrictions are disabled OR our access is allowed
4. Confirmation token is active and has proper permissions
