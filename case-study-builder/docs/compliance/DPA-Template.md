# Data Processing Agreement (DPA) Template

**WA Software Development Policy Reference:** Section 6.3 (Third-Party Integrations)

**Document Version:** 1.0
**Last Updated:** December 2024
**Classification:** Internal Use

---

## 1. Purpose

This Data Processing Agreement template establishes the terms under which Western Australia (WA) engages third-party processors for handling personal data within the Case Study Builder application. This template aligns with WA Software Development Policy V2.3 Section 6.3 requirements.

---

## 2. Parties

**Data Controller:** Western Australia (WA)
**Data Processor:** [Third-Party Service Provider Name]

---

## 3. Definitions

| Term | Definition |
|------|------------|
| **Personal Data** | Any information relating to an identified or identifiable natural person |
| **Processing** | Any operation performed on personal data (collection, storage, retrieval, etc.) |
| **Data Subject** | An identified or identifiable natural person whose data is processed |
| **Sub-processor** | Any third party engaged by the Processor to process Personal Data |

---

## 4. Subject Matter and Duration

### 4.1 Subject Matter
This DPA governs the processing of personal data by the Processor on behalf of the Controller in connection with the Case Study Builder application services.

### 4.2 Duration
This Agreement shall remain in effect for the duration of the service agreement between the parties, plus the period required for data deletion/return.

### 4.3 Nature and Purpose
The processing is necessary for:
- User authentication and authorization
- Case study content management
- Analytics and reporting
- Customer support operations

---

## 5. Types of Personal Data Processed

| Data Category | Examples | Retention Period |
|---------------|----------|------------------|
| Identity Data | Name, email, employee ID | Duration of account + 7 years |
| Authentication Data | Hashed passwords, session tokens | Active session only |
| Usage Data | Login timestamps, feature usage | 2 years |
| Content Data | Case study drafts, uploaded images | Until deletion + 30 days |
| Audit Data | Actions performed, IP addresses | 7 years minimum |

---

## 6. Data Subject Categories

- WA Employees (internal users)
- WA Contractors
- External collaborators (with appropriate agreements)

---

## 7. Processor Obligations

### 7.1 Security Measures (WA Policy 7.5)
The Processor shall implement appropriate technical and organizational measures including:

- [ ] Encryption at rest (AES-256 minimum)
- [ ] Encryption in transit (TLS 1.2 minimum)
- [ ] Access controls and authentication
- [ ] Regular security assessments
- [ ] Incident response procedures
- [ ] Business continuity planning

### 7.2 Confidentiality
The Processor shall ensure that persons authorized to process Personal Data:
- Are bound by confidentiality obligations
- Have received appropriate training
- Process data only on documented instructions

### 7.3 Sub-processing (WA Policy 6.3.2)
The Processor shall:
- Not engage Sub-processors without prior written authorization
- Ensure Sub-processors meet equivalent security standards
- Maintain a list of approved Sub-processors
- Notify Controller of any Sub-processor changes

**Approved Sub-processors for Case Study Builder:**

| Sub-processor | Service | Data Processed | Location |
|---------------|---------|----------------|----------|
| Vercel Inc. | Hosting | Application data | Australia (preferred) |
| Neon Tech | Database | All persistent data | Australia region |
| OpenAI | AI Processing | Content analysis | USA (with DPA) |
| Sentry | Error monitoring | Error logs, anonymized | USA (with DPA) |

### 7.4 Data Subject Rights
The Processor shall assist the Controller in responding to Data Subject requests:
- Right of access (within 30 days)
- Right to rectification
- Right to erasure
- Right to data portability
- Right to restrict processing
- Right to object

### 7.5 Data Breach Notification (WA Policy 3.2)
The Processor shall notify the Controller within **24 hours** of becoming aware of a Personal Data breach, including:
- Nature of the breach
- Categories of data affected
- Approximate number of data subjects
- Likely consequences
- Measures taken/proposed

---

## 8. Controller Obligations

The Controller shall:
- Provide documented processing instructions
- Ensure lawful basis for processing
- Notify Processor of any data subject requests
- Conduct due diligence on Processor's security measures

---

## 9. Audit Rights (WA Policy 7.5.3)

### 9.1 Audit Scope
The Controller may conduct audits to verify:
- Compliance with this DPA
- Security measures effectiveness
- Sub-processor compliance

### 9.2 Audit Frequency
- Annual security assessment
- Ad-hoc audits following incidents
- Third-party penetration testing annually

### 9.3 Audit Evidence
The Processor shall provide:
- SOC 2 Type II reports (if available)
- Penetration test results
- Vulnerability assessment reports
- Incident response documentation

---

## 10. Data Transfer (International)

### 10.1 Transfer Mechanisms
For transfers outside Australia, the following safeguards apply:
- Standard Contractual Clauses (SCCs)
- Binding Corporate Rules (where applicable)
- Adequacy decisions (recognized jurisdictions)

### 10.2 Transfer Impact Assessment
Before international transfers, assess:
- [ ] Destination country's data protection laws
- [ ] Supplementary measures required
- [ ] Data minimization opportunities
- [ ] Encryption effectiveness

---

## 11. Data Return and Deletion

### 11.1 Upon Termination
At the end of the service agreement, the Processor shall:
- Return all Personal Data in a standard format (JSON/CSV)
- Securely delete all Personal Data within 30 days
- Provide written certification of deletion
- Ensure Sub-processors also delete data

### 11.2 Deletion Standards
Data deletion shall comply with:
- NIST SP 800-88 Guidelines for Media Sanitization
- Secure overwrite for non-SSD storage
- Cryptographic erasure for encrypted data

---

## 12. Liability and Indemnification

### 12.1 Processor Liability
The Processor shall be liable for damages caused by processing that:
- Does not comply with this DPA
- Is outside of lawful instructions
- Violates applicable data protection laws

### 12.2 Indemnification
Each party shall indemnify the other for losses arising from:
- Breach of this DPA
- Breach of data protection laws
- Third-party claims related to data processing

---

## 13. Signatures

**For the Data Controller (WA):**

Name: ________________________________
Title: ________________________________
Date: ________________________________
Signature: ____________________________

**For the Data Processor:**

Name: ________________________________
Title: ________________________________
Date: ________________________________
Signature: ____________________________

---

## Appendix A: Technical and Organizational Measures

### A.1 Access Control
- Multi-factor authentication required
- Role-based access control (RBAC)
- Principle of least privilege
- Regular access reviews (quarterly)

### A.2 Encryption
- At rest: AES-256
- In transit: TLS 1.3
- Key management: HSM or equivalent

### A.3 Monitoring
- Real-time security monitoring
- Audit logging with 7-year retention
- Anomaly detection

### A.4 Physical Security
- Data center certifications (ISO 27001, SOC 2)
- Access controls to facilities
- Environmental controls

---

## Appendix B: Sub-processor Agreement Template

[Template for agreements with sub-processors, mirroring main DPA terms]

---

## Appendix C: Data Subject Request Form

**Request Type:** [ ] Access [ ] Rectification [ ] Erasure [ ] Portability [ ] Restriction [ ] Objection

**Data Subject Information:**
- Name: _______________________
- Email: _______________________
- User ID: _____________________

**Request Details:**
_____________________________________________

**Verification Method:** [ ] Email confirmation [ ] Identity document [ ] Other: _______

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | WA IT Security | Initial template |
