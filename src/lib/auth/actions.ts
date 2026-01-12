'use server';

/**
 * Auth Server Actions
 * Server-side actions for authentication operations
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  newPasswordSchema,
  onboardingSchema,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type NewPasswordInput,
  type OnboardingInput,
} from './schemas';
import type { ActionResult, AuthError, AuthErrorCode, User } from './types';
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  logAuthEvent,
  requiresMFA,
} from './audit';

// ============================================================================
// Helper Functions
// ============================================================================

function createAuthError(code: AuthErrorCode, message: string): AuthError {
  return { code, message };
}

function mapSupabaseError(error: { message: string; status?: number }): AuthError {
  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return createAuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (message.includes('email not confirmed')) {
    return createAuthError('EMAIL_NOT_VERIFIED', 'Please verify your email before signing in');
  }
  if (message.includes('user already registered')) {
    return createAuthError('EMAIL_EXISTS', 'An account with this email already exists');
  }
  if (message.includes('rate limit')) {
    return createAuthError('RATE_LIMITED', 'Too many attempts. Please try again later');
  }
  if (message.includes('invalid token') || message.includes('expired')) {
    return createAuthError('INVALID_TOKEN', 'This link has expired. Please request a new one');
  }
  if (message.includes('session')) {
    return createAuthError('SESSION_EXPIRED', 'Your session has expired. Please sign in again');
  }

  return createAuthError('UNKNOWN_ERROR', error.message);
}

// ============================================================================
// Login Action
// ============================================================================

export async function login(formData: LoginInput): Promise<ActionResult<{ redirectTo: string }>> {
  // Validate input
  const result = loginSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      error: createAuthError('INVALID_CREDENTIALS', result.error.issues[0].message),
    };
  }

  const email = result.data.email;

  // Check rate limiting BEFORE attempting login
  const rateLimit = await checkLoginRateLimit(email);
  if (rateLimit.isLimited) {
    await logAuthEvent({
      eventType: 'login_failed',
      result: 'blocked',
      failureReason: 'Rate limited',
      metadata: { email, lockedUntil: rateLimit.lockedUntil?.toISOString() },
    });

    const minutesRemaining = rateLimit.lockedUntil
      ? Math.ceil((rateLimit.lockedUntil.getTime() - Date.now()) / 60000)
      : 15;

    return {
      success: false,
      error: createAuthError(
        'RATE_LIMITED',
        `Too many login attempts. Please try again in ${minutesRemaining} minutes.`
      ),
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: result.data.password,
  });

  if (error) {
    // Record failed attempt for rate limiting
    await recordLoginAttempt(email, false, error.message);

    // Log failed login
    await logAuthEvent({
      eventType: 'login_failed',
      result: 'failure',
      failureReason: error.message,
      metadata: { email },
    });

    return {
      success: false,
      error: mapSupabaseError(error),
    };
  }

  // Record successful attempt
  await recordLoginAttempt(email, true);

  // Get user role to check MFA requirements
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', data.user.id)
    .single();

  // Check if MFA is required for this role (admin/owner MUST have MFA)
  const userRole = userData?.role || 'viewer';
  const mfaRequired = await requiresMFA(userRole);

  // Check current MFA status
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const hasMFAEnrolled = aal?.nextLevel === 'aal2';
  const mfaVerified = aal?.currentLevel === 'aal2';

  // If MFA is enrolled but not yet verified for this session, redirect to verify
  if (hasMFAEnrolled && !mfaVerified) {
    await logAuthEvent({
      userId: data.user.id,
      organizationId: userData?.organization_id,
      eventType: 'login_success',
      result: 'success',
      metadata: { email, mfaPending: true },
    });

    return {
      success: true,
      data: {
        redirectTo: '/mfa/verify',
      },
    };
  }

  // If MFA is required but NOT enrolled, redirect to setup
  if (mfaRequired && !hasMFAEnrolled) {
    await logAuthEvent({
      userId: data.user.id,
      organizationId: userData?.organization_id,
      eventType: 'login_success',
      result: 'success',
      metadata: { email, mfaSetupRequired: true, role: userRole },
    });

    return {
      success: true,
      data: {
        redirectTo: '/mfa/setup?required=true',
      },
    };
  }

  // Log successful login
  await logAuthEvent({
    userId: data.user.id,
    organizationId: userData?.organization_id,
    eventType: 'login_success',
    result: 'success',
    metadata: { email },
  });

  const needsOnboarding = !userData?.organization_id;

  revalidatePath('/', 'layout');

  return {
    success: true,
    data: {
      redirectTo: needsOnboarding ? '/onboarding' : '/dashboard',
    },
  };
}

// ============================================================================
// Register Action
// ============================================================================

export async function register(formData: RegisterInput): Promise<ActionResult<{ requiresVerification: boolean }>> {
  // Validate input
  const result = registerSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      error: createAuthError('UNKNOWN_ERROR', result.error.issues[0].message),
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: result.data.fullName,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: mapSupabaseError(error),
    };
  }

  return {
    success: true,
    data: {
      requiresVerification: true,
    },
  };
}

// ============================================================================
// Logout Action
// ============================================================================

export async function logout(): Promise<void> {
  const supabase = await createClient();

  // Get user info before logging out for audit
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    await logAuthEvent({
      userId: user.id,
      organizationId: userData?.organization_id,
      eventType: 'logout',
      result: 'success',
    });
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ============================================================================
// Reset Password Action
// ============================================================================

export async function resetPassword(formData: ResetPasswordInput): Promise<ActionResult> {
  // Validate input
  const result = resetPasswordSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      error: createAuthError('UNKNOWN_ERROR', result.error.issues[0].message),
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password/confirm`,
  });

  if (error) {
    return {
      success: false,
      error: mapSupabaseError(error),
    };
  }

  return { success: true };
}

// ============================================================================
// Update Password Action
// ============================================================================

export async function updatePassword(formData: NewPasswordInput): Promise<ActionResult> {
  // Validate input
  const result = newPasswordSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      error: createAuthError('WEAK_PASSWORD', result.error.issues[0].message),
    };
  }

  const supabase = await createClient();

  // Get user info for audit
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    if (user) {
      await logAuthEvent({
        userId: user.id,
        eventType: 'password_change',
        result: 'failure',
        failureReason: error.message,
      });
    }
    return {
      success: false,
      error: mapSupabaseError(error),
    };
  }

  // Log successful password change
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    await logAuthEvent({
      userId: user.id,
      organizationId: userData?.organization_id,
      eventType: 'password_change',
      result: 'success',
    });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

// ============================================================================
// Resend Verification Email Action
// ============================================================================

export async function resendVerificationEmail(email: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: mapSupabaseError(error),
    };
  }

  return { success: true };
}

// ============================================================================
// Complete Onboarding Action
// ============================================================================

export async function completeOnboarding(formData: OnboardingInput): Promise<ActionResult> {
  // Validate input
  const result = onboardingSchema.safeParse(formData);
  if (!result.success) {
    return {
      success: false,
      error: createAuthError('UNKNOWN_ERROR', result.error.issues[0].message),
    };
  }

  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: createAuthError('SESSION_EXPIRED', 'Please sign in again'),
    };
  }

  // Create organization using the stored function
  const { data: orgId, error: orgError } = await supabase.rpc('create_organization_for_user', {
    p_user_id: user.id,
    p_org_name: result.data.organizationName,
    p_lei: result.data.lei || null,
    p_entity_type: result.data.entityType,
    p_jurisdiction: result.data.jurisdiction,
    p_data_region: 'eu',
  });

  if (orgError) {
    console.error('Onboarding error:', orgError);
    return {
      success: false,
      error: createAuthError('UNKNOWN_ERROR', 'Failed to create organization'),
    };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

// ============================================================================
// Get Current User Action
// ============================================================================

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userData) {
    return null;
  }

  return {
    id: userData.id,
    email: userData.email,
    fullName: userData.full_name,
    avatarUrl: userData.avatar_url,
    role: userData.role,
    organizationId: userData.organization_id,
    createdAt: userData.created_at,
    updatedAt: userData.updated_at,
  };
}

// ============================================================================
// Check Auth Status Action
// ============================================================================

export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  user: User | null;
}> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        isAuthenticated: false,
        needsOnboarding: false,
        user: null,
      };
    }

    return {
      isAuthenticated: true,
      needsOnboarding: !user.organizationId,
      user,
    };
  } catch (error) {
    // If Supabase isn't configured or there's an error, treat as unauthenticated
    console.error('Auth check failed:', error);
    return {
      isAuthenticated: false,
      needsOnboarding: false,
      user: null,
    };
  }
}
