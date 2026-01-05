# BRD v3.2 Gap Analysis - Comprehensive Review

**Date:** 2025-12-13
**Version:** 2.0 (Revised with Deep Analysis)
**Status:** Final Review

---

## Executive Summary

This document provides a comprehensive comparison of BRD v3.2 requirements against our current codebase implementation. It includes a dual-CRM strategy for both Insightly and NetSuite integration.

**Key Findings:**
- 20+ features fully implemented
- 8 critical gaps (P0)
- 5 high priority gaps (P1) - partially implemented
- Dual-CRM strategy recommended (Insightly + NetSuite)

---

## 🔴 CRITICAL GAPS (P0) - Not Implemented

### 1. Insightly CRM Integration (BRD 3.4D) - DUAL-CRM STRATEGY

**BRD Requirement:**
- Pull: Fetch Customer Data (Name, Location, Industry) from Insightly CRM
- Push: Push final PDF and metadata back to Customer Record in Insightly upon publication
- User selects customer from Insightly CRM list

**Current Implementation:**
- ✅ NetSuite integration EXISTS ([netsuite.ts](lib/integrations/netsuite.ts))
- ❌ Insightly integration MISSING
- BRD Section 3.6 says "No ERP Integration (NetSuite)" but BRD 3.4D requires Insightly CRM

**RECOMMENDED: USE BOTH SYSTEMS**

| Feature | NetSuite (ERP) | Insightly (CRM) |
|---------|----------------|-----------------|
| **Purpose** | Finance/Accounting | Sales Pipeline/Contacts |
| **Customer Pull** | ✅ Implemented | ❌ Need to add |
| **PDF Push** | ❌ To add | ❌ To add |
| **API** | REST + SuiteQL | REST v3.1 |
| **Auth** | OAuth 1.0 HMAC-SHA256 | Base64 API Key |

**Insightly API Details:**
```
Base URL: https://api.{pod}.insightly.com/v3.1/
Auth: Authorization: Basic {base64(api_key)}
Rate Limit: 10 req/sec
Endpoints:
  - GET /Contacts - List contacts
  - GET /Organisations - List companies
  - POST /Notes - Add case study reference
  - GET /Opportunities - Sales pipeline
```
Sources: [Insightly API v3.1](https://api.na1.insightly.com/v3.1/), [Insightly Dev Portal](https://www.insightly.com/api-for-developers/)

**NetSuite API (Existing):**
```
Base URL: https://{account}.suitetalk.api.netsuite.com/services/rest
Auth: OAuth 1.0 with HMAC-SHA256
Current Implementation: lib/integrations/netsuite.ts
```
Sources: [NetSuite REST API](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4260857223.html)

**Implementation Plan:**
1. Keep NetSuite for ERP/finance customer data
2. Add Insightly for CRM pipeline and sales data
3. Use Insightly for Challenge Qualifier customer selection (per BRD)
4. Sync PDF to both systems on publication

---

### 2. Okta SSO (BRD 3.4E)

**BRD Requirement:**
- Integration with Okta (via Auth0 or direct) AND/OR Google Workspace

**Current Implementation:**
- ✅ Google OAuth with @weldingalloys.com domain restriction
- ❌ No Okta integration

**Implementation:**
- Add `next-auth` Okta provider
- Configure SAML or OIDC with Okta
- Env vars: `OKTA_DOMAIN`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`

---

### 3. Translation System (BRD 3.4C)

**BRD Requirement:**
- Input: Users input data in their local language
- Output: System automatically translates content into Corporate English
- Transparency: Notice must display "This case study was originally written in [Language]"

**Current Implementation:**
- ❌ English only
- ❌ No translation system
- ❌ No language detection

**Implementation Plan:**
1. Add `originalLanguage` field to CaseStudy schema
2. Use Google Translate API or DeepL for auto-translation
3. Store both original and translated text
4. Add notice in PDF: "Originally written in [Language]"

---

### 4. AI Bullet-to-Prose Drafting (BRD 3.4B)

**BRD Requirement:**
- System takes bullet points or voice notes and generates professional, structured text summaries

**Current Implementation:**
- ✅ General AI text improvement exists
- ✅ Voice input exists
- ❌ No specific bullet→prose conversion

**Gap:** Add dedicated "Convert to Prose" button that:
1. Detects bullet point format
2. Expands bullets into professional paragraphs
3. Maintains technical accuracy

---

### 5. Quality Score (BRD Section 4)

**BRD Requirement:**
- Completion Indicators showing % completion AND a "Quality Score" for the entry

**Current Implementation:**
- ✅ Completion percentage in [flag-calculator.ts](lib/utils/flag-calculator.ts)
- ❌ No separate "Quality Score"

**Quality Score Criteria (to implement):**
- Photo quality (resolution, clarity)
- Text length adequacy
- Technical detail depth
- Data completeness beyond minimum
- Problem/solution clarity

---

### 6. OEM Search Filter (BRD Section 5)

**BRD Requirement:**
- Database searchable by: Tags, Industry, Component, **OEM**, Wear Type, WA Product, Country, Customer, Revenue, Contributor

**Current Implementation:**
- ✅ Search by most fields
- ❌ No dedicated OEM field or filter

**Implementation:**
1. Add `oem String?` field to CaseStudy schema
2. Add OEM input field to form
3. Add OEM filter to search page

---

### 7. Regional BHAG Split (BRD 3.5)

**BRD Requirement:**
- BHAG Dashboard showing progress split by:
  - "New Customer" vs. "Cross-Sell"
  - AND by Region

**Current Implementation:**
- ✅ Global BHAG tracking exists ([bhag/page.tsx](app/dashboard/bhag/page.tsx))
- ❌ No regional breakdown
- ❌ No split by qualifier type (New Customer vs Cross-Sell)

**Implementation:**
1. Group BHAG by user.region
2. Split by qualifierType (NEW_CUSTOMER vs CROSS_SELL vs MAINTENANCE)
3. Add regional filter/tabs to BHAG dashboard

---

### 8. Case Study Comparison PDF (BRD 3.5)

**BRD Requirement:**
- Select 2-3 existing challenges and generate a comparison PDF
- Highlight: Annual Potential Revenue, Service Life

**Current Implementation:**
- ✅ Have [/dashboard/compare](app/dashboard/compare/page.tsx) page
- ❓ Need to verify PDF generation

**Verify/Implement:**
- Check if comparison exports to PDF
- Add highlight sections for revenue & service life

---

## 🟠 HIGH PRIORITY GAPS (P1) - Partially Implemented

### 9. Challenge Qualifier + CRM Selection (BRD 3.1)

**BRD Workflow:**
1. User Selects Customer (from **Insightly CRM** list or creates new)
2. Q1: "Has this customer bought anything in the last 3 years?"
3. Q2: "Has this customer bought this specific product from WA before?"

**Current Implementation:**
- ✅ [challenge-qualifier.tsx](components/case-study-form/challenge-qualifier.tsx) - 2-question flow
- ✅ NetSuite customer search exists
- ❌ Missing Insightly customer selection (per BRD)

**Gap:** Integrate Insightly customer lookup into qualifier flow

---

### 10. Visual Celebration Feedback (BRD Section 4)

**BRD Requirement:**
- **New Industrial Challenge**: Green checkmark, "Challenge Accepted" badge, celebration
- **Current Solution**: Neutral "Knowledge Base Update" feedback

**Current Implementation:**
- Basic result display
- ❓ May not have celebration animations

**Enhancement:** Add confetti/animation for "Challenge Accepted"

---

### 11. Offline Challenge Qualifier (BRD 3.4A)

**BRD Requirement:**
- Complete Challenge Qualifier questions offline
- Draft entire case study (text + photos) offline
- Auto-sync when connectivity restored

**Current Implementation:**
- ✅ PWA/offline support ([sw.ts](app/sw.ts))
- ✅ IndexedDB storage
- ❓ Verify qualifier flow works offline

---

### 12. PDF Push to CRM (BRD 3.4D)

**BRD Requirement:**
- Push final PDF and metadata back to Customer Record in Insightly upon publication

**Current Implementation:**
- ✅ PDF generation works
- ❌ No automatic push to Insightly
- ❌ No automatic push to NetSuite

---

### 13. Duplicate Detection (BRD Section 5) - ✅ FIXED

**BRD Requirement:**
- BHAG Counting Rule: A solved challenge is counted once when Customer Name, Location, Component, and WA Solution are unique
- Duplicates treated as updates

**Current Implementation:**
- ✅ FIXED: [bhag-actions.ts](lib/actions/bhag-actions.ts) now uses correct deduplication key
- Deduplication Key: `customerName|location|componentWorkpiece|waProduct`
- All BHAG functions updated: `getBHAGProgress`, `getRegionalBHAGProgress`, `getIndustryBHAGProgress`, `getQualifierTypeBHAGProgress`, `getContributorRegionBHAGProgress`
- Schema has matching unique constraint: `@@unique([customerName, location, componentWorkpiece, waProduct])`

**Note:** Also added IT_DEPARTMENT and MARKETING roles per BRD Section 2.2

---

## 🟡 MEDIUM PRIORITY GAPS (P2)

### 14. Gamification Points (BRD 3.5)
**BRD:** Application (1pt), Tech (2pts), Star (3pts)
**Status:** ✅ Implemented in [flag-calculator.ts](lib/utils/flag-calculator.ts):163

### 15. Badges (BRD 3.5)
**BRD:** Explorer (10 Apps), Expert (10 Techs), Champion (10 Stars)
**Status:** ✅ Implemented in [badge-actions.ts](lib/actions/badge-actions.ts)
**Verify:** Check badge names match BRD exactly

### 16. Regional Leaderboards (BRD 3.5)
**BRD:** Global AND Regional rankings
**Status:** ✅ Global exists, ❓ Verify regional filter

---

## 🟢 FULLY IMPLEMENTED Features

| Feature | BRD Section | Implementation File |
|---------|-------------|---------------------|
| Challenge Qualifier Logic | 3.1 | [challenge-qualifier.tsx](components/case-study-form/challenge-qualifier.tsx) |
| QualifierType Enum | 3.1 | [schema.prisma](prisma/schema.prisma) |
| isTarget Flag | 3.1 | [schema.prisma](prisma/schema.prisma) |
| Flag System (App/Tech/Star) | 3.2 | [flag-calculator.ts](lib/utils/flag-calculator.ts) |
| Customer Data Obfuscation | 6.2 | [data-obfuscation.ts](lib/utils/data-obfuscation.ts) |
| AI Auto-Prompting | 3.4B | [auto-prompt-actions.ts](lib/actions/auto-prompt-actions.ts) |
| Speech-to-Text | 3.4B | [voice-input.tsx](components/voice-input.tsx) |
| Auto-Tagging (AI Vision) | 3.4B | [image-recognition-actions.ts](lib/actions/image-recognition-actions.ts) |
| WhatsApp Sharing | 3.5 | [share-buttons.tsx](components/share-buttons.tsx) |
| Email Sharing | 3.5 | [share-buttons.tsx](components/share-buttons.tsx) |
| MS Teams Sharing | 3.5 | [share-buttons.tsx](components/share-buttons.tsx) |
| Tag Colleagues | 3.5 | [tag-colleagues.tsx](components/tag-colleagues.tsx) |
| PDF Export | 3.4F | [pdf-export.ts](lib/pdf-export.ts) |
| PDF Watermark | 3.4F | [pdf-export.ts](lib/pdf-export.ts) |
| "Internal Use Only" | 3.4F | [pdf-export.ts](lib/pdf-export.ts) |
| BHAG Dashboard | 3.5 | [bhag/page.tsx](app/dashboard/bhag/page.tsx) |
| Leaderboard | 3.5 | [leaderboard/page.tsx](app/dashboard/leaderboard/page.tsx) |
| Mobile-First | 3.4A | Responsive Tailwind |
| PWA/Offline | 3.4A | [sw.ts](app/sw.ts), [offline components](components/offline-indicator.tsx) |
| Google SSO | 3.4E | [auth.ts](auth.ts) |
| Domain Restriction | 3.4E | [auth.ts](auth.ts) - @weldingalloys.com |
| Approval Workflow | - | [approval-actions.ts](lib/actions/approval-actions.ts) |
| WPS Details Form | 3.3 | [step-wps.tsx](components/case-study-form/step-wps.tsx) |
| Cost Calculator | 3.3 | [cost-calculator.tsx](components/cost-calculator.tsx) |
| NetSuite Integration | - | [netsuite.ts](lib/integrations/netsuite.ts) |
| Photo/Video Upload | 3.3 | [image-upload-actions.ts](lib/actions/image-upload-actions.ts) |
| Completion Indicators | 4 | [completion-indicator.tsx](components/completion-indicator.tsx) |

---

## Implementation Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0-1 | Insightly CRM Integration | High | Critical |
| P0-2 | Okta SSO | Medium | High |
| P0-3 | Translation System | High | Medium |
| P0-4 | AI Bullet-to-Prose | Low | Medium |
| P0-5 | Quality Score | Medium | Medium |
| P0-6 | OEM Field | Low | Low |
| P0-7 | Regional BHAG Split | Medium | High |
| P0-8 | Comparison PDF | Low | Medium |
| P1-1 | CRM in Qualifier Flow | Medium | High |
| P1-2 | Visual Celebrations | Low | Low |
| P1-3 | Offline Qualifier Verify | Low | Medium |
| P1-4 | PDF Push to CRM | Medium | High |

---

## Next Steps

1. **Immediate (Week 1):**
   - Create Insightly integration scaffold
   - Add OEM field to schema
   - Add Quality Score component

2. **Short-term (Weeks 2-3):**
   - Complete Insightly integration
   - Add Okta SSO provider
   - Regional BHAG dashboard

3. **Medium-term (Weeks 4-6):**
   - Translation system with Google/DeepL API
   - PDF push to both CRMs
   - AI bullet-to-prose enhancement

---

## References

### API Documentation
- [Insightly API v3.1](https://api.na1.insightly.com/v3.1/)
- [Insightly Developer Portal](https://www.insightly.com/api-for-developers/)
- [NetSuite SuiteScript API](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_4260857223.html)
- [NetSuite REST Web Services](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_157927488310.html)

### Internal Documentation
- [NETSUITE_INTEGRATION.md](../NETSUITE_INTEGRATION.md)
- [BRD v3.2 PDF](attached)
