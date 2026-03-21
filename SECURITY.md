# Security Policy

## Overview

This document outlines the security measures implemented in the GDG@PSU website to protect user data and prevent common web vulnerabilities.

## Security Measures Implemented

### 1. Authentication & Authorization

#### Secure Backend Authentication
- ✅ Password hashing happens server-side using PostgreSQL's `pgcrypto`
- ✅ Password hashes NEVER exposed to frontend
- ✅ Authentication via secure RPC function `authenticate_admin()`
- ✅ Rate limiting: Max 5 failed attempts per 15 minutes
- ✅ Account lockout after repeated failed attempts
- ✅ Generic error messages to prevent user enumeration

#### Strong Password Policy
- ✅ Minimum 14 characters (increased from 8)
- ✅ Requires uppercase, lowercase, numbers, and special characters
- ✅ Blocks common/weak passwords
- ✅ Password strength validation on backend

#### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Proper access control policies (no more `USING (true)`)
- ✅ Admin-only access to sensitive tables
- ✅ Public read access only where appropriate
- ✅ Helper functions `is_admin()` and `is_super_admin()`

### 2. XSS Prevention

#### HTML Sanitization
- ✅ DOMPurify library integrated
- ✅ All user-generated HTML sanitized before rendering
- ✅ Newsletter content sanitized
- ✅ Blog comments sanitized
- ✅ Markdown content sanitized

#### Content Security Policy (CSP)
- ✅ Strict CSP header configured
- ✅ Blocks inline scripts (except whitelisted)
- ✅ Restricts resource loading to trusted domains
- ✅ Prevents clickjacking with `frame-ancestors 'none'`

### 3. Security Headers

All pages include these security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: [see vercel.json for full policy]
```

### 4. Data Protection

#### Sensitive Data Handling
- ✅ Admin secret code validated server-side only
- ✅ API keys never exposed in frontend code
- ✅ Email sending via backend Edge Functions
- ✅ Password hashes never sent to client

#### Session Management
- ✅ Supabase Auth for secure session handling
- ✅ HttpOnly cookies (when using Supabase Auth)
- ✅ Session expiry after 24 hours
- ✅ Secure session storage

### 5. Audit & Monitoring

#### Security Events Logging
- ✅ All login attempts logged
- ✅ Failed authentication tracked
- ✅ Account lockouts recorded
- ✅ Admin actions audited

#### Admin Actions Audit Trail
- ✅ Complete audit log of admin activities
- ✅ Immutable logs (no updates/deletes)
- ✅ Timestamp and user tracking
- ✅ Detailed action information

### 6. Input Validation

- ✅ Email format validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting on newsletter signups
- ✅ CSRF protection via Supabase

## Security Best Practices

### For Developers

1. **Never expose sensitive data to frontend**
   - Use RPC functions for sensitive operations
   - Keep API keys in environment variables
   - Never log sensitive information

2. **Always sanitize user input**
   ```typescript
   import { sanitizeHtml } from '@/lib/sanitize';
   const safe = sanitizeHtml(userInput);
   ```

3. **Use proper RLS policies**
   ```sql
   -- BAD
   CREATE POLICY "allow_all" ON table FOR ALL USING (true);
   
   -- GOOD
   CREATE POLICY "admin_only" ON table FOR ALL USING (is_admin());
   ```

4. **Validate on backend**
   - Never trust client-side validation alone
   - Implement server-side validation in RPC functions
   - Use database constraints

### For Admins

1. **Use strong passwords**
   - Minimum 14 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Avoid common words or patterns
   - Use a password manager

2. **Enable 2FA** (when available)
   - Additional security layer
   - Protects against password theft

3. **Review audit logs regularly**
   - Check for suspicious activity
   - Monitor failed login attempts
   - Review admin actions

4. **Keep secret codes secure**
   - Change admin secret code monthly
   - Never share via insecure channels
   - Use unique codes per environment

## Vulnerability Reporting

If you discover a security vulnerability, please report it to:

**Email:** security@gdgpsu.dev

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Do NOT:**
- Publicly disclose the vulnerability
- Exploit the vulnerability
- Access data you don't own

We will respond within 48 hours and work with you to resolve the issue.

## Security Checklist for Deployment

Before deploying to production:

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] RLS policies enabled on all tables
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Admin accounts secured with strong passwords
- [ ] Admin secret code changed from default
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Monitoring and alerting set up

## Compliance

### GDPR Compliance
- ✅ User data minimization
- ✅ Right to be forgotten (unsubscribe)
- ✅ Data encryption in transit (HTTPS)
- ✅ Data encryption at rest (Supabase)
- ✅ Audit trail for data access
- ✅ Privacy policy available

### Security Standards
- ✅ OWASP Top 10 mitigations
- ✅ CWE/SANS Top 25 protections
- ✅ Secure coding practices
- ✅ Regular security updates

## Security Updates

This document is updated regularly. Last updated: March 16, 2025

For the latest security information, check:
- GitHub Security Advisories
- Supabase Security Updates
- npm audit reports

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
