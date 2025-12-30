# DORA Comply - Project Configuration

## Project Overview

**DORA Comply** is an AI-powered Third-Party Risk Management platform for EU financial institutions facing DORA (Digital Operational Resilience Act) compliance. The platform automates vendor assessments, generates the Register of Information (RoI), and manages ICT incident reporting.

**Critical Deadline:** DORA enforcement January 17, 2025

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x (strict mode) |
| UI Library | shadcn/ui (New York style) | latest |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth | SSR package |
| State | React Server Components + TanStack Query | - |
| Forms | React Hook Form + Zod | - |
| Hosting | Vercel (Edge) | - |

## Project Structure

```
compliance-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, register, etc.)
│   │   ├── (dashboard)/        # Protected routes
│   │   ├── (marketing)/        # Public marketing pages
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/               # Auth-specific components
│   │   ├── marketing/          # Landing page components
│   │   └── [feature]/          # Feature-specific components
│   ├── lib/
│   │   ├── supabase/           # Supabase client & config
│   │   ├── auth/               # Auth utilities, hooks, actions
│   │   ├── validation/         # Zod schemas
│   │   └── utils.ts            # Shared utilities
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # SQL migrations (001-004 applied)
├── docs/
│   ├── architecture/           # MASTER-SPEC.md, AUTH-SPECIFICATION.md
│   ├── design/                 # LANDING-PAGE-SPECIFICATION.md
│   └── ...
├── data/
│   └── esa/                    # Downloaded ESA regulatory files
└── scripts/                    # Utility scripts
```

## Key Documentation

Always reference these authoritative documents:

- **Master Spec:** `docs/architecture/MASTER-SPEC.md` - Complete platform specification
- **Auth Spec:** `docs/architecture/AUTH-SPECIFICATION.md` - Authentication workflow
- **Landing Page:** `docs/design/LANDING-PAGE-SPECIFICATION.md` - Marketing page design
- **Theme Preview:** `/theme` route - Live design system preview

## Design System

### Colors (Premium Coral Theme)

```css
/* Primary - Warm Terracotta (Airbnb-inspired) */
--primary: #E07A5F;
--primary-foreground: #FFFFFF;

/* Semantic */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;

/* Risk Levels */
--risk-low: #10B981;
--risk-medium: #F59E0B;
--risk-high: #F97316;
--risk-critical: #EF4444;
```

### Typography

- **Font:** Plus Jakarta Sans
- **Headings:** font-semibold, tight tracking (-0.02em to -0.03em)
- **Body:** font-normal, 1.6 line-height

### Component Classes

Use these premium utility classes from `globals.css`:

- `.card-premium` - Elevated card with hover shadow
- `.card-elevated` - Card with border and hover effect
- `.btn-primary` / `.btn-secondary` / `.btn-ghost` - Button variants
- `.badge-*` - Status badges (success, warning, error, info)
- `.input-premium` - Styled input fields
- `.stat-card` / `.stat-value` / `.stat-label` - Metric displays
- `.nav-item` / `.nav-item.active` - Navigation items
- `.table-premium` - Styled data tables
- `.status-dot-*` - Status indicators

### Animation Classes

- `.animate-in` - Fade in with slight upward motion
- `.animate-slide-up` - Slide up animation
- `.stagger > *` - Staggered children animation (50ms delay each)

## Coding Standards

### TypeScript

- **Strict mode enabled** - All code must pass strict type checking
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer explicit return types on exported functions
- Use `@/*` path aliases (maps to `./src/*`)

### React Patterns

```typescript
// Server Components (default in app/)
export default async function Page() {
  const data = await fetchData(); // Direct async
  return <Component data={data} />;
}

// Client Components (when needed)
'use client';
import { useState } from 'react';
export function InteractiveComponent() { ... }

// Server Actions
'use server';
export async function submitForm(formData: FormData) { ... }
```

### Component Guidelines

1. **Prefer Server Components** - Only use 'use client' when necessary
2. **Colocate related files** - Keep components with their types/utils
3. **Use shadcn/ui** - Extend existing components, don't reinvent
4. **Composition over props** - Use compound components pattern
5. **Accessible by default** - All interactive elements keyboard-navigable

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VendorCard.tsx` |
| Hooks | camelCase, use prefix | `useAuth.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Vendor`, `AuthState` |
| Routes | kebab-case | `reset-password/` |
| CSS classes | kebab-case | `card-premium` |

### File Organization

```typescript
// Component file structure
'use client'; // Only if needed

import { ... } from 'react';           // React imports first
import { ... } from 'next/...';        // Next.js imports
import { ... } from '@/components/ui'; // Internal imports
import { ... } from '@/lib/...';       // Lib imports
import { cn } from '@/lib/utils';      // Utils last

// Types (can be separate file if complex)
interface ComponentProps { ... }

// Component
export function Component({ ... }: ComponentProps) { ... }

// Subcomponents (if small)
function SubComponent() { ... }
```

## Database

### Supabase Configuration

- **EU Region:** Frankfurt (oipwlrhyzayuxgcabsvu)
- **Multi-tenant:** All tables use `organization_id` for isolation
- **RLS Enabled:** All 30 tables have Row-Level Security

### Key Helper Function

```sql
-- Used in all RLS policies
SELECT get_user_organization_id() -- Returns current user's org
```

### Migrations Applied

1. `001_initial_schema.sql` - Core entities
2. `002_incident_reporting.sql` - Incident management
3. `003_enhanced_roi.sql` - Full RoI support (15 templates)
4. `004_framework_mapping.sql` - Cross-framework controls

## Authentication

### Flows to Implement

1. **Register** → Email verification → Onboarding
2. **Login** → MFA challenge (if enabled) → Dashboard
3. **Password Reset** → Email → New password
4. **MFA Setup** → TOTP enrollment → Recovery codes

### Security Requirements

- Password: 12+ chars, zxcvbn score 3+, HIBP check
- MFA: Mandatory for admins, recommended for all
- Sessions: 1h access token, 7d refresh, max 5 concurrent
- Rate limiting: 5 login attempts/15min

## Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint check

# Supabase (via MCP)
# Use mcp__supabase__* tools for database operations
```

## MCP Servers

Connected MCP servers (see `.mcp.json`):

- **supabase** - Database operations, migrations, types
- **vercel** - Deployment management

## Implementation Priority

Based on MASTER-SPEC Phase 1:

1. **Auth System** (current) - Foundation for all features
2. **Landing Page** - Marketing with working CTAs
3. **Dashboard** - Protected home for authenticated users
4. **Vendors** - Core CRUD operations
5. **Documents** - Upload and AI parsing

## Skills

Reference `.claude/skills.md` for detailed skill usage. Key skills for this project:

| Domain | Skills |
|--------|--------|
| **Project Management** | `/project-orchestrator`, `/compliance-orchestrator` |
| **Compliance** | `/dora-compliance`, `/soc2-reports`, `/tprm-domain` |
| **Security** | `/cybersecurity-expert` |
| **Frontend** | `/example-skills:frontend-design`, `/product-design`, `/user-experience` |
| **Optimization** | `/nextjs-code-optimizer`, `/ultraoptimization-expert` |
| **Documents** | `/example-skills:pdf`, `/example-skills:xlsx`, `/example-skills:docx` |

## Quality Checklist

Before completing any feature:

- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Components use design system tokens
- [ ] Server Components used where possible
- [ ] Forms validated with Zod schemas
- [ ] Accessible (keyboard nav, ARIA labels)
- [ ] Mobile responsive (test at 640px, 1024px)
- [ ] Error states handled gracefully
- [ ] Loading states implemented

## Anti-Patterns to Avoid

- Don't use `any` type - use `unknown` and narrow
- Don't fetch in useEffect - use Server Components or TanStack Query
- Don't hardcode colors - use CSS variables
- Don't create one-off components - extend shadcn/ui
- Don't skip error boundaries - wrap feature sections
- Don't ignore TypeScript errors - fix them properly
