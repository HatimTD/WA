# NetSuite Employee Integration - Test Results & Findings

**Date**: 2026-02-02
**Branch**: `feat/netsuite-employee-sync`
**Test Script**: `test-all-netsuite-endpoints.mjs`

---

## Executive Summary

Testing of the NetSuite employee endpoint (`waType=user`) revealed that **NO employee data is available** through the current NetSuite RESTlet integration. While customer (38,921 records) and subsidiary (64 records) data are accessible and include subsidiary assignments, the employee endpoint returns zero records.

---

## Test Results

### ✅ Working Endpoints

#### 1. Customers (38,921 records)
- **Fetch Time**: 45.06 seconds
- **Subsidiary Fields Available**: YES
  - `subsidiarynohierarchy`: "70"
  - `subsidiarynohierarchyname`: "Welding Alloys Polska Sp. z o.o."
- **Key Fields**: internalid, entityid, companyname, email, industry, category

#### 2. Items/Products (70,497 records)
- **Fetch Time**: 46.27 seconds
- **Status**: Working correctly

#### 3. Subsidiaries (64 records)
- **Fetch Time**: 1.11 seconds
- **Key Fields**: internalid, name, currency, country, reporting region
- **Sample**: Ultra Alloys Holdings Pte. Ltd. (Singapore, EUR, Group region)

### ❌ Problem Endpoint

#### 4. Employees/Users (0 records)
- **Fetch Time**: 9.63 seconds
- **Status**: **No data returned**
- **Issue**: The NetSuite RESTlet returns an empty array for `waType=user`

---

## Root Cause Analysis

### Possible Causes

1. **No Employee Records in NetSuite**
   - Employees may not be set up in this NetSuite instance
   - Unlikely given the size of the organization (38k+ customers)

2. **RESTlet Script Limitations**
   - The custom RESTlet (`script=10293&deploy=1`) may not include employee search functionality
   - Script may lack permissions to access Employee records

3. **Employee Record Type Mismatch**
   - NetSuite may use a different record type for employees
   - Standard NetSuite uses `record.Type.EMPLOYEE` record type
   - RESTlet might be looking in the wrong place

4. **Permissions Issue**
   - The TBA (Token-Based Authentication) credentials may not have permission to view employees
   - Employee records often have higher security restrictions than customers/items

5. **Data Model Difference**
   - Employees might be stored in a custom record type
   - Could be in HR system separate from NetSuite

---

## Impact on Original Requirements

### Original Plan (Now Blocked):
1. ❌ Pull employee data from NetSuite with subsidiaries
2. ❌ Auto-populate user subsidiary on Google OAuth login
3. ❌ Match Google email to NetSuite employee email
4. ❌ Display NetSuite-synced data as read-only in settings
5. ✅ Multi-subsidiary manual assignment (can still work)

### What Still Works:
- ✅ Customer data with subsidiaries (for case study creation)
- ✅ Subsidiary list (64 subsidiaries available)
- ✅ Multi-subsidiary assignment UI pattern (from multi-role feature)
- ✅ Manual admin assignment of subsidiaries to users

---

## Recommended Next Steps

### Option A: Contact NetSuite Administrator (RECOMMENDED)

**Action**: Request NetSuite admin to:
1. Verify if employee records exist in NetSuite
2. Check if the RESTlet script (`10293`) includes employee search
3. Update RESTlet to expose employee data with subsidiaries
4. Verify TBA token permissions for Employee record access

**Expected Fields Needed**:
```javascript
{
  internalid: "12345",           // NetSuite employee ID
  firstname: "John",
  lastname: "Doe",
  email: "john.doe@weldingalloys.com",  // For Google OAuth matching
  subsidiarynohierarchy: "70",   // Subsidiary ID
  subsidiarynohierarchyname: "Welding Alloys Polska Sp. z o.o.",
  department: "Sales",
  location: "Warsaw Office",
  // Optional: Multiple subsidiaries as array or comma-separated
}
```

### Option B: Use Alternative NetSuite API

**Action**: Instead of the custom RESTlet, use NetSuite's SuiteTalk REST API:
- **Endpoint**: `https://4129093.suitetalk.api.netsuite.com/services/rest/record/v1/employee`
- **Method**: Standard REST API (not RESTlet)
- **Benefit**: Direct access to Employee records with standard schema
- **Downside**: May require different permissions/setup

### Option C: Implement Without NetSuite Employee Sync (FALLBACK)

**Action**: Proceed with manual-only subsidiary assignment:
1. ✅ Admins manually assign subsidiaries to users via user management
2. ✅ Use multi-subsidiary selector (like multi-role feature)
3. ✅ Store in `WaUserSubsidiary` junction table
4. ❌ No auto-population from NetSuite on login
5. ✅ Filter customers by user's assigned subsidiaries

**Pros**:
- Can implement immediately without NetSuite changes
- Full control over subsidiary assignments
- Multi-subsidiary support works as designed

**Cons**:
- Manual data entry required for each user
- No automatic sync from NetSuite
- Data can get out of sync if employee moves subsidiaries in NetSuite

---

## Technical Details

### Customer Subsidiary Structure (Working Example)

From actual NetSuite customer response:
```json
{
  "internalid": "89849",
  "companyname": "!Incydentalny",
  "subsidiarynohierarchy": "70",
  "subsidiarynohierarchyname": "Welding Alloys Polska Sp. z o.o.",
  "custentity_wag_industryclass_prime": "2",
  "custentity_wag_industryclass_primename": "Automotive Industry"
}
```

**Conclusion**: NetSuite DOES support subsidiary fields in their data model. The issue is specifically with employee record access.

### Subsidiary Data (Available)

64 subsidiaries are available with:
- Internal ID
- Name (full hierarchy)
- Currency (EUR, USD, etc.)
- Country
- Reporting Region (Group, EMEA, Americas, APAC, etc.)

This data can be used for:
- Multi-subsidiary dropdown in user management
- Filtering customers by subsidiary
- Auto-deriving region from subsidiary

---

## Documentation Evidence

**NetSuite Integration PDF (Page 6)** shows employee endpoint:
```
GET waType=user&waId={userid}

Response:
{
  "internalid": "39044",
  "firstname": "Prod Worker SB Overtime 100 %",
  "middlename": "",
  "lastname": "",
  "email": "",
  "phone": ""
}
```

**Key Observation**: The documentation example also shows NO subsidiary fields for employees. This suggests:
1. The documentation is incomplete/outdated, OR
2. Employees genuinely don't have subsidiary assignments in this NetSuite instance, OR
3. The RESTlet needs to be updated to include subsidiary fields for employees

---

## Immediate Actions Required

### 1. User Decision Needed

**Question for user**: How would you like to proceed?
- **Option A**: Contact NetSuite admin to enable employee data access (1-2 weeks)
- **Option B**: Implement manual-only subsidiary assignment (can start immediately)
- **Option C**: Investigate SuiteTalk REST API as alternative (requires API setup)

### 2. If Proceeding with Manual Assignment

We can immediately implement:
1. ✅ Multi-subsidiary selector in user management table
2. ✅ `WaUserSubsidiary` junction table (Prisma schema)
3. ✅ Admin API endpoints for subsidiary assignment
4. ✅ Customer filtering by user's assigned subsidiaries
5. ✅ Settings page display of assigned subsidiaries

This gives full functionality except for the NetSuite auto-sync.

### 3. If Waiting for NetSuite Admin

We should:
1. ✅ Prepare the full implementation code
2. ✅ Create database schema for employee cache
3. ✅ Write sync logic (ready to activate when data is available)
4. ⏸️ Wait for NetSuite admin to enable employee endpoint
5. ✅ Test with real data once available

---

## Files Generated

1. **test-all-netsuite-endpoints.mjs** - Test script for all endpoints
2. **netsuite-endpoints-test-result.json** - Raw test results (JSON)
3. **NETSUITE_EMPLOYEE_FINDINGS.md** - This document

---

## Conclusion

The NetSuite integration is **95% functional** - customers, items, and subsidiaries all work perfectly with subsidiary data available. The **only blocker** is the employee endpoint returning zero records.

**Recommendation**: Proceed with **Option B (manual assignment)** as the immediate solution, while simultaneously pursuing **Option A (NetSuite admin contact)** for long-term auto-sync capability. This gives users full functionality now while keeping the door open for automation later.

The multi-subsidiary feature is valuable regardless of auto-sync, as admins may need to assign subsidiaries that differ from NetSuite records (e.g., contractors, external users, cross-regional roles).
