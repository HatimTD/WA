# Data Processing Agreement (DPA)

**Effective Date:** [Date]
**Version:** 1.0

---

## 1. Parties

### Data Controller
**Welding Alloys Group**
- **Legal Entity:** Welding Alloys Group
- **Address:** [Company Address]
- **Contact:** [Legal/Compliance Contact]
- **Role:** Determines the purposes and means of processing personal data

### Data Processor
**[Processor Name]**
- **Legal Entity:** [Processor Legal Name]
- **Address:** [Processor Address]
- **Contact:** [Processor Contact]
- **Role:** Processes personal data on behalf of the Data Controller

---

## 2. Data Processing Details

### 2.1 Data Subjects
The personal data processed under this agreement relates to the following categories of data subjects:
- **Employees** of Welding Alloys Group
- **Authorized Users** of the WA Creative Services platform

### 2.2 Categories of Personal Data
The following categories of personal data are processed:
- **Name** (First name, Last name)
- **Email address** (Corporate email)
- **Work activities** (Contributions, posts, edits, timestamps)
- **User-generated content** (Text posts, media uploads, comments)
- **Authentication data** (Login credentials, session tokens)

### 2.3 Purpose of Processing
Personal data is processed for the following purposes:
- **Internal knowledge management** and collaboration
- **Content creation** and sharing within the organization
- **User authentication** and access control
- **Service provision** and platform functionality
- **Analytics** for service improvement (anonymized where possible)

### 2.4 Duration of Processing
Processing will continue for the duration of:
- The service agreement between the parties
- Plus any retention period required by law or legitimate business needs
- As specified in the Data Retention policy (Section 6)

---

## 3. Legal Basis for Processing

### Primary Legal Basis
**Legitimate Interest** - Article 6(1)(f) GDPR

The processing is necessary for the purposes of legitimate interests pursued by Welding Alloys Group, specifically:
- Efficient internal communication and knowledge sharing
- Employee collaboration and productivity enhancement
- Protection of company intellectual property
- Operational efficiency and business continuity

### Legitimate Interest Assessment (LIA)
- **Purpose:** Facilitate internal knowledge management and collaboration
- **Necessity:** Essential for modern workplace productivity
- **Balancing Test:** Employee data is minimal, used only for business purposes, with appropriate safeguards in place
- **Employee Rights:** Data subjects retain all rights under GDPR Articles 15-22

### Additional Legal Bases (where applicable)
- **Consent** - Article 6(1)(a) GDPR (for optional features)
- **Contract** - Article 6(1)(b) GDPR (for employment relationship)
- **Legal Obligation** - Article 6(1)(c) GDPR (for compliance requirements)

---

## 4. Security Measures

The Data Processor shall implement and maintain appropriate technical and organizational measures to ensure a level of security appropriate to the risk:

### 4.1 Technical Measures

#### Encryption
- **Data in Transit:** TLS 1.3 encryption for all data transmission
- **Data at Rest:** AES-256 encryption for stored data
- **Database Encryption:** Encryption at rest for PostgreSQL databases
- **File Storage:** Encrypted storage for media files (Cloudinary)

#### Access Control
- **Role-Based Access Control (RBAC):** Granular permissions based on user roles
- **Multi-Factor Authentication (MFA):** Required for all administrative accounts
- **Session Management:** Secure session tokens with automatic timeout
- **Password Policy:** Strong password requirements enforced

#### Monitoring & Logging
- **Audit Logging:** Comprehensive logging of all data access and modifications
- **Security Monitoring:** Real-time monitoring for suspicious activities
- **Log Retention:** Audit logs retained for minimum 12 months
- **Anomaly Detection:** Automated alerts for unusual access patterns

#### Network Security
- **Firewall Protection:** Network-level access controls
- **DDoS Protection:** Distributed denial-of-service mitigation
- **Intrusion Detection:** Automated threat detection systems
- **Secure APIs:** Authentication and rate limiting on all API endpoints

### 4.2 Organizational Measures

#### Policies & Procedures
- **Data Protection Policy:** Documented procedures for data handling
- **Incident Response Plan:** Procedures for security breach response
- **Access Management:** Regular review and revocation of access rights
- **Staff Training:** Ongoing security awareness training

#### Compliance
- **Regular Audits:** Periodic security and compliance assessments
- **Vulnerability Management:** Regular security updates and patches
- **Third-Party Assessment:** Annual security audits by independent auditors
- **Documentation:** Maintenance of processing records (Article 30 GDPR)

---

## 5. Sub-Processors

The Data Processor may engage the following sub-processors:

| Sub-Processor | Service | Location | Data Processed | DPA Status |
|--------------|---------|----------|----------------|------------|
| **Vercel** | Hosting & Infrastructure | United States | All application data | GDPR-compliant DPA in place |
| **PostgreSQL** (Vercel Postgres) | Database | United States | Structured user data | Covered under Vercel DPA |
| **Cloudinary** | Media Storage & Processing | United States/EU | Uploaded media files | GDPR-compliant DPA in place |
| **OpenAI** | AI Text Processing | United States | User-generated text (no PII) | DPA in place, API terms accepted |
| **Resend** | Email Delivery | United States | Email addresses, notifications | GDPR-compliant DPA in place |
| **NetSuite** | ERP Integration | United States | Employee data sync | Enterprise DPA in place |

### 5.1 Sub-Processor Requirements
All sub-processors must:
- Provide equivalent data protection guarantees
- Execute a written contract with equivalent obligations to this DPA
- Implement appropriate technical and organizational measures
- Comply with GDPR Chapter V (International Transfers) where applicable
- Undergo regular security assessments

### 5.2 Sub-Processor Changes
The Data Processor shall:
- Notify the Data Controller of any intended changes to sub-processors
- Provide 30 days notice before adding or replacing sub-processors
- Allow the Data Controller to object to such changes
- Maintain an up-to-date list of sub-processors

---

## 6. Data Retention Policy

### 6.1 Retention Periods

| Data Category | Retention Period | Legal Basis |
|---------------|------------------|-------------|
| **Active User Accounts** | Duration of employment + 30 days | Legitimate Interest |
| **User-Generated Content** | Duration of employment + 90 days | Legitimate Interest |
| **Audit Logs** | 12 months | Legal Obligation |
| **Backup Data** | 30 days (rolling) | Legitimate Interest |
| **Deleted Content** | 30 days (soft delete) | Recovery capability |

### 6.2 Deletion Procedures
Upon termination or expiry:
- User accounts are deactivated immediately upon employment termination
- Personal data is deleted within retention periods specified above
- Backups containing personal data are overwritten within 30 days
- Secure deletion methods are employed (data overwriting, cryptographic erasure)

### 6.3 Right to Erasure
Data subjects may request deletion of their personal data:
- Requests are processed within 30 days
- Verification of identity required
- Exceptions apply where retention is legally required
- Confirmation of deletion provided to data subject

---

## 7. Data Breach Notification

### 7.1 Breach Notification to Controller
In the event of a personal data breach, the Data Processor shall:

1. **Immediate Notification (within 24 hours):**
   - Initial notification to Data Controller
   - Preliminary breach details
   - Contact information for further inquiries

2. **Detailed Notification (within 72 hours):**
   - Nature of the breach (type, scope, affected data)
   - Categories and approximate number of data subjects affected
   - Likely consequences of the breach
   - Measures taken or proposed to address the breach
   - Recommendations for mitigating potential adverse effects

### 7.2 Breach Response
The Data Processor shall:
- Contain and investigate the breach immediately
- Preserve evidence for investigation and regulatory purposes
- Cooperate fully with the Data Controller's breach response
- Implement measures to prevent recurrence
- Document all breach-related activities

### 7.3 Controller Notification to Supervisory Authority
The Data Controller (Welding Alloys Group) shall notify the relevant supervisory authority within 72 hours of becoming aware of a breach, unless the breach is unlikely to result in a risk to the rights and freedoms of data subjects.

### 7.4 Notification to Data Subjects
Where the breach is likely to result in a high risk to data subjects' rights and freedoms, affected individuals shall be notified without undue delay.

---

## 8. Data Subject Rights

The Data Processor shall assist the Data Controller in fulfilling data subject rights requests under GDPR Articles 15-22:

### 8.1 Right of Access (Article 15)
- Provide access to personal data upon request
- Deliver data in a commonly used electronic format
- Respond within 30 days of verified request

### 8.2 Right to Rectification (Article 16)
- Correct inaccurate personal data
- Complete incomplete personal data
- Update data without undue delay

### 8.3 Right to Erasure (Article 17)
- Delete personal data when requested
- Exceptions apply for legal or legitimate purposes
- Confirm deletion to data subject

### 8.4 Right to Restriction (Article 18)
- Limit processing when requested
- Maintain data but cease active processing
- Notify data subject before lifting restriction

### 8.5 Right to Data Portability (Article 20)
- Provide data in machine-readable format (JSON/CSV)
- Enable direct transfer to another controller where feasible
- Apply to data processed by automated means

### 8.6 Right to Object (Article 21)
- Cease processing when objection is raised
- Particularly applicable to legitimate interest basis
- Exceptions for compelling legitimate grounds

### 8.7 Rights Related to Automated Decision-Making (Article 22)
- No solely automated decisions with legal/significant effects
- Human oversight required for all AI-assisted processing
- Right to obtain human intervention and explanation

---

## 9. International Data Transfers

### 9.1 Transfer Mechanisms
Where personal data is transferred outside the European Economic Area (EEA):
- **Standard Contractual Clauses (SCCs):** EU-approved transfer mechanisms
- **Adequacy Decisions:** Transfers to countries with adequate protection
- **Binding Corporate Rules:** Where applicable for intra-group transfers
- **Supplementary Measures:** Additional safeguards per Schrems II

### 9.2 US-Based Processors
For sub-processors located in the United States:
- Standard Contractual Clauses are in place
- Additional security measures implemented (encryption, access controls)
- Regular assessment of legal landscape and transfer risks
- Alternative transfer mechanisms evaluated as needed

---

## 10. Audit Rights

### 10.1 Data Controller Rights
The Data Controller has the right to:
- Audit the Data Processor's compliance with this DPA
- Request documentation and evidence of compliance
- Conduct on-site inspections (with reasonable notice)
- Engage third-party auditors (subject to confidentiality)

### 10.2 Processor Cooperation
The Data Processor shall:
- Provide all information necessary to demonstrate compliance
- Allow and contribute to audits and inspections
- Respond to audit requests within 14 days
- Implement corrective actions from audit findings

---

## 11. Liability and Indemnification

### 11.1 Processor Liability
The Data Processor shall be liable for damages caused by processing where:
- It has not complied with GDPR obligations
- It has acted outside lawful instructions from the Data Controller
- Liability is determined in accordance with GDPR Article 82

### 11.2 Indemnification
The Data Processor shall indemnify the Data Controller against:
- Regulatory fines resulting from Processor non-compliance
- Claims from data subjects due to Processor actions
- Costs incurred in breach notification due to Processor fault

---

## 12. Term and Termination

### 12.1 Term
This DPA shall remain in effect for the duration of the service agreement between the parties.

### 12.2 Termination
Upon termination of the service agreement:
- All personal data shall be deleted or returned within 30 days
- The Data Processor shall certify deletion in writing
- Backup data shall be securely deleted within backup retention period
- Exceptions apply where retention is required by law

### 12.3 Survival
The following provisions shall survive termination:
- Confidentiality obligations
- Liability and indemnification
- Audit rights (for 12 months post-termination)

---

## 13. Governing Law and Jurisdiction

This DPA shall be governed by:
- The laws of the European Union and the GDPR
- The laws of [specify jurisdiction]
- Competent supervisory authority: [specify data protection authority]

---

## 14. Signatures

### Data Controller (Welding Alloys Group)

**Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Name:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Title:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

### Data Processor

**Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Name:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Title:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Date:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** [Date]
- **Next Review:** [Date + 12 months]
- **Owner:** Legal/Compliance Team
- **Approved By:** [DPO/Legal Officer]
