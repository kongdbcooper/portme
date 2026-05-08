# 🔒 Security Best Practices & Guidelines

This document outlines the security measures implemented in **portme** and guidelines for maintaining a secure application.

---

## 📋 Security Checklist

### ✅ Critical Security Features (Already Implemented)

- [x] **SQL Injection Prevention**: Using Prisma ORM (parameterized queries) — NO raw SQL
- [x] **XSS Protection**: React auto-escapes content; no `dangerouslySetInnerHTML`
- [x] **CSRF Protection**: Origin/Referer validation + SameSite=Strict cookies
- [x] **Secure Session**: JWT signed with SESSION_SECRET, HttpOnly cookies
- [x] **File Upload Security**: Cloudflare R2 presigned URLs, filename sanitization, size/type validation
- [x] **Rate Limiting**: Progressive lockout on failed login attempts
- [x] **HTTPS**: Secure cookies only in production
- [x] **CSP Headers**: Content Security Policy without unsafe-inline/eval

---

## 🔑 Critical Configuration

### 1. **Set SESSION_SECRET** (REQUIRED)

The SESSION_SECRET must be a cryptographically secure random string ≥32 characters.

#### Generate a secure key:
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

#### Set in .env.local:
```env
SESSION_SECRET=your-64-character-hex-string-here
```

**⚠️ If SESSION_SECRET is not set, the app will FAIL to start in production.**

### 2. **Database Credentials**
```env
DATABASE_URL=postgresql://username:strong_password@host:5432/portme_db
```
- Use strong, unique passwords
- Restrict database access to your application server
- Enable database-level encryption at rest

### 3. **Cloudflare R2 API Keys**
```env
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://cdn.example.com
```
- Store secrets in your platform's secret manager (Vercel, Heroku, etc.)
- Rotate R2 credentials regularly
- Limit R2 API token permissions (read/write specific bucket only)

---

## 🛡️ Authentication & Session Security

### Session Handling
- **Cookie Flags**: `HttpOnly` (prevents JS access), `Secure` (HTTPS only), `SameSite=Strict` (CSRF protection)
- **Token Expiry**: 7 days (configured in `src/lib/session.jsx`)
- **JWT Signing**: Using HS256 algorithm with SESSION_SECRET

### Password Policy
- Minimum 8 characters
- Must include: uppercase, lowercase, digit
- Enforced by `ChangePasswordSchema` in `src/app/api/auth/change-password/route.jsx`

### Rate Limiting
- **Login**: 5 attempts per minute
- **Password Change**: 5 attempts per minute
- **Progressive lockout**: 30s → 60s → 2min → 5min → 10min → 15min
- Implemented in `src/lib/rate-limit.jsx`

---

## 📤 File Upload Security

### R2 Presigned URL Flow
1. **Client** requests presigned upload URL via `/api/upload/presign`
2. **Server** validates: file type, size, filename, folder
3. **Client** uploads directly to R2 using presigned URL (expires in 15 minutes)
4. **Server** never touches file content

### Validation
- **Image files**: JPEG, PNG, WebP, GIF — max 5MB
- **Video files**: Video/* — max 500MB
- **Filename sanitization**: Removes special characters; adds timestamp + random suffix
- **Allowed folders**: `products`, `settings`, `videos` only

---

## 🔐 API Security

### Authentication
All admin endpoints require `requireAdmin()` check:
- `/api/products/[id]` — PATCH/DELETE (admin only)
- `/api/admin/settings` — POST (admin only)
- `/api/upload/presign` — POST (admin only)
- `/api/videos/[id]` — PATCH/DELETE (admin only)

### CSRF Protection
- **POST/PUT/PATCH/DELETE** requests validated against Origin + Referer headers
- Must match request `host` header
- Fallback: Referer checked if Origin missing
- Request rejected if neither valid

### Input Validation
All endpoints use Zod schemas for strict input validation:
- `CreateProductSchema`, `UpdateProductSchema`
- `LoginSchema`, `ChangePasswordSchema`
- File upload validation: type, size, filename

---

## 🌐 Content Security Policy (CSP)

Configured in `next.config.mjs`:
```
default-src 'self'  — Only allow same-origin by default
script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com
style-src 'self' https://fonts.googleapis.com  — No inline styles
img-src 'self' data: blob: https://*.r2.dev
```

**NO `unsafe-inline` or `unsafe-eval`** — Prevents inline script injection.

---

## 📊 Data Protection

### PII & Sensitive Data
- **Passwords**: Hashed with bcryptjs (cost: 12) in database
- **Sessions**: JWT signed with SECRET_KEY; never stored in database
- **Email**: Not exposed in API responses unless authenticated

### R2 Files
- Public URLs: Only presigned URLs with expiry; no direct bucket access
- Cleanup: Old files deleted when settings/products updated
- CORS: Configured to allow uploads from your domain only

---

## 🔄 Dependency Security

### Regular Audits
```bash
# Check for known vulnerabilities
npm audit

# Update packages safely
npm update

# (Optional) Install security scanner
npm install -g snyk  # https://snyk.io
snyk test
```

### Recommended Tools
- **GitHub Dependabot**: Enable automated dependency updates + security alerts
- **OWASP ZAP** or **Burp Community**: Penetration testing
- **npm audit**: Built-in vulnerability scanner

---

## 🚀 Deployment Security

### Pre-Production
1. **Enable HTTPS** on your domain
2. **Set all environment variables** (especially SESSION_SECRET)
3. **Run `npm audit`** and fix vulnerabilities
4. **Test login/admin flows** in staging
5. **Verify CSP headers** (use browser DevTools)

### Production
1. **Use secrets manager**: Vercel, Heroku, AWS Secrets Manager, etc.
2. **Enable HTTPS-only** (disable HTTP)
3. **Set secure cookies**: All cookies `Secure` + `HttpOnly`
4. **Monitor logs** for failed login attempts, CSRF rejections
5. **Backup database** regularly
6. **Rotate SESSION_SECRET** every 6 months

### Environment Setup
```env
# .env.local (Development)
NODE_ENV=development
SESSION_SECRET=your-dev-secret

# Vercel / Production (via Secrets)
NODE_ENV=production
SESSION_SECRET=your-prod-secret (64+ char, cryptographically random)
```

---

## 🚨 Security Incident Response

### If Compromised
1. **Invalidate all sessions** → Rotate SESSION_SECRET + redeploy
2. **Reset user passwords** → Force re-authentication
3. **Audit logs** → Check for unauthorized access (failed logins, admin changes)
4. **Rotate API credentials** → R2 access keys, database password
5. **Review file uploads** → Check R2 bucket for malicious files

### Reporting Security Issues
If you discover a security vulnerability, please email `security@example.com` (confidential).

---

## 📚 Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js Security Checklist**: https://nodejs.org/en/docs/guides/security/
- **Next.js Security**: https://nextjs.org/docs/deployment/secure-your-app
- **Prisma ORM Security**: https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## ✅ Security Audit Completed

- ✅ SQL Injection: No raw queries (using Prisma ORM)
- ✅ XSS: No dangerouslySetInnerHTML; React escapes by default
- ✅ CSRF: Origin/Referer validation + SameSite=Strict
- ✅ Authentication: JWT + bcrypt + rate limiting
- ✅ File Upload: Presigned URLs + validation (type, size, filename)
- ✅ Session Security: HttpOnly, Secure, SameSite=Strict cookies
- ✅ CSP: No unsafe-inline/unsafe-eval
- ✅ Input Validation: Zod schemas on all endpoints
- ✅ Rate Limiting: Progressive lockout on failed attempts
- ✅ Environment Secrets: Enforced SESSION_SECRET ≥32 chars

---

**Last Updated**: May 2026  
**Status**: ✅ Production-Ready with Security Hardening  
