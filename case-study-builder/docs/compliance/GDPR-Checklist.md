# GDPR Compliance Checklist

**WA Software Development Policy Reference:** Section 7.5 (ISO 27001 Compliance)

**Document Version:** 1.0
**Last Updated:** December 2024
**Classification:** Internal Use

---

## Overview

This checklist ensures the Case Study Builder application complies with the General Data Protection Regulation (GDPR) and aligns with WA Software Development Policy V2.3 data protection requirements.

---

## 1. Lawful Basis for Processing

### 1.1 Lawful Basis Documentation

| Processing Activity | Lawful Basis | Documentation |
|---------------------|--------------|---------------|
| User authentication | Legitimate interest | Privacy Policy Section 3 |
| Case study storage | Contract performance | Terms of Service |
| Analytics | Legitimate interest | Privacy Policy Section 5 |
| AI-powered features | Consent | Feature opt-in dialog |
| Marketing communications | Consent | Email preferences |

### 1.2 Checklist

- [x] **Identified lawful basis** for each processing activity
- [x] **Documented lawful basis** in Records of Processing Activities (ROPA)
- [x] **Consent mechanism** implemented for AI features
- [x] **Consent withdrawal** functionality available
- [x] **Legitimate interest assessment** completed where applicable

---

## 2. Data Subject Rights

### 2.1 Right of Access (Article 15)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Provide copy of personal data | Export feature in settings | Implemented |
| Response within 30 days | Automated email system | Implemented |
| Free of charge | No fees applied | Implemented |
| Verify identity before disclosure | Email verification required | Implemented |

**Implementation Location:** `app/api/user/export/route.ts`

### 2.2 Right to Rectification (Article 16)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Correct inaccurate data | Profile edit functionality | Implemented |
| Complete incomplete data | Profile completion prompts | Implemented |

**Implementation Location:** `app/(protected)/settings/page.tsx`

### 2.3 Right to Erasure (Article 17)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Delete personal data on request | Account deletion feature | Implemented |
| Soft delete with 30-day recovery | `deletedAt` field in schema | Implemented |
| Notify third parties | Webhook notifications | Implemented |
| Hard delete after retention | Scheduled cleanup job | Implemented |

**Implementation Location:** `app/api/user/delete/route.ts`

**Prisma Schema Fields:**
```prisma
isActive  Boolean   @default(true)
deletedAt DateTime?
deletedBy String?
```

### 2.4 Right to Data Portability (Article 20)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Machine-readable format | JSON/CSV export | Implemented |
| Commonly used format | Standard JSON schema | Implemented |
| Transmit to another controller | Download capability | Implemented |

**Export Formats Available:**
- JSON (complete data)
- CSV (tabular data)
- PDF (case studies)

### 2.5 Right to Restrict Processing (Article 18)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Mark data as restricted | `processingRestricted` flag | Implemented |
| Limit processing scope | Conditional business logic | Implemented |

### 2.6 Right to Object (Article 21)

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Object to processing | Opt-out mechanisms | Implemented |
| Stop processing on objection | Feature toggles | Implemented |
| Direct marketing opt-out | Email preferences | Implemented |

---

## 3. Privacy by Design (Article 25)

### 3.1 Technical Measures

| Measure | Implementation | WA Policy Ref |
|---------|----------------|---------------|
| Data minimization | Only collect necessary fields | 7.5.1 |
| Encryption at rest | AES-256 via Neon DB | 7.5.2 |
| Encryption in transit | TLS 1.3 enforced | 7.5.2 |
| Access controls | RBAC with NextAuth.js | 3.1 |
| Audit logging | `lib/wa-audit-logger.ts` | 3.2 |
| Pseudonymization | User IDs instead of names in logs | 7.5.3 |

### 3.2 Organizational Measures

| Measure | Implementation | Status |
|---------|----------------|--------|
| Data protection training | Required for all staff | Active |
| Access reviews | Quarterly review process | Scheduled |
| Incident response plan | Documented procedures | Complete |
| DPO appointment | Security team contact | Assigned |

---

## 4. Data Protection Impact Assessment (DPIA)

### 4.1 When DPIA Required

A DPIA is required when processing:
- [x] New AI-powered features (Image Recognition)
- [x] Large-scale profiling
- [x] Sensitive data categories
- [ ] Systematic monitoring (not applicable)

### 4.2 DPIA for AI Features

**Feature:** Image Recognition / OCR

| Assessment Area | Finding | Risk Level | Mitigation |
|-----------------|---------|------------|------------|
| Data collected | Images, extracted text | Medium | Auto-delete after processing |
| Purpose | Content assistance | Low | Clear user disclosure |
| Necessity | User-initiated only | Low | Opt-in feature |
| Third-party sharing | OpenAI API | Medium | DPA in place |
| Retention | Temporary processing | Low | No permanent storage |
| User rights | Full control retained | Low | Delete anytime |

**Overall Risk Rating:** LOW-MEDIUM
**Approved By:** IT Security Team
**Review Date:** December 2025

---

## 5. Data Breach Management (Articles 33-34)

### 5.1 Breach Detection

| Detection Method | Implementation | Response Time |
|------------------|----------------|---------------|
| Real-time monitoring | Sentry integration | Immediate |
| Failed login alerts | Threshold triggers | 5 minutes |
| Anomaly detection | Usage pattern analysis | 15 minutes |
| User reports | Support ticket system | 1 hour |

### 5.2 Breach Response Timeline

| Action | Deadline | Responsible |
|--------|----------|-------------|
| Internal notification | 4 hours | Security team |
| Risk assessment | 12 hours | DPO |
| Supervisory authority notification | 72 hours | DPO |
| Data subject notification | Without undue delay | DPO |
| Remediation | As determined | Engineering |

### 5.3 Breach Documentation Template

```markdown
## Breach Report #[NUMBER]

**Date Discovered:** [DATE]
**Date Occurred:** [DATE]
**Category:** [unauthorized access/disclosure/loss/other]

### Affected Data
- Type: [personal data categories]
- Volume: [number of records]
- Subjects: [number of individuals]

### Impact Assessment
- Risk to individuals: [high/medium/low]
- Likelihood of harm: [high/medium/low]

### Actions Taken
1. [Action 1]
2. [Action 2]

### Notifications Made
- Supervisory authority: [yes/no] - Date: [DATE]
- Data subjects: [yes/no] - Date: [DATE]
```

---

## 6. International Transfers (Chapter V)

### 6.1 Transfer Mechanisms

| Destination | Service | Mechanism | DPA Status |
|-------------|---------|-----------|------------|
| USA | Vercel (hosting) | SCCs + DPA | Signed |
| USA | OpenAI (AI) | SCCs + DPA | Signed |
| USA | Sentry (monitoring) | SCCs + DPA | Signed |
| Australia | Neon (database) | Adequacy (domestic) | N/A |

### 6.2 Transfer Impact Assessment

- [x] Assessed destination country laws
- [x] Implemented supplementary measures
- [x] Encryption provides additional safeguard
- [x] Data minimization reduces exposure
- [x] User consent obtained for AI features

---

## 7. Records of Processing Activities (Article 30)

### 7.1 Controller Records

| Processing Activity | Purpose | Data Categories | Recipients | Retention |
|---------------------|---------|-----------------|------------|-----------|
| User registration | Account management | Identity, contact | Internal | Account life + 7 years |
| Authentication | Access control | Credentials, sessions | Internal | Active session |
| Case study creation | Core service | Content, metadata | User's organization | Until deletion |
| AI analysis | Feature enhancement | Images, text | OpenAI (processor) | Temporary |
| Analytics | Service improvement | Usage data | Internal | 2 years |
| Audit logging | Security, compliance | Actions, IPs | Internal | 7 years |

### 7.2 Documentation Location

All ROPA records maintained in:
- Database: `AuditLog` table
- Documentation: This compliance folder
- External: Legal team repository

---

## 8. Consent Management

### 8.1 Consent Requirements

| Feature | Consent Type | Withdrawal Method |
|---------|--------------|-------------------|
| AI Image Analysis | Explicit opt-in | Settings toggle |
| Marketing emails | Explicit opt-in | Unsubscribe link |
| Analytics cookies | Implied (essential) | Browser settings |
| Third-party sharing | Explicit opt-in | Settings toggle |

### 8.2 Consent Records

```typescript
// Consent tracking schema
interface ConsentRecord {
  userId: string;
  consentType: 'AI_FEATURES' | 'MARKETING' | 'ANALYTICS';
  granted: boolean;
  timestamp: Date;
  method: 'WEB_FORM' | 'API' | 'EMAIL';
  version: string;  // Consent form version
  ipAddress?: string;
}
```

---

## 9. Third-Party Processor Compliance

### 9.1 Processor Due Diligence

| Processor | Service | DPA Signed | Last Audit | Compliance Status |
|-----------|---------|------------|------------|-------------------|
| Vercel | Hosting | Yes | Nov 2024 | Compliant |
| Neon | Database | Yes | Nov 2024 | Compliant |
| OpenAI | AI Services | Yes | Dec 2024 | Compliant |
| Sentry | Error Monitoring | Yes | Oct 2024 | Compliant |
| GitHub | Source Control | Yes | Sep 2024 | Compliant |

### 9.2 Processor Review Schedule

- **Quarterly:** Security posture review
- **Annually:** Full compliance audit
- **On change:** New processor onboarding

---

## 10. Privacy Notice Requirements

### 10.1 Required Information (Articles 13-14)

| Information | Location | Last Updated |
|-------------|----------|--------------|
| Controller identity | Privacy Policy header | Dec 2024 |
| Contact details | Privacy Policy footer | Dec 2024 |
| Processing purposes | Privacy Policy Section 2 | Dec 2024 |
| Lawful basis | Privacy Policy Section 3 | Dec 2024 |
| Data retention | Privacy Policy Section 6 | Dec 2024 |
| Data subject rights | Privacy Policy Section 7 | Dec 2024 |
| International transfers | Privacy Policy Section 8 | Dec 2024 |
| Automated decision-making | Privacy Policy Section 9 | Dec 2024 |

### 10.2 Notice Delivery

- [x] Displayed at registration
- [x] Accessible in app footer
- [x] Provided via email on account creation
- [x] Version history maintained

---

## 11. Compliance Audit Schedule

| Audit Type | Frequency | Last Completed | Next Due |
|------------|-----------|----------------|----------|
| Internal GDPR review | Quarterly | Dec 2024 | Mar 2025 |
| Processor compliance | Semi-annually | Nov 2024 | May 2025 |
| DPIA review | Annually | Dec 2024 | Dec 2025 |
| Policy update review | Annually | Dec 2024 | Dec 2025 |
| Staff training | Annually | Nov 2024 | Nov 2025 |

---

## 12. Compliance Certification

**Certification Statement:**

I certify that the Case Study Builder application has been reviewed against the requirements of the General Data Protection Regulation (GDPR) and the WA Software Development Policy V2.3. All applicable requirements have been implemented or documented with planned remediation dates.

**Certified By:** _________________________
**Role:** Data Protection Officer
**Date:** _________________________
**Next Review:** _________________________

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | WA IT Security | Initial checklist |
