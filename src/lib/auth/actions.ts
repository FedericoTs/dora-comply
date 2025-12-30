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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      success: false,
      error: mapSupabaseError(error),
    };
  }

  // Check if user has completed onboarding (has organization)
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', data.user.id)
    .single();

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

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return {
      success: false,
      error: mapSupabaseError(error),
    };
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
}
