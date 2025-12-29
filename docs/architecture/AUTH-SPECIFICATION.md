# Authentication & Authorization Specification

**Document Status:** AUTHORITATIVE
**Last Updated:** 2024-12-30
**Version:** 1.0

> Industry-standard authentication workflow for DORA Comply platform.
> Designed for EU financial institutions with compliance-grade security.

---

## Table of Contents

1. [Security Requirements](#1-security-requirements)
2. [Authentication Flows](#2-authentication-flows)
3. [Session Management](#3-session-management)
4. [Multi-Factor Authentication](#4-multi-factor-authentication)
5. [OAuth & SSO](#5-oauth--sso)
6. [Password Policy](#6-password-policy)
7. [Authorization & RBAC](#7-authorization--rbac)
8. [Security Headers & Protections](#8-security-headers--protections)
9. [Audit & Compliance](#9-audit--compliance)
10. [Implementation Details](#10-implementation-details)

---

## 1. Security Requirements

### 1.1 Compliance Standards

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| **DORA** | Strong authentication for critical ICT systems | MFA mandatory for admins |
| **GDPR** | Data minimization, consent | Only collect necessary data |
| **SOC 2** | Access control (CC6.1-6.8) | RBAC, audit logging |
| **ISO 27001** | A.9 Access Control | Password policy, session limits |
| **OWASP ASVS** | Level 2 compliance | All auth requirements |

### 1.2 Security Posture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │   Client (Edge)   │───▶│   Supabase Auth  │───▶│   Database    │ │
│  │                   │    │                  │    │   (RLS)       │ │
│  │  - HTTPS only     │    │  - JWT tokens    │    │               │ │
│  │  - CSP headers    │    │  - MFA (TOTP)    │    │  - org_id     │ │
│  │  - CSRF tokens    │    │  - OAuth 2.0     │    │  - user_id    │ │
│  │  - Secure cookies │    │  - Rate limiting │    │  - role       │ │
│  └──────────────────┘    └──────────────────┘    └───────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Flows

### 2.1 Email/Password Registration

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Client    │    │  Supabase   │    │   Email     │
│   Browser   │    │   Next.js   │    │   Auth      │    │   Service   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │  1. Fill form    │                  │                  │
       │─────────────────▶│                  │                  │
       │                  │                  │                  │
       │                  │  2. Validate     │                  │
       │                  │     client-side  │                  │
       │                  │                  │                  │
       │                  │  3. signUp()     │                  │
       │                  │─────────────────▶│                  │
       │                  │                  │                  │
       │                  │                  │  4. Send email   │
       │                  │                  │─────────────────▶│
       │                  │                  │                  │
       │                  │  5. Return       │                  │
       │                  │◀─────────────────│                  │
       │                  │                  │                  │
       │  6. Show verify  │                  │                  │
       │◀─────────────────│                  │                  │
       │     message      │                  │                  │
       │                  │                  │                  │
       │  7. Click email  │                  │                  │
       │     link         │                  │                  │
       │─────────────────────────────────────▶                  │
       │                  │                  │                  │
       │                  │  8. Verify token │                  │
       │                  │◀─────────────────│                  │
       │                  │                  │                  │
       │  9. Redirect to  │                  │                  │
       │     onboarding   │                  │                  │
       │◀─────────────────│                  │                  │
       │                  │                  │                  │
```

### 2.2 Organization Onboarding Flow

After email verification, new users complete organization setup:

```typescript
interface OnboardingSteps {
  step1_organization: {
    name: string;                    // "Acme Financial Services"
    lei?: string;                    // Legal Entity Identifier
    jurisdiction: string;            // "DE" | "FR" | "NL" etc.
    organization_type: 'credit_institution' | 'investment_firm' |
                      'insurance' | 'payment_service' | 'other';
    size: 'small' | 'medium' | 'large';  // For tier recommendation
  };

  step2_user_profile: {
    full_name: string;
    job_title: string;
    phone?: string;                  // For MFA recovery
  };

  step3_security: {
    mfa_enabled: boolean;            // Strongly recommended
    mfa_method: 'totp' | 'sms';      // TOTP preferred
  };

  step4_invite_team?: {
    invites: { email: string; role: 'admin' | 'member' | 'viewer' }[];
  };
}
```

### 2.3 Login Flow

```
Standard Login:
  1. User enters email/password
  2. Client validates format
  3. supabase.auth.signInWithPassword()
  4. If MFA enabled → redirect to MFA challenge
  5. If no MFA → issue session, redirect to dashboard
  6. Set secure cookies (httpOnly, sameSite: 'lax', secure)

MFA Challenge:
  1. Show TOTP input screen
  2. User enters 6-digit code
  3. supabase.auth.mfa.verify()
  4. If valid → issue session
  5. If invalid → increment attempt counter
  6. After 5 failures → temporary lockout (15 min)
```

### 2.4 Password Reset Flow

```
1. User clicks "Forgot Password"
2. Enter email address
3. supabase.auth.resetPasswordForEmail()
4. Email with reset link sent (valid 1 hour)
5. User clicks link → redirected to reset form
6. Enter new password (must meet policy)
7. supabase.auth.updateUser({ password })
8. Invalidate all existing sessions
9. Redirect to login with success message
```

---

## 3. Session Management

### 3.1 Token Strategy

| Token Type | Storage | Lifetime | Use Case |
|------------|---------|----------|----------|
| **Access Token** | Memory | 1 hour | API requests |
| **Refresh Token** | httpOnly cookie | 7 days | Token refresh |
| **Session Cookie** | httpOnly cookie | Session | SSR auth |

### 3.2 Session Configuration

```typescript
// lib/supabase/client.ts
export const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',  // Most secure for SPAs
    storage: {
      getItem: (key) => cookies().get(key)?.value,
      setItem: (key, value) => cookies().set(key, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      }),
      removeItem: (key) => cookies().delete(key),
    },
  },
};
```

### 3.3 Session Security Controls

```typescript
// Middleware: src/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request });

  // Refresh session if needed
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check session validity
  if (session) {
    // Verify session not revoked
    const { data: user } = await supabase
      .from('users')
      .select('session_revoked_at')
      .eq('id', session.user.id)
      .single();

    if (user?.session_revoked_at &&
        new Date(session.created_at) < new Date(user.session_revoked_at)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login?reason=session_revoked', request.url));
    }
  }

  return NextResponse.next();
}
```

### 3.4 Concurrent Session Handling

```typescript
// Maximum active sessions per user
const MAX_SESSIONS = 5;

// On new login, check active sessions
async function handleNewSession(userId: string) {
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sessions && sessions.length >= MAX_SESSIONS) {
    // Revoke oldest session
    await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessions[sessions.length - 1].id);
  }
}
```

---

## 4. Multi-Factor Authentication

### 4.1 MFA Requirements

| User Role | MFA Required | Methods Allowed |
|-----------|--------------|-----------------|
| **Super Admin** | Mandatory | TOTP only |
| **Admin** | Mandatory | TOTP, SMS |
| **Member** | Recommended | TOTP, SMS |
| **Viewer** | Optional | TOTP, SMS |

### 4.2 TOTP Setup Flow

```
1. User navigates to Settings > Security
2. Click "Enable Two-Factor Authentication"
3. supabase.auth.mfa.enroll({ factorType: 'totp' })
4. Display QR code (otpauth:// URI)
5. User scans with authenticator app
6. User enters verification code
7. supabase.auth.mfa.verify({ factorId, code })
8. Display recovery codes (one-time use)
9. User must confirm saving recovery codes
10. MFA enabled on account
```

### 4.3 Recovery Codes

```typescript
interface RecoveryCodes {
  codes: string[];        // 10 one-time codes
  generated_at: Date;
  used_codes: string[];   // Track which are used
}

// Recovery code format: XXXX-XXXX (alphanumeric)
function generateRecoveryCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    `${randomAlphanumeric(4)}-${randomAlphanumeric(4)}`
  );
}
```

### 4.4 MFA Challenge UI

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Two-Factor Authentication                    │
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │                                                         │  │
│    │     Enter the 6-digit code from your                   │  │
│    │     authenticator app                                   │  │
│    │                                                         │  │
│    │     ┌───┐ ┌───┐ ┌───┐  ┌───┐ ┌───┐ ┌───┐              │  │
│    │     │   │ │   │ │   │  │   │ │   │ │   │              │  │
│    │     └───┘ └───┘ └───┘  └───┘ └───┘ └───┘              │  │
│    │                                                         │  │
│    │     [Use recovery code instead]                         │  │
│    │                                                         │  │
│    │                            [Verify]                     │  │
│    │                                                         │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│    Having trouble? Contact support                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. OAuth & SSO

### 5.1 Supported Providers

| Provider | Status | Use Case |
|----------|--------|----------|
| **Microsoft Entra ID** | P1 | Enterprise SSO |
| **Google Workspace** | P1 | Enterprise SSO |
| **Okta** | P2 | Enterprise SSO |
| **SAML 2.0** | P2 | Custom IdP |

### 5.2 OAuth Flow (PKCE)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Client    │    │  Supabase   │    │   OAuth     │
│   Browser   │    │   Next.js   │    │   Auth      │    │   Provider  │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │  1. Click SSO    │                  │                  │
       │─────────────────▶│                  │                  │
       │                  │                  │                  │
       │                  │  2. Generate     │                  │
       │                  │     PKCE codes   │                  │
       │                  │                  │                  │
       │                  │  3. signInWith   │                  │
       │                  │     OAuth()      │                  │
       │                  │─────────────────▶│                  │
       │                  │                  │                  │
       │  4. Redirect to  │                  │  5. Auth URL     │
       │     provider     │◀─────────────────│─────────────────▶│
       │─────────────────────────────────────────────────────────▶
       │                  │                  │                  │
       │  6. User authn   │                  │                  │
       │     at provider  │                  │                  │
       │                  │                  │                  │
       │  7. Callback     │                  │                  │
       │◀─────────────────────────────────────────────────────────
       │                  │                  │                  │
       │                  │  8. Exchange     │                  │
       │                  │     code         │                  │
       │                  │─────────────────▶│                  │
       │                  │                  │                  │
       │                  │  9. Get tokens   │                  │
       │                  │◀─────────────────│                  │
       │                  │                  │                  │
       │  10. Session     │                  │                  │
       │      created     │                  │                  │
       │◀─────────────────│                  │                  │
       │                  │                  │                  │
```

### 5.3 Domain Verification for SSO

```typescript
// Enterprise SSO requires verified domain
interface SSOConfiguration {
  organization_id: string;
  provider: 'azure' | 'google' | 'okta' | 'saml';

  // Domain verification
  verified_domains: string[];  // ["acme.com", "acme.eu"]

  // Provider config
  azure?: {
    tenant_id: string;
    client_id: string;
  };

  // Auto-provisioning
  auto_provision_users: boolean;
  default_role: 'member' | 'viewer';
}
```

---

## 6. Password Policy

### 6.1 Requirements

| Requirement | Value | Rationale |
|-------------|-------|-----------|
| **Minimum Length** | 12 characters | NIST SP 800-63B |
| **Maximum Length** | 128 characters | Allow passphrases |
| **Complexity** | No requirements | NIST recommends against |
| **Breached Check** | Required | HIBP API integration |
| **History** | Last 5 passwords | Prevent reuse |
| **Expiry** | None | NIST recommends against |

### 6.2 Password Strength Meter

```typescript
// Using zxcvbn for realistic strength estimation
import zxcvbn from 'zxcvbn';

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;  // 0=weak, 4=strong
  feedback: {
    warning: string;
    suggestions: string[];
  };
  crackTime: string;
}

function validatePassword(password: string): PasswordStrength {
  const result = zxcvbn(password);
  return {
    score: result.score,
    feedback: result.feedback,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
  };
}

// Minimum score required: 3 (good)
```

### 6.3 Breached Password Check

```typescript
// Check against Have I Been Pwned (k-anonymity model)
async function isPasswordBreached(password: string): Promise<boolean> {
  const sha1 = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(password)
  );
  const hash = Array.from(new Uint8Array(sha1))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`
  );
  const text = await response.text();

  return text.includes(suffix);
}
```

---

## 7. Authorization & RBAC

### 7.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Super Admin  │  Platform-level (Dora Comply staff)           │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │    Owner     │  Organization owner (billing, delete org)     │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │    Admin     │  Full access to org features                  │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   Member     │  Standard user (CRUD vendors, documents)      │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   Viewer     │  Read-only access                             │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| **View dashboard** | ✓ | ✓ | ✓ | ✓ |
| **View vendors** | ✓ | ✓ | ✓ | ✓ |
| **Create vendors** | ✓ | ✓ | ✓ | - |
| **Edit vendors** | ✓ | ✓ | ✓ | - |
| **Delete vendors** | ✓ | ✓ | - | - |
| **Upload documents** | ✓ | ✓ | ✓ | - |
| **Delete documents** | ✓ | ✓ | - | - |
| **Export RoI** | ✓ | ✓ | ✓ | - |
| **Manage incidents** | ✓ | ✓ | ✓ | - |
| **Submit reports** | ✓ | ✓ | - | - |
| **Manage team** | ✓ | ✓ | - | - |
| **Invite users** | ✓ | ✓ | - | - |
| **Remove users** | ✓ | ✓ | - | - |
| **Billing settings** | ✓ | - | - | - |
| **Delete organization** | ✓ | - | - | - |
| **API key management** | ✓ | ✓ | - | - |

### 7.3 RLS Policies

```sql
-- Users can only access their organization's data
CREATE POLICY "org_isolation" ON vendors
  FOR ALL
  USING (organization_id = get_user_organization_id());

-- Role-based write access
CREATE POLICY "member_write" ON vendors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin', 'member')
    )
  );

-- Only admins can delete
CREATE POLICY "admin_delete" ON vendors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

---

## 8. Security Headers & Protections

### 8.1 HTTP Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://*.supabase.co https://api.anthropic.com;
      frame-ancestors 'none';
      form-action 'self';
      base-uri 'self';
    `.replace(/\s+/g, ' ').trim(),
  },
];
```

### 8.2 Rate Limiting

```typescript
// Rate limits per endpoint
const RATE_LIMITS = {
  // Auth endpoints (strict)
  '/api/auth/login': { requests: 5, window: '15m' },
  '/api/auth/signup': { requests: 3, window: '1h' },
  '/api/auth/reset-password': { requests: 3, window: '1h' },

  // API endpoints (moderate)
  '/api/vendors': { requests: 100, window: '1m' },
  '/api/documents': { requests: 50, window: '1m' },
  '/api/ai/*': { requests: 20, window: '1m' },

  // Export (expensive)
  '/api/roi/export': { requests: 5, window: '15m' },
};
```

### 8.3 Brute Force Protection

```typescript
// Login attempt tracking
interface LoginAttempts {
  email: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

const LOCKOUT_THRESHOLDS = {
  attempts: 5,           // After 5 failed attempts
  lockoutDuration: 15,   // Lock for 15 minutes
  progressiveMultiplier: 2,  // Double lockout each time
};

async function handleFailedLogin(email: string) {
  const attempts = await getLoginAttempts(email);

  if (attempts.count >= LOCKOUT_THRESHOLDS.attempts) {
    const lockoutMinutes = LOCKOUT_THRESHOLDS.lockoutDuration *
      Math.pow(LOCKOUT_THRESHOLDS.progressiveMultiplier, attempts.lockouts);

    await setAccountLocked(email, lockoutMinutes);

    // Alert on suspicious activity
    if (attempts.lockouts >= 3) {
      await alertSecurityTeam({
        type: 'brute_force_suspected',
        email,
        attempts: attempts.count,
        ip: getClientIP(),
      });
    }
  }
}
```

---

## 9. Audit & Compliance

### 9.1 Authentication Events Logged

| Event | Data Captured | Retention |
|-------|---------------|-----------|
| **login_success** | user_id, ip, user_agent, mfa_used | 2 years |
| **login_failure** | email, ip, user_agent, reason | 2 years |
| **logout** | user_id, session_id | 2 years |
| **password_change** | user_id, ip | 2 years |
| **mfa_enabled** | user_id, method | 2 years |
| **mfa_disabled** | user_id, admin_override? | 2 years |
| **session_revoked** | user_id, reason | 2 years |
| **role_changed** | user_id, old_role, new_role, changed_by | 2 years |

### 9.2 Audit Log Schema

```sql
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Event details
  event_type TEXT NOT NULL,
  event_status TEXT NOT NULL,  -- 'success' | 'failure'

  -- Actor
  user_id UUID REFERENCES users(id),
  user_email TEXT,

  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Metadata
  metadata JSONB,

  -- Immutability
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_auth_audit_user ON auth_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_auth_audit_event ON auth_audit_log(event_type, timestamp DESC);
```

### 9.3 Compliance Reports

```typescript
// Generate audit report for compliance
interface AuthAuditReport {
  period: { start: Date; end: Date };

  summary: {
    total_logins: number;
    unique_users: number;
    failed_logins: number;
    mfa_usage_rate: number;
    suspicious_activities: number;
  };

  mfa_compliance: {
    admins_with_mfa: number;
    admins_total: number;
    compliance_rate: number;
  };

  access_patterns: {
    peak_hours: string[];
    unusual_access: AnomalyEvent[];
  };
}
```

---

## 10. Implementation Details

### 10.1 Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx           # Login form
│   │   ├── register/
│   │   │   └── page.tsx           # Registration form
│   │   ├── verify/
│   │   │   └── page.tsx           # Email verification
│   │   ├── reset-password/
│   │   │   └── page.tsx           # Password reset
│   │   ├── mfa/
│   │   │   ├── setup/
│   │   │   │   └── page.tsx       # MFA setup
│   │   │   └── verify/
│   │   │       └── page.tsx       # MFA challenge
│   │   └── onboarding/
│   │       └── page.tsx           # New user onboarding
│   └── api/
│       └── auth/
│           ├── callback/
│           │   └── route.ts       # OAuth callback
│           └── session/
│               └── route.ts       # Session management
├── lib/
│   └── supabase/
│       ├── client.ts              # Browser client
│       ├── server.ts              # Server client
│       ├── middleware.ts          # Auth middleware
│       └── auth/
│           ├── actions.ts         # Server actions
│           ├── hooks.ts           # React hooks
│           └── utils.ts           # Auth utilities
└── components/
    └── auth/
        ├── login-form.tsx
        ├── register-form.tsx
        ├── mfa-input.tsx
        ├── password-input.tsx
        └── oauth-buttons.tsx
```

### 10.2 Environment Variables

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# OAuth Providers (optional)
AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Security
SESSION_SECRET=xxx
RATE_LIMIT_REDIS_URL=xxx
```

### 10.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/callback` | GET | OAuth callback handler |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/session` | DELETE | Revoke session |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/auth/mfa/enroll` | POST | Start MFA enrollment |
| `/api/auth/mfa/verify` | POST | Verify MFA code |

---

## Screen Specifications

### Login Screen (`/login`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ┌─────────┐                                                      │
│   │  LOGO   │                                                      │
│   └─────────┘                                                      │
│                                                                     │
│              Welcome back                                           │
│              Sign in to your account                                │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │  Email                                                    │    │
│   │  ┌─────────────────────────────────────────────────────┐ │    │
│   │  │ you@company.com                                     │ │    │
│   │  └─────────────────────────────────────────────────────┘ │    │
│   │                                                           │    │
│   │  Password                                    [Forgot?]   │    │
│   │  ┌─────────────────────────────────────────────────────┐ │    │
│   │  │ ••••••••••••                              [👁️]     │ │    │
│   │  └─────────────────────────────────────────────────────┘ │    │
│   │                                                           │    │
│   │  ┌─────────────────────────────────────────────────────┐ │    │
│   │  │                    Sign in                          │ │    │
│   │  └─────────────────────────────────────────────────────┘ │    │
│   │                                                           │    │
│   │                         or                                │    │
│   │                                                           │    │
│   │  ┌────────────────────┐  ┌────────────────────┐          │    │
│   │  │  🔵 Microsoft     │  │  🔴 Google         │          │    │
│   │  └────────────────────┘  └────────────────────┘          │    │
│   │                                                           │    │
│   │  Don't have an account? Sign up                          │    │
│   │                                                           │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
│   By signing in, you agree to our Terms and Privacy Policy         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Register Screen (`/register`)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ┌─────────┐                                                      │
│   │  LOGO   │                                                      │
│   └─────────┘                                                      │
│                                                                     │
│              Get started for free                                   │
│              Start your 14-day trial today                          │
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │  Work email                                               │    │
│   │  ┌─────────────────────────────────────────────────────┐ │    │
│   │  │ you@company.com                                     │ │    │
│   │  └─────────────────────────────────────────────────────┘ │    │
│   │                                                           │    │
│   │  Password                                                 │    │
│   │  ┌─────────────────────────────────────────────────────┐ │    │
│   │  │ ••••••••••••                              [👁️]     │ │    │
│   │  └─────────────────────────────────────────────────────┘ │    │
│   │  [████████░░░░░░░░░░] Good - Could take 3 years to crack │    │
│   │                                                           │    │
│   │  ☑️ I agree to the Terms of Service and Privacy Policy   │    │
│   │                                                           │    │
│   │  ┌─────────────────────────────────────────────────────┐ │    │
│   │  │                  Create account                     │ │    │
│   │  └─────────────────────────────────────────────────────┘ │    │
│   │                                                           │    │
│   │                         or                                │    │
│   │                                                           │    │
│   │  ┌────────────────────┐  ┌────────────────────┐          │    │
│   │  │  🔵 Microsoft     │  │  🔴 Google         │          │    │
│   │  └────────────────────┘  └────────────────────┘          │    │
│   │                                                           │    │
│   │  Already have an account? Sign in                        │    │
│   │                                                           │    │
│   └───────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Document Maintained By:** Security Engineering
**Last Full Review:** 2024-12-30
**Next Review:** Before GA launch
