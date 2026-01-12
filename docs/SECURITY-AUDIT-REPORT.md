# Security Audit Report - DORA Comply

**Date:** 2026-01-12
**Auditor:** Claude Opus 4.5 (Automated Security Audit)
**Scope:** Full codebase security review
**Stack:** Next.js 16 + Supabase + Vercel

---

## Executive Summary

| Category | Status |
|----------|--------|
| Overall Security Posture | **GOOD** |
| Critical Issues | 2 |
| High Issues | 3 |
| Medium Issues | 3 |
| Low Issues | 2 |

The DORA Comply platform demonstrates solid security fundamentals with comprehensive input validation, proper RLS policies, and good authentication patterns. However, several API routes lack authentication checks and dependency vulnerabilities require attention before production deployment.

---

## Critical Findings

### 1. CRITICAL: Dependency Vulnerability - jspdf (Path Traversal)

**Location:** `package.json`
**CVE:** GHSA-f8cm-6447-x5h2
**Severity:** CRITICAL

jspdf <= 3.0.4 has a Local File Inclusion/Path Traversal vulnerability that could allow attackers to read arbitrary files on the server.

**Remediation:**
```bash
npm audit fix --force
# Or upgrade manually to jspdf@4.0.0+
```

**Impact:** An attacker could potentially read sensitive server files including environment variables.

---

### 2. CRITICAL: Missing Security Headers

**Location:** `next.config.ts`
**Issue:** No security headers configured

The application lacks essential HTTP security headers that protect against common web attacks.

**Remediation:** Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

---

## High Severity Findings

### 3. HIGH: Dependency Vulnerability - xlsx (Prototype Pollution + ReDoS)

**Location:** `package.json` (devDependencies)
**CVEs:** GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
**Severity:** HIGH

The xlsx package has Prototype Pollution and ReDoS vulnerabilities with no fix available.

**Remediation:**
- Replace with alternative: `exceljs` or `xlsx-populate`
- Or accept risk if only used in development/testing

---

### 4. HIGH: Unauthenticated API Route - Activity Export

**Location:** `src/app/api/activity/export/route.ts`
**Issue:** No explicit authentication check in API route

While the underlying function (`exportAuditTrailCsv`) checks auth internally, the API route itself lacks defense-in-depth protection.

**Remediation:** Add explicit auth check:
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

---

### 5. HIGH: Unauthenticated API Route - Monitoring Lookup

**Location:** `src/app/api/monitoring/lookup/route.ts`
**Issue:** Domain security scorecard lookups require no authentication

Any user can query security scorecards for any domain, which could:
- Expose internal vendor security assessments
- Be abused for reconnaissance
- Consume API quotas

**Remediation:** Add authentication check.

---

## Medium Severity Findings

### 6. MEDIUM: Unauthenticated API Route - GLEIF Validation

**Location:** `src/app/api/gleif/validate/route.ts`
**Issue:** LEI validation endpoint is public

While LEI validation itself is not sensitive, unauthenticated access could:
- Lead to API abuse
- Assist in reconnaissance

**Recommendation:** Add rate limiting and consider authentication.

---

### 7. MEDIUM: Unauthenticated API Route - Sanctions Config

**Location:** `src/app/api/sanctions/config/route.ts`
**Issue:** Configuration status endpoint is public

Returns whether OpenSanctions API is configured. Low risk but exposes system configuration.

**Recommendation:** Add authentication.

---

### 8. MEDIUM: Development Mode Bypasses Auth in Webhook

**Location:** `src/app/api/webhooks/parsing-complete/route.ts:37-38`
**Issue:** Auth is bypassed in development mode

```typescript
const isDev = process.env.NODE_ENV === 'development';
if (!isDev && (!modalKey || !modalSecret...)) {
```

If `NODE_ENV` is misconfigured in production, auth would be bypassed.

**Recommendation:** Remove dev bypass or add explicit check:
```typescript
if (process.env.VERCEL_ENV === 'production' && (!modalKey...)) {
```

---

## Low Severity Findings

### 9. LOW: Verbose Error Messages

**Various API routes**
Some error responses include detailed error messages that could aid attackers.

**Recommendation:** Ensure production error messages are generic.

---

### 10. LOW: Console Logging in Production

**Various files**
`console.log()` and `console.error()` statements may expose sensitive information in production logs.

**Recommendation:** Use a structured logging solution with log levels.

---

## Positive Findings

### Authentication & Authorization
- 30/37 API routes (81%) have explicit auth checks
- Supabase `getUser()` pattern consistently used
- Organization-based access control properly implemented

### Row Level Security (RLS)
- RLS enabled on ALL core tables
- `get_user_organization_id()` helper function for consistent org isolation
- Proper policies for SELECT, INSERT, UPDATE, DELETE operations
- Tables verified with RLS:
  - organizations, users, vendors, documents
  - parsed_soc2, parsed_iso27001, roi_entries
  - incidents, incident_reports, incident_events
  - All contract, service, and compliance tables

### Input Validation
- **XSS Prevention:** Comprehensive `sanitize.ts` with:
  - HTML escaping and stripping
  - Dangerous pattern removal (javascript:, vbscript:, event handlers)
  - Field-specific sanitization (email, URL, phone, LEI)
- **SQL Injection:** Pattern detection as secondary defense
- **Zod Validation:** Request bodies validated with schemas
- **Input Limits:** Max length enforcement on text fields

### Environment Security
- `.gitignore` properly excludes all `.env*` files (except `.env.example`)
- `NEXT_PUBLIC_*` variables contain only public-safe data
- Service role keys marked as server-only
- No hardcoded API keys found in source code

### Secrets Management
- No exposed secrets in codebase
- Secret patterns scanned: Google API, AWS, Stripe, GitHub, OpenAI, Anthropic, Database URIs, Private Keys

---

## Remediation Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| P0 | Add security headers to next.config.ts | Low |
| P0 | Upgrade jspdf to 4.0.0+ | Low |
| P1 | Add auth to activity/export route | Low |
| P1 | Add auth to monitoring/lookup route | Low |
| P2 | Replace xlsx with exceljs | Medium |
| P2 | Add auth to gleif/validate route | Low |
| P2 | Add auth to sanctions/config route | Low |
| P3 | Remove dev mode auth bypass in webhook | Low |
| P3 | Implement structured logging | Medium |

---

## OWASP Top 10 Compliance

| Category | Status | Notes |
|----------|--------|-------|
| A01: Broken Access Control | ⚠️ | Some API routes missing auth |
| A02: Cryptographic Failures | ✅ | HTTPS enforced, no secrets in URLs |
| A03: Injection | ✅ | Parameterized queries, comprehensive sanitization |
| A04: Insecure Design | ✅ | Rate limiting via Vercel, input limits |
| A05: Security Misconfiguration | ⚠️ | Missing security headers |
| A06: Vulnerable Components | ❌ | jspdf, xlsx vulnerabilities |
| A07: Auth Failures | ✅ | Strong password policy (zxcvbn), MFA support |
| A08: Data Integrity Failures | ✅ | Signed deployments via Vercel |
| A09: Logging & Monitoring | ⚠️ | Basic logging, needs improvement |
| A10: SSRF | ✅ | URL validation for external requests |

---

## Conclusion

The DORA Comply platform has a **good security foundation** with proper authentication patterns, comprehensive input validation, and well-configured RLS policies. The identified issues are addressable with moderate effort.

**Recommended Actions Before Production:**
1. Fix critical security headers (immediate)
2. Upgrade jspdf (immediate)
3. Add auth to remaining API routes (1-2 hours)
4. Plan xlsx replacement or risk acceptance

---

*This report was generated as part of an automated security audit. Manual penetration testing is recommended before production deployment.*
