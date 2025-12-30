# Auth Implementation Plan

**Created:** 2024-12-30
**Status:** Ready for Implementation
**Reference:** `docs/architecture/AUTH-SPECIFICATION.md`

---

## Executive Summary

This plan details the implementation of the authentication system for DORA Comply. The auth system is the foundation for all other features and must be completed first.

---

## 1. Current State Analysis

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Project | ✅ Ready | EU region (oipwlrhyzayuxgcabsvu) |
| Database Tables | ✅ Ready | `users`, `organizations` tables exist |
| RLS Policies | ⚠️ Partial | SELECT/UPDATE exist, INSERT missing |
| User Creation Trigger | ❌ Missing | Critical - must create |
| Middleware | ✅ Ready | Session refresh working |
| UI Components | ⚠️ Partial | Need form, checkbox, separator, icons |
| Form Libraries | ❌ Missing | Need react-hook-form, zxcvbn |

### Critical Gap: User Creation Trigger

When a user signs up via Supabase Auth, a record in `auth.users` is created automatically, but we need a corresponding record in `public.users`. Currently **no trigger exists** to create this record.

---

## 2. Manual Setup Required (Supabase Dashboard)

### 2.1 Email Templates Configuration

Navigate to: **Authentication > Email Templates**

Configure these templates with your domain:

#### Confirmation Email
```
Subject: Confirm your DORA Comply account

<h2>Welcome to DORA Comply</h2>
<p>Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>This link expires in 24 hours.</p>
```

#### Password Reset Email
```
Subject: Reset your DORA Comply password

<h2>Password Reset Request</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

#### Magic Link Email (optional)
```
Subject: Your DORA Comply login link

<h2>Login to DORA Comply</h2>
<p>Click the link below to log in:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
<p>This link expires in 1 hour.</p>
```

### 2.2 URL Configuration

Navigate to: **Authentication > URL Configuration**

| Setting | Development | Production |
|---------|-------------|------------|
| Site URL | `http://localhost:3000` | `https://yourdomain.com` |
| Redirect URLs | `http://localhost:3000/**` | `https://yourdomain.com/**` |

Add these redirect URLs:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/confirm`
- `https://yourdomain.com/auth/callback`
- `https://yourdomain.com/auth/confirm`

### 2.3 Auth Settings

Navigate to: **Authentication > Providers**

#### Email Provider Settings:
- ✅ Enable Email provider
- ✅ Enable "Confirm email" (double opt-in)
- ⬜ Disable "Secure email change" (optional, more friction)
- Set minimum password length: **12 characters**

#### Rate Limiting (Authentication > Rate Limits):
- Email sign-ups: 3 per hour per IP
- Password recovery: 3 per hour per email
- Verify/token requests: 30 per hour

### 2.4 MFA Settings (Future)

Navigate to: **Authentication > Multi-Factor Authentication**

- Enable TOTP (Authenticator apps)
- Keep Phone/SMS disabled initially (cost)

---

## 3. Database Migration Required

### Migration: `005_auth_user_trigger.sql`

This migration creates:
1. Trigger function to create user record on signup
2. INSERT policy on users table for the trigger
3. Function to handle organization creation during onboarding

```sql
-- Migration: 005_auth_user_trigger.sql
-- Purpose: Handle user creation when signing up via Supabase Auth

-- 1. Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'owner',  -- First user is owner, will be updated during onboarding
    NULL      -- Organization assigned during onboarding
  );
  RETURN NEW;
END;
$$;

-- 2. Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Create function to create organization during onboarding
CREATE OR REPLACE FUNCTION create_organization_for_user(
  p_user_id UUID,
  p_org_name TEXT,
  p_lei TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT 'financial_entity',
  p_jurisdiction TEXT DEFAULT 'EU',
  p_data_region TEXT DEFAULT 'eu'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name, lei, entity_type, jurisdiction, data_region)
  VALUES (p_org_name, p_lei, p_entity_type, p_jurisdiction, p_data_region)
  RETURNING id INTO v_org_id;

  -- Update user with organization_id
  UPDATE public.users
  SET organization_id = v_org_id, role = 'owner'
  WHERE id = p_user_id;

  RETURN v_org_id;
END;
$$;

-- 4. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_for_user TO authenticated;

-- 5. Add policy for users to read their own record even without org
CREATE POLICY "Users can read own record"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- 6. Add policy for the trigger to insert users
-- Note: This uses service_role which bypasses RLS
-- The trigger runs as SECURITY DEFINER so it can insert

-- 7. Allow users to update their own org_id during onboarding (one-time)
CREATE POLICY "Users can set initial organization"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid() AND organization_id IS NULL)
  WITH CHECK (id = auth.uid());
```

---

## 4. NPM Packages to Install

```bash
npm install zod react-hook-form @hookform/resolvers zxcvbn-ts @types/zxcvbn
```

| Package | Purpose |
|---------|---------|
| `zod` | Schema validation (already partial dep) |
| `react-hook-form` | Form state management |
| `@hookform/resolvers` | Zod integration with react-hook-form |
| `zxcvbn-ts` | Password strength estimation |

---

## 5. shadcn/ui Components to Add

```bash
npx shadcn@latest add form checkbox separator alert tabs avatar dropdown-menu dialog
```

| Component | Usage |
|-----------|-------|
| `form` | Form wrapper with validation |
| `checkbox` | Terms acceptance, remember me |
| `separator` | Visual dividers |
| `alert` | Error/success messages |
| `tabs` | Onboarding steps |
| `avatar` | User profile display |
| `dropdown-menu` | User menu |
| `dialog` | MFA setup modal |

---

## 6. Implementation Phases

### Phase 1: Foundation (Files to Create)

```
src/
├── lib/
│   └── auth/
│       ├── types.ts           # Auth types
│       ├── schemas.ts         # Zod validation schemas
│       ├── actions.ts         # Server actions
│       ├── password.ts        # Password strength checker
│       └── constants.ts       # Auth constants
└── types/
    └── database.ts            # Supabase generated types
```

### Phase 2: Shared Components

```
src/components/auth/
├── auth-card.tsx              # Reusable auth page wrapper
├── auth-header.tsx            # Logo + title component
├── password-input.tsx         # Password with strength meter
├── oauth-buttons.tsx          # Social login buttons (future)
├── form-field.tsx             # Reusable form field wrapper
└── form-error.tsx             # Error message display
```

### Phase 3: Auth Layout

```
src/app/(auth)/
├── layout.tsx                 # Split-screen auth layout
└── template.tsx               # Animation wrapper (optional)
```

### Phase 4: Auth Pages

```
src/app/(auth)/
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
├── verify/
│   └── page.tsx
├── reset-password/
│   ├── page.tsx               # Request reset
│   └── confirm/
│       └── page.tsx           # Set new password
└── auth/
    └── callback/
        └── route.ts           # OAuth/email callback handler
```

### Phase 5: Onboarding

```
src/app/(auth)/onboarding/
├── page.tsx                   # Multi-step onboarding
└── _components/
    ├── step-organization.tsx
    ├── step-profile.tsx
    └── step-complete.tsx
```

### Phase 6: Protected Middleware Update

Update `src/middleware.ts` to:
- Redirect unauthenticated users to `/login`
- Redirect authenticated users without org to `/onboarding`
- Allow public routes (landing, auth pages)

---

## 7. Detailed File Specifications

### 7.1 `lib/auth/types.ts`

```typescript
export type AuthState =
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; session: Session }
  | { status: 'loading' };

export interface OnboardingData {
  organization: {
    name: string;
    lei?: string;
    entityType: EntityType;
    jurisdiction: string;
  };
  profile: {
    fullName: string;
    jobTitle?: string;
  };
}

export type EntityType =
  | 'credit_institution'
  | 'investment_firm'
  | 'insurance'
  | 'payment_service'
  | 'crypto_asset_provider'
  | 'other';
```

### 7.2 `lib/auth/schemas.ts`

```typescript
import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  lei: z.string().regex(/^[A-Z0-9]{20}$/, 'Invalid LEI format').optional().or(z.literal('')),
  entityType: z.enum([
    'credit_institution',
    'investment_firm',
    'insurance',
    'payment_service',
    'crypto_asset_provider',
    'other'
  ]),
  jurisdiction: z.string().length(2, 'Use ISO country code'),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  jobTitle: z.string().optional(),
});
```

### 7.3 `lib/auth/actions.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password/confirm`,
    }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/login?message=password-updated');
}

export async function createOrganization(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase.rpc('create_organization_for_user', {
    p_user_id: user.id,
    p_org_name: formData.get('name') as string,
    p_lei: formData.get('lei') as string || null,
    p_entity_type: formData.get('entityType') as string,
    p_jurisdiction: formData.get('jurisdiction') as string,
    p_data_region: 'eu',
  });

  if (error) {
    return { error: error.message };
  }

  // Update user profile
  await supabase
    .from('users')
    .update({
      full_name: formData.get('fullName') as string,
    })
    .eq('id', user.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
```

---

## 8. Route Protection Matrix

| Route | Auth Required | Org Required | Notes |
|-------|--------------|--------------|-------|
| `/` | No | No | Landing page |
| `/login` | No | No | Redirect if logged in |
| `/register` | No | No | Redirect if logged in |
| `/verify` | No | No | Email verification |
| `/reset-password` | No | No | Password reset |
| `/onboarding` | Yes | No | Only without org |
| `/dashboard/**` | Yes | Yes | Protected routes |
| `/api/auth/**` | No | No | Auth callbacks |

---

## 9. Implementation Order

```
Week 1: Foundation
├── Day 1: Manual Supabase setup + Migration
├── Day 2: Install packages + Generate types
├── Day 3: lib/auth/* foundation files
├── Day 4: Auth components
└── Day 5: Auth layout

Week 2: Core Flows
├── Day 1: Register page + email verification
├── Day 2: Login page
├── Day 3: Password reset flow
├── Day 4: Auth callback handler
└── Day 5: Middleware protection

Week 3: Onboarding + Polish
├── Day 1-2: Onboarding flow
├── Day 3: Error handling + edge cases
├── Day 4: Testing all flows
└── Day 5: Bug fixes + refinement
```

---

## 10. Testing Checklist

### Registration Flow
- [ ] Can register with valid email/password
- [ ] Cannot register with weak password
- [ ] Cannot register with existing email
- [ ] Receives confirmation email
- [ ] Email link confirms account
- [ ] Redirects to onboarding after confirm

### Login Flow
- [ ] Can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] Cannot login with unconfirmed email
- [ ] Redirects to dashboard (or onboarding if no org)
- [ ] Session persists across page refresh

### Password Reset Flow
- [ ] Can request reset for existing email
- [ ] Receives reset email
- [ ] Reset link works
- [ ] Can set new password
- [ ] Old password no longer works

### Onboarding Flow
- [ ] Can create organization
- [ ] LEI validation works (optional field)
- [ ] Profile saved correctly
- [ ] Redirects to dashboard after complete

### Protected Routes
- [ ] Unauthenticated users redirected to login
- [ ] Users without org redirected to onboarding
- [ ] Authenticated users with org can access dashboard

---

## 11. Security Considerations

1. **CSRF Protection**: Handled by Supabase PKCE flow
2. **XSS Prevention**: React escapes by default, CSP headers
3. **Password Storage**: Handled by Supabase (bcrypt)
4. **Rate Limiting**: Configure in Supabase dashboard
5. **Session Security**: httpOnly cookies, secure flag in production
6. **HTTPS**: Enforced in production via Vercel

---

## 12. Environment Variables Required

```env
# Already configured
NEXT_PUBLIC_SUPABASE_URL_EU=...
NEXT_PUBLIC_SUPABASE_ANON_KEY_EU=...

# Need to add
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Next Steps

1. **Manual Setup**: Complete Supabase dashboard configuration (Section 2)
2. **Apply Migration**: Run the auth trigger migration (Section 3)
3. **Install Packages**: npm install required packages (Section 4)
4. **Add Components**: shadcn/ui components (Section 5)
5. **Begin Implementation**: Start with Phase 1 foundation files
