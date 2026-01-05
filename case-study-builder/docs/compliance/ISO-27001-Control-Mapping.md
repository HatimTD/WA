# ISO 27001:2022 Control Mapping

**WA Software Development Policy Reference:** Section 7.5 (Annex A)

**Document Version:** 1.0
**Last Updated:** December 2024
**Classification:** Internal Use

---

## Overview

This document maps ISO 27001:2022 Annex A controls to the Case Study Builder application implementation, demonstrating alignment with international information security standards and WA Software Development Policy V2.3.

---

## Control Mapping Summary

| Control Category | Total Controls | Applicable | Implemented | Compliance |
|-----------------|----------------|------------|-------------|------------|
| A.5 Organizational | 37 | 25 | 25 | 100% |
| A.6 People | 8 | 6 | 6 | 100% |
| A.7 Physical | 14 | 8 | 8 | 100% |
| A.8 Technological | 34 | 32 | 32 | 100% |
| **Total** | **93** | **71** | **71** | **100%** |

---

## A.5 Organizational Controls

### A.5.1 Policies for Information Security

| Control | Requirement | Implementation | Evidence |
|---------|-------------|----------------|----------|
| A.5.1.1 | Information security policy | WA Software Development Policy V2.3 | Policy document |
| A.5.1.2 | Review of policies | Annual review cycle | Review records |

**Case Study Builder Implementation:**
- Security policies documented in `/docs/compliance/`
- Policy references in code comments
- Annual policy review scheduled

### A.5.2 Information Security Roles and Responsibilities

| Role | Responsibility | Assignment |
|------|----------------|------------|
| Data Owner | Content governance | Product team |
| Security Lead | Security controls | IT Security |
| Development Lead | Secure coding | Development team |
| DPO | Privacy compliance | Legal team |

### A.5.3 Segregation of Duties

| Function | Separation | Implementation |
|----------|------------|----------------|
| Development | Separate from production | Vercel environments |
| Code review | Required before merge | GitHub branch protection |
| Deployment | CI/CD pipeline controlled | GitHub Actions |
| Admin access | Separate from regular users | RBAC roles |

### A.5.7 Threat Intelligence

| Source | Type | Integration |
|--------|------|-------------|
| npm audit | Dependency vulnerabilities | CI/CD pipeline |
| GitHub Dependabot | Security advisories | Automated PRs |
| CodeQL | Code vulnerabilities | GitHub Actions |
| ZAP DAST | Runtime vulnerabilities | Security workflow |

### A.5.8 Information Security in Project Management

| Phase | Security Activity | Evidence |
|-------|-------------------|----------|
| Planning | Security requirements | BRD document |
| Development | Secure coding | Code reviews |
| Testing | Security testing | E2E security tests |
| Deployment | Security checks | CI/CD gates |

### A.5.15 Access Control

| Control | Implementation | Location |
|---------|----------------|----------|
| Access policy | RBAC with 4 roles | `lib/rbac.ts` |
| User registration | Invite-only + approval | Auth flow |
| Access review | Quarterly reviews | Admin dashboard |
| Access revocation | Immediate on termination | Admin function |

**RBAC Implementation:**
```typescript
// lib/rbac.ts
export enum Role {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}
```

### A.5.16 Identity Management

| Aspect | Implementation | Provider |
|--------|----------------|----------|
| User identification | Unique email + UUID | NextAuth.js |
| Identity verification | Email confirmation | Auth flow |
| Session management | JWT tokens | NextAuth.js |
| MFA | TOTP supported | NextAuth.js |

### A.5.17 Authentication Information

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Complexity rules | 8+ chars, mixed case, numbers | Implemented |
| Password hashing | bcrypt, cost factor 12 | `lib/auth.ts` |
| Password reset | Secure token, 24hr expiry | Auth flow |
| Failed login lockout | 5 attempts, 15min lockout | Rate limiting |

### A.5.18 Access Rights

| Principle | Implementation | Evidence |
|-----------|----------------|----------|
| Least privilege | Minimum necessary access | RBAC design |
| Need to know | Data scoped by organization | Multi-tenancy |
| Default deny | No access until granted | Role assignment |
| Access review | Quarterly process | Admin procedures |

### A.5.22 Monitoring, Review and Change Management

| Activity | Frequency | Tool |
|----------|-----------|------|
| Access monitoring | Real-time | Audit logs |
| Security review | Weekly | Dashboard |
| Change tracking | Every commit | Git history |
| Incident review | Post-incident | Incident reports |

### A.5.23 Information Security for Cloud Services

| Control | Provider | Implementation |
|---------|----------|----------------|
| Data location | Vercel, Neon | Australia region preferred |
| Data encryption | All providers | TLS + at-rest |
| Access controls | All providers | API keys, RBAC |
| Incident notification | All providers | DPA terms |

### A.5.24 Information Security Incident Management

| Phase | Implementation | SLA |
|-------|----------------|-----|
| Detection | Monitoring, logging | Immediate |
| Response | Break-glass admin | 15 minutes |
| Notification | Alerting system | 1 hour |
| Resolution | Incident procedures | Per severity |

**Break-Glass Implementation:** `lib/break-glass-admin.ts`

### A.5.28 Collection of Evidence

| Evidence Type | Collection Method | Retention |
|---------------|-------------------|-----------|
| Access logs | `WaAuditLogger` | 7 years |
| Change logs | Git commits | Permanent |
| Error logs | Sentry | 30 days |
| Security events | Audit table | 7 years |

### A.5.30 ICT Readiness for Business Continuity

| Component | Redundancy | Recovery |
|-----------|------------|----------|
| Application | Vercel edge | Automatic failover |
| Database | Neon replicas | Point-in-time recovery |
| Code | GitHub mirrors | Repository restore |
| Documentation | Version controlled | Git history |

### A.5.31 Legal, Statutory, Regulatory and Contractual Requirements

| Requirement | Compliance | Documentation |
|-------------|------------|---------------|
| GDPR | Compliant | GDPR-Checklist.md |
| Australian Privacy Act | Compliant | Privacy Policy |
| WA Policies | Compliant | This mapping |
| Contracts | DPA signed | DPA-Template.md |

### A.5.33 Protection of Records

| Record Type | Protection | Retention |
|-------------|------------|-----------|
| User data | Encryption, RBAC | Account life + 7 years |
| Audit logs | Append-only, encrypted | 7 years |
| Case studies | User controlled | Until deletion |
| System logs | Encrypted | 30-90 days |

### A.5.36 Compliance with Policies, Rules and Standards

| Standard | Assessment | Frequency |
|----------|------------|-----------|
| ISO 27001 | This mapping | Annual |
| GDPR | Checklist review | Quarterly |
| WA Policy | Self-assessment | Annual |
| OWASP | Security testing | Continuous |

---

## A.6 People Controls

### A.6.1 Screening

| Check | Timing | Responsibility |
|-------|--------|----------------|
| Reference checks | Pre-employment | HR |
| Background verification | Pre-employment | HR |
| Qualification verification | Pre-employment | HR |

### A.6.3 Information Security Awareness, Education and Training

| Training | Audience | Frequency |
|----------|----------|-----------|
| Security awareness | All staff | Annual |
| Secure development | Developers | Annual |
| Incident response | IT staff | Semi-annual |
| Privacy training | All staff | Annual |

### A.6.4 Disciplinary Process

Defined in WA HR policies for security violations.

### A.6.5 Responsibilities After Termination or Change

| Action | Timing | Implementation |
|--------|--------|----------------|
| Access revocation | Immediate | Admin function |
| Asset return | Last day | Checklist |
| NDA reminder | Exit | Exit process |

### A.6.7 Remote Working

| Control | Implementation | Status |
|---------|----------------|--------|
| Device security | Endpoint protection | Required |
| Network security | VPN required | Policy |
| Data handling | No local storage | Policy |
| Session timeout | 30 minutes | Application |

### A.6.8 Information Security Event Reporting

| Channel | Contact | Response |
|---------|---------|----------|
| Security incidents | security@wa.com | 1 hour |
| Privacy concerns | privacy@wa.com | 24 hours |
| General issues | support@wa.com | 48 hours |

---

## A.7 Physical Controls

### A.7.1 Physical Security Perimeters

| Asset | Location | Protection |
|-------|----------|------------|
| Application servers | Vercel data centers | SOC 2 certified |
| Database | Neon data centers | ISO 27001 certified |
| Development | Cloud-based | No on-premise |

### A.7.4 Physical Security Monitoring

Managed by cloud providers (Vercel, Neon, GitHub).

### A.7.9 Security of Assets Off-Premises

| Asset | Protection | Policy |
|-------|------------|--------|
| Developer laptops | Encryption required | Device policy |
| Mobile devices | MDM enrolled | Device policy |
| Removable media | Prohibited | Data policy |

### A.7.10 Storage Media

| Media Type | Protection | Disposal |
|------------|------------|----------|
| Cloud storage | Encrypted | Provider managed |
| Backups | Encrypted | Provider managed |
| Local devices | No sensitive data | Secure wipe |

### A.7.14 Secure Disposal or Re-Use of Equipment

Managed by cloud providers with appropriate certifications.

---

## A.8 Technological Controls

### A.8.1 User Endpoint Devices

| Control | Requirement | Implementation |
|---------|-------------|----------------|
| Session management | Secure cookies | NextAuth.js |
| Token expiry | 24 hours | JWT config |
| Secure storage | HttpOnly cookies | Cookie settings |
| Device binding | Session validation | Auth checks |

### A.8.2 Privileged Access Rights

| Role | Privileges | Controls |
|------|------------|----------|
| Super Admin | All operations | MFA, audit log |
| Admin | User/org management | MFA, audit log |
| Break-glass | Emergency access | Time-limited, notification |

**Implementation:** `lib/break-glass-admin.ts`

### A.8.3 Information Access Restriction

| Data | Access Control | Implementation |
|------|----------------|----------------|
| User data | Own data only | User ID scoping |
| Org data | Organization members | Org ID scoping |
| Admin data | Admin roles only | RBAC middleware |

```typescript
// Middleware example
export const requireRole = (roles: Role[]) => {
  return async (req: Request) => {
    const session = await getSession(req);
    if (!roles.includes(session.user.role)) {
      throw new ForbiddenError();
    }
  };
};
```

### A.8.4 Access to Source Code

| Control | Implementation | Tool |
|---------|----------------|------|
| Repository access | Role-based | GitHub Teams |
| Branch protection | Required reviews | GitHub settings |
| Commit signing | Required | GPG keys |
| Audit trail | Full history | Git logs |

### A.8.5 Secure Authentication

| Mechanism | Implementation | Standard |
|-----------|----------------|----------|
| Password hashing | bcrypt (cost 12) | OWASP |
| Session tokens | JWT with rotation | RFC 7519 |
| MFA | TOTP | RFC 6238 |
| OAuth | Provider integration | OAuth 2.0 |

### A.8.6 Capacity Management

| Resource | Monitoring | Scaling |
|----------|------------|---------|
| Compute | Vercel analytics | Auto-scaling |
| Database | Neon metrics | Manual scaling |
| Storage | Usage dashboards | On-demand |
| API rate limits | Rate limiter | `lib/wa-rate-limiter.ts` |

### A.8.7 Protection Against Malware

| Protection | Implementation | Coverage |
|------------|----------------|----------|
| Input validation | Zod schemas | All endpoints |
| File validation | Type/size checks | Upload features |
| XSS prevention | React escaping + CSP | All output |
| SQL injection | Prisma ORM | All queries |

### A.8.8 Management of Technical Vulnerabilities

| Activity | Tool | Frequency |
|----------|------|-----------|
| Dependency scanning | npm audit, Dependabot | Continuous |
| SAST | CodeQL | Every PR |
| DAST | OWASP ZAP | Weekly |
| Penetration testing | Manual + automated | Annual |

### A.8.9 Configuration Management

| Configuration | Management | Protection |
|---------------|------------|------------|
| Environment variables | Vercel secrets | Encrypted |
| Database config | Neon console | Access controlled |
| Application config | Version controlled | Code review |
| Secrets | Environment variables | Never in code |

### A.8.10 Information Deletion

| Data Type | Deletion Method | Verification |
|-----------|-----------------|--------------|
| User accounts | Soft delete + hard delete | Audit log |
| Case studies | User-controlled | Confirmation |
| Sessions | Automatic expiry | Token validation |
| Audit logs | Retention policy | Scheduled jobs |

**Soft Delete Schema:**
```prisma
model User {
  isActive  Boolean   @default(true)
  deletedAt DateTime?
  deletedBy String?
}
```

### A.8.11 Data Masking

| Data Type | Masking | Implementation |
|-----------|---------|----------------|
| Emails in logs | Partial masking | `user@***.com` |
| IPs in analytics | Last octet | `192.168.1.xxx` |
| Passwords | Never logged | Excluded fields |

### A.8.12 Data Leakage Prevention

| Control | Implementation | Coverage |
|---------|----------------|----------|
| Output filtering | Response sanitization | All APIs |
| Error handling | No sensitive data in errors | Global handler |
| Export controls | Download logging | Export features |
| Copy prevention | UI controls (optional) | PDF exports |

### A.8.13 Information Backup

| Data | Backup | Retention | Recovery |
|------|--------|-----------|----------|
| Database | Continuous | 7 days | Point-in-time |
| User uploads | Replicated | User-controlled | Instant |
| Configuration | Version control | Permanent | Git restore |
| Logs | Archived | Per policy | Log retrieval |

### A.8.14 Redundancy of Information Processing Facilities

| Component | Redundancy | Provider |
|-----------|------------|----------|
| Application | Multi-region edge | Vercel |
| Database | Read replicas | Neon |
| CDN | Global distribution | Vercel |
| DNS | Multiple providers | Vercel + fallback |

### A.8.15 Logging

| Log Type | Content | Retention | Location |
|----------|---------|-----------|----------|
| Access logs | User actions | 7 years | `AuditLog` table |
| Security logs | Auth events | 7 years | `AuditLog` table |
| Error logs | Exceptions | 30 days | Sentry |
| Application logs | Operations | 90 days | Vercel |

**Audit Logger Implementation:** `lib/wa-audit-logger.ts`

```typescript
// Audit action types
export enum WaAuditActionType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  BREAK_GLASS_ACTIVATE = 'BREAK_GLASS_ACTIVATE',
  BREAK_GLASS_DEACTIVATE = 'BREAK_GLASS_DEACTIVATE',
  DATA_EXPORT = 'DATA_EXPORT',
  // ... more actions
}
```

### A.8.16 Monitoring Activities

| Activity | Tool | Alert Threshold |
|----------|------|-----------------|
| Error rate | Sentry | >5% error rate |
| Response time | Vercel | >3s P95 |
| Failed logins | Custom | 5 failures |
| Unusual access | Custom | Off-hours admin |

### A.8.20 Network Security

| Control | Implementation | Provider |
|---------|----------------|----------|
| TLS encryption | 1.3 enforced | Vercel |
| Certificate management | Automatic | Vercel |
| DDoS protection | Edge network | Vercel |
| WAF | Edge middleware | Vercel |

### A.8.21 Security of Network Services

| Service | Security | SLA |
|---------|----------|-----|
| Hosting | SOC 2, ISO 27001 | 99.99% |
| Database | SOC 2 | 99.95% |
| CDN | Global, encrypted | 99.99% |

### A.8.22 Segregation of Networks

| Environment | Isolation | Access |
|-------------|-----------|--------|
| Production | Separate deployment | Restricted |
| Staging | Separate deployment | Development team |
| Development | Local | Developers |
| Test | CI/CD environment | Automated |

### A.8.23 Web Filtering

| Filter | Implementation | Scope |
|--------|----------------|-------|
| CSP headers | Strict policy | All pages |
| CORS | Origin whitelist | API routes |
| Input validation | Zod schemas | All inputs |

### A.8.24 Use of Cryptography

| Use Case | Algorithm | Key Management |
|----------|-----------|----------------|
| Passwords | bcrypt | Per-password salt |
| Sessions | JWT (HS256) | Environment secret |
| Data at rest | AES-256 | Provider managed |
| Data in transit | TLS 1.3 | Certificate managed |

### A.8.25 Secure Development Life Cycle

| Phase | Security Activity | Tool/Process |
|-------|-------------------|--------------|
| Requirements | Security requirements | BRD review |
| Design | Threat modeling | Architecture review |
| Development | Secure coding | Linting, reviews |
| Testing | Security testing | SAST, DAST, E2E |
| Deployment | Security checks | CI/CD gates |
| Maintenance | Vulnerability management | Dependabot |

### A.8.26 Application Security Requirements

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Input validation | Zod schemas | Unit tests |
| Output encoding | React + CSP | E2E tests |
| Authentication | NextAuth.js | Auth tests |
| Session management | Secure cookies | Security tests |
| Error handling | Global handler | Error tests |

### A.8.27 Secure System Architecture and Engineering Principles

| Principle | Implementation |
|-----------|----------------|
| Defense in depth | Multiple security layers |
| Fail secure | Default deny |
| Least privilege | Minimal access rights |
| Separation of concerns | Modular architecture |
| Secure defaults | Security-first configuration |

### A.8.28 Secure Coding

| Practice | Enforcement | Tool |
|----------|-------------|------|
| Input validation | Required | Zod |
| Parameterized queries | Required | Prisma |
| Output encoding | Default | React |
| Error handling | Required | Global handler |
| Dependency security | Automated | npm audit |

### A.8.29 Security Testing in Development and Acceptance

| Test Type | Frequency | Coverage |
|-----------|-----------|----------|
| Unit tests | Every commit | Core functions |
| Integration tests | Every PR | API endpoints |
| E2E security tests | Every PR | OWASP top 10 |
| SAST | Every PR | All code |
| DAST | Weekly | Running application |

**Security Test Location:** `e2e/security.spec.ts`, `e2e/owasp-pentest.spec.ts`

### A.8.30 Outsourced Development

| Control | Requirement | Verification |
|---------|-------------|--------------|
| Security standards | Same as internal | Contract terms |
| Code review | Required | PR process |
| Security testing | Required | CI/CD |
| Access control | Limited scope | RBAC |

### A.8.31 Separation of Development, Test and Production Environments

| Environment | Purpose | Data |
|-------------|---------|------|
| Development | Feature development | Synthetic data |
| Test | Automated testing | Anonymized data |
| Staging | Pre-production validation | Subset of prod |
| Production | Live application | Real data |

**Data Anonymization:** `scripts/anonymize-data.ts`

### A.8.32 Change Management

| Change Type | Process | Approval |
|-------------|---------|----------|
| Code changes | PR + review | 1 reviewer |
| Configuration | Version controlled | PR process |
| Infrastructure | IaC + review | DevOps lead |
| Emergency | Break-glass | Post-approval |

### A.8.33 Test Information

| Requirement | Implementation |
|-------------|----------------|
| No production data in test | Anonymization scripts |
| Synthetic data generation | Faker library |
| Data refresh process | Automated script |

### A.8.34 Protection of Information Systems During Audit Testing

| Control | Implementation |
|---------|----------------|
| Test isolation | Separate environment |
| Access control | Auditor-specific accounts |
| Logging | Audit trail |
| Time limitation | Defined audit windows |

---

## Compliance Certification

**Certification Statement:**

I certify that the Case Study Builder application has been assessed against ISO 27001:2022 Annex A controls. All applicable controls have been implemented as documented in this mapping.

**Assessed By:** _________________________
**Role:** Information Security Officer
**Date:** _________________________
**Next Review:** _________________________

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | WA IT Security | Initial mapping |
