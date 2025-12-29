# DORA Compliance Platform - Setup Guide

**Purpose:** Complete setup checklist before starting development
**Time Required:** ~2-3 hours for full setup

---

## Quick Checklist

### Required for MVP Development
- [ ] GitHub repository configured
- [ ] Supabase project (EU region)
- [ ] Vercel project linked
- [ ] Anthropic API key
- [ ] Environment variables configured
- [ ] Local development running

### Required Before Launch
- [ ] Custom domain purchased
- [ ] Supabase US region (for US customers)
- [ ] Resend email configured
- [ ] Sentry error tracking
- [ ] OAuth providers (Google, Microsoft)
- [ ] Production environment variables

---

## 1. GitHub Repository

### 1.1 Repository Setup

```bash
# Already created at: https://github.com/FedericoTs/dora-comply

# Clone if needed
git clone https://github.com/FedericoTs/dora-comply.git
cd dora-comply
```

### 1.2 Branch Protection (Settings > Branches)

```yaml
Protected branches:
  main:
    - Require pull request before merging
    - Require status checks (when CI added)
    - Require conversation resolution
```

### 1.3 Repository Secrets (Settings > Secrets)

Add these secrets for CI/CD:
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
VERCEL_TOKEN
```

---

## 2. Supabase Setup

### 2.1 Create EU Project (Primary)

1. Go to [supabase.com](https://supabase.com)
2. Create new project:
   - **Name:** `dora-comply-eu`
   - **Region:** `eu-central-1` (Frankfurt)
   - **Plan:** Pro ($25/month) - needed for production
   - **Password:** Generate strong password, save securely

3. Note these values from Settings > API:
   ```
   Project URL: https://xxxx.supabase.co
   anon/public key: eyJhbG...
   service_role key: eyJhbG... (keep secret!)
   ```

### 2.2 Database Configuration

```sql
-- Run in SQL Editor after project creation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
ALTER DATABASE postgres SET timezone TO 'UTC';
```

### 2.3 Storage Buckets

Create in Storage section:
```
Buckets:
  - documents (private)
    - Max file size: 50MB
    - Allowed types: application/pdf, image/*, application/vnd.openxmlformats-officedocument.*

  - exports (private)
    - For generated xBRL-CSV files

  - logos (public)
    - For organization/vendor logos
```

### 2.4 Auth Configuration

Settings > Authentication:
```yaml
Site URL: http://localhost:3000 (dev) / https://app.doracomply.eu (prod)

Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://app.doracomply.eu/auth/callback

Email Templates:
  - Customize with brand (later)

Providers (enable later):
  - Email (default)
  - Google OAuth
  - Microsoft Azure AD
```

### 2.5 Row Level Security

RLS will be enabled when we run migrations. Key policies:
```sql
-- Organizations: users can only see their org
-- Vendors: scoped to organization
-- Documents: scoped to organization
-- All data isolated by org_id
```

---

## 3. Vercel Setup

### 3.1 Create Project

1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository: `FedericoTs/dora-comply`
3. Configure:
   - **Framework:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 3.2 Environment Variables

Add in Vercel Dashboard > Settings > Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-... (optional, for fallback)

# App Config
NEXT_PUBLIC_APP_URL=https://app.doracomply.eu
NEXT_PUBLIC_APP_ENV=production

# Email (add when ready)
RESEND_API_KEY=re_...

# Monitoring (add when ready)
SENTRY_DSN=https://...@sentry.io/...
```

### 3.3 Domains

Settings > Domains:
```
Production:
  - app.doracomply.eu (primary)
  - www.doracomply.eu (redirect to app)

Preview:
  - *.vercel.app (automatic)
```

### 3.4 Vercel Configuration

Create `vercel.json` in project root:
```json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/ingest/static/:path*",
      "destination": "https://eu-assets.i.posthog.com/static/:path*"
    },
    {
      "source": "/ingest/:path*",
      "destination": "https://eu.i.posthog.com/:path*"
    }
  ]
}
```

---

## 4. API Keys & Services

### 4.1 Anthropic (Required)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account / Sign in
3. Go to API Keys
4. Create new key: `dora-comply-production`
5. Add billing method (pay-as-you-go)
6. Set usage limits:
   - Monthly limit: $100 (adjust as needed)
   - Alert at: $50

```
Key format: sk-ant-api03-...
```

### 4.2 OpenAI (Optional - Fallback)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Set usage limits

```
Key format: sk-proj-...
```

### 4.3 Resend (Email)

1. Go to [resend.com](https://resend.com)
2. Create account
3. Verify domain: `doracomply.eu`
4. Create API key

```
Key format: re_...
```

DNS records to add:
```
Type    Name                    Value
TXT     resend._domainkey       (provided by Resend)
TXT     @                       v=spf1 include:_spf.resend.com ~all
```

### 4.4 Sentry (Error Tracking)

1. Go to [sentry.io](https://sentry.io)
2. Create project: `dora-comply-nextjs`
3. Get DSN

```
DSN format: https://xxx@xxx.ingest.sentry.io/xxx
```

### 4.5 PostHog (Analytics - Optional)

1. Go to [posthog.com](https://posthog.com)
2. Create EU Cloud project
3. Get project API key

```
Key format: phc_...
Host: https://eu.posthog.com
```

---

## 5. Domain & DNS

### 5.1 Purchase Domain

Recommended registrars:
- Cloudflare Registrar (cheapest, includes DNS)
- Namecheap
- Google Domains (now Squarespace)

Suggested domains:
```
doracomply.eu      - Primary (EU TLD for trust)
doracomply.com     - Redirect
dora-comply.com    - Redirect
```

### 5.2 DNS Configuration (Cloudflare recommended)

```
Type    Name    Value                   Proxy
A       @       76.76.21.21            Yes (Vercel)
CNAME   www     cname.vercel-dns.com   Yes
CNAME   app     cname.vercel-dns.com   Yes

# Email (Resend)
TXT     @       v=spf1 include:_spf.resend.com ~all
TXT     resend._domainkey   (from Resend)
MX      @       feedback-smtp.eu-west-1.amazonses.com  10
```

### 5.3 SSL/TLS

- Vercel: Automatic via Let's Encrypt
- Cloudflare: Enable "Full (strict)" mode

---

## 6. Local Development Setup

### 6.1 Prerequisites

```bash
# Node.js 20+ (use nvm)
nvm install 20
nvm use 20

# pnpm (faster than npm)
npm install -g pnpm

# Supabase CLI
npm install -g supabase

# Verify installations
node --version  # v20.x.x
pnpm --version  # 8.x.x
supabase --version
```

### 6.2 Clone & Install

```bash
git clone https://github.com/FedericoTs/dora-comply.git
cd dora-comply
pnpm install
```

### 6.3 Environment File

Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Optional
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
```

### 6.4 Database Setup

```bash
# Link to Supabase project
supabase link --project-ref xxxx

# Run migrations
supabase db push

# Or run migrations manually via SQL Editor
```

### 6.5 Start Development

```bash
pnpm dev

# Open http://localhost:3000
```

---

## 7. Environment Variables Reference

### Complete List

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Supabase admin key |
| `ANTHROPIC_API_KEY` | Yes | Server | Claude API key |
| `OPENAI_API_KEY` | No | Server | GPT-4 fallback |
| `NEXT_PUBLIC_APP_URL` | Yes | Client | App base URL |
| `NEXT_PUBLIC_APP_ENV` | Yes | Client | development/production |
| `RESEND_API_KEY` | Prod | Server | Email sending |
| `SENTRY_DSN` | Prod | Both | Error tracking |
| `POSTHOG_KEY` | No | Client | Analytics |
| `POSTHOG_HOST` | No | Client | Analytics host |

### Security Notes

```
NEVER commit to git:
- .env.local
- .env.production
- Any file with API keys

ALWAYS use:
- Environment variables in Vercel
- GitHub Secrets for CI/CD
- .env.example for templates
```

---

## 8. Pre-Launch Checklist

### Security
- [ ] All API keys rotated from development
- [ ] RLS policies tested
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured

### Performance
- [ ] Database indexes created
- [ ] Edge caching configured
- [ ] Images optimized
- [ ] Bundle size analyzed

### Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent implemented
- [ ] GDPR data handling documented

### Monitoring
- [ ] Sentry configured
- [ ] Uptime monitoring (Vercel/UptimeRobot)
- [ ] Log aggregation (if needed)
- [ ] Cost alerts set on all services

---

## 9. Cost Summary (Monthly)

### Development Phase
| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25 |
| Vercel | Pro (1 user) | $20 |
| Anthropic | Pay-as-you-go | ~$10 |
| Domain | Annual/12 | ~$2 |
| **Total** | | **~$57/month** |

### Production Phase
| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro (2 regions) | $50 |
| Vercel | Pro (2 users) | $40 |
| Anthropic | Pay-as-you-go | ~$50 |
| Resend | Starter | $20 |
| Sentry | Team | $26 |
| Domain | Annual/12 | ~$2 |
| **Total** | | **~$188/month** |

---

## 10. Quick Start Commands

```bash
# Full setup from scratch
git clone https://github.com/FedericoTs/dora-comply.git
cd dora-comply
pnpm install
cp .env.example .env.local
# Edit .env.local with your keys
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
pnpm dev
```

---

**Last Updated:** 2024-12-29
