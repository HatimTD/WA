# Claude Code Security Review Checklist

## AI-Assisted Security Analysis Guide

This checklist provides a structured approach for performing security reviews using Claude Code or similar AI assistants. Use this when reviewing code for security vulnerabilities.

---

## Review Commands

Use these Claude Code commands for different security review scenarios:

### Quick Security Scan
```
Review the codebase for common security vulnerabilities including XSS, SQL injection, and authentication issues. Focus on: app/api/, lib/, and components/ directories.
```

### Deep Authentication Review
```
Analyze the authentication and authorization implementation in this codebase. Check for:
1. Session management vulnerabilities
2. Password handling (hashing, storage)
3. JWT/token security
4. OAuth implementation flaws
5. Role-based access control gaps
```

### API Security Review
```
Review all API routes in app/api/ for:
1. Input validation
2. Output encoding
3. Rate limiting
4. Authentication checks
5. Authorization enforcement
6. Error handling (no sensitive data leakage)
```

### Frontend Security Review
```
Analyze client-side code for:
1. XSS vulnerabilities (dangerouslySetInnerHTML, unescaped output)
2. Sensitive data in localStorage/sessionStorage
3. Insecure form handling
4. Client-side only validation
5. Exposed secrets or API keys
```

---

## Security Review Checklist

### A. Authentication & Authorization

#### A1. Authentication
- [ ] Passwords are hashed with bcrypt/argon2 (cost factor >= 12)
- [ ] No plaintext password storage or logging
- [ ] Secure session management (httpOnly, secure, sameSite cookies)
- [ ] Account lockout after failed attempts
- [ ] Secure password reset flow
- [ ] Multi-factor authentication available (if applicable)

#### A2. Authorization
- [ ] Role-based access control implemented
- [ ] All API routes check user permissions
- [ ] No direct object references without authorization
- [ ] Admin functions protected
- [ ] Privilege escalation prevented

#### A3. Session Management
- [ ] Sessions expire appropriately
- [ ] Session invalidation on logout
- [ ] Session fixation prevention
- [ ] CSRF tokens on state-changing operations

### B. Input Validation & Output Encoding

#### B1. Input Validation
- [ ] All inputs validated server-side
- [ ] Whitelist validation preferred over blacklist
- [ ] File upload validation (type, size, content)
- [ ] Path traversal prevention
- [ ] Integer overflow prevention

#### B2. Output Encoding
- [ ] HTML encoding for user content
- [ ] JavaScript encoding where needed
- [ ] URL encoding for parameters
- [ ] SQL parameterization (no string concatenation)
- [ ] NoSQL injection prevention

### C. Cross-Site Scripting (XSS)

#### C1. Stored XSS
- [ ] User content sanitized before storage
- [ ] Content encoded when rendered
- [ ] Rich text editors use sanitization (DOMPurify)
- [ ] File uploads don't execute scripts

#### C2. Reflected XSS
- [ ] URL parameters encoded
- [ ] Search results escaped
- [ ] Error messages don't reflect input

#### C3. DOM-based XSS
- [ ] No `dangerouslySetInnerHTML` with user input
- [ ] Safe DOM manipulation methods used
- [ ] Event handlers don't execute user input

### D. SQL/NoSQL Injection

- [ ] Parameterized queries used (Prisma ORM)
- [ ] No raw SQL with user input
- [ ] Input validation for queries
- [ ] Limited database permissions

### E. Security Headers

- [ ] Content-Security-Policy configured
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY/SAMEORIGIN
- [ ] Strict-Transport-Security (HSTS)
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Referrer-Policy configured
- [ ] Permissions-Policy configured

### F. Cryptography

- [ ] TLS 1.2+ enforced
- [ ] Strong cipher suites only
- [ ] Secure random number generation
- [ ] Proper key management
- [ ] No deprecated algorithms (MD5, SHA1 for security)

### G. Error Handling & Logging

- [ ] Generic error messages to users
- [ ] No stack traces in production
- [ ] Sensitive data not logged
- [ ] Log injection prevented
- [ ] Adequate security event logging

### H. File Handling

- [ ] File upload restrictions enforced
- [ ] File content validated (not just extension)
- [ ] Files stored outside web root
- [ ] No directory listing
- [ ] Path traversal prevented

### I. API Security

- [ ] Rate limiting implemented
- [ ] API keys/tokens secured
- [ ] CORS properly configured
- [ ] Request size limits enforced
- [ ] Deprecation headers for old versions

### J. Third-Party Dependencies

- [ ] npm audit clean (or vulnerabilities documented)
- [ ] Dependencies regularly updated
- [ ] License compliance verified
- [ ] Minimal dependency surface

---

## Code Review Patterns

### Red Flags to Look For

```javascript
// DANGEROUS: SQL Injection
const query = `SELECT * FROM users WHERE id = ${userId}`;

// DANGEROUS: XSS
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// DANGEROUS: Path Traversal
const filePath = path.join(baseDir, req.query.filename);

// DANGEROUS: Command Injection
exec(`ping ${hostname}`);

// DANGEROUS: Hardcoded Secrets
const apiKey = "sk-1234567890abcdef";

// DANGEROUS: Insecure Cookie
res.cookie('session', token); // Missing httpOnly, secure

// DANGEROUS: Missing Auth Check
app.get('/admin/users', (req, res) => {
  return db.users.findAll();
});
```

### Safe Patterns

```javascript
// SAFE: Parameterized Query (Prisma)
const user = await prisma.user.findUnique({ where: { id: userId } });

// SAFE: React Auto-Escaping
<div>{userContent}</div>

// SAFE: Path Validation
const safePath = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');

// SAFE: Environment Variables
const apiKey = process.env.API_KEY;

// SAFE: Secure Cookie
res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
});

// SAFE: Auth Middleware
app.get('/admin/users', requireAdmin, (req, res) => {
  return db.users.findAll();
});
```

---

## Case Study Builder Specific Checks

### Database (Prisma)
- [ ] All queries use Prisma ORM (not raw SQL)
- [ ] User IDs validated before queries
- [ ] Soft delete implemented correctly
- [ ] Cascade deletes appropriate

### File Uploads (Case Study Images)
- [ ] Image type validation
- [ ] File size limits enforced
- [ ] Malicious content detection
- [ ] Secure storage (Azure Blob)

### API Routes
- [ ] All routes behind authentication
- [ ] Organization isolation enforced
- [ ] Rate limiting on sensitive endpoints
- [ ] Input validation with Zod schemas

### Authentication (NextAuth)
- [ ] Google OAuth configured securely
- [ ] Credentials provider hashes passwords
- [ ] Session callback validates user
- [ ] JWT expiration appropriate

---

## Reporting Template

When reporting security findings, use this format:

```markdown
## Security Finding: [Title]

**Severity:** Critical | High | Medium | Low | Info
**CVSS Score:** X.X
**CWE:** CWE-XXX

### Description
[Brief description of the vulnerability]

### Location
- File: `path/to/file.ts`
- Line: XX
- Function: `functionName`

### Impact
[What can an attacker do with this vulnerability]

### Proof of Concept
[Steps to reproduce or code example]

### Remediation
[How to fix the vulnerability]

### References
- [OWASP Reference](https://owasp.org/...)
- [CWE Reference](https://cwe.mitre.org/...)
```

---

## Automated Security Scans

### Run These Regularly

```bash
# Dependency vulnerabilities
npm audit

# Static analysis
npm run lint

# Type checking (catches many issues)
npx tsc --noEmit

# E2E Security tests
npx playwright test e2e/security.spec.ts

# OWASP ZAP scan
./security/run-zap-scan.sh baseline
```

---

## Review Frequency

| Review Type | Frequency | Trigger |
|-------------|-----------|---------|
| Automated scans | Daily/CI | Every commit |
| Dependency audit | Weekly | npm audit schedule |
| Code review | Per PR | Pull request |
| Full security review | Quarterly | Scheduled |
| Penetration test | Annually | Compliance |

---

*Last Updated: December 2024*
*Version: 1.0*
