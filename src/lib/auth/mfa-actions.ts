'use server';

/**
 * MFA Server Actions
 * Server-side actions for Multi-Factor Authentication operations
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ActionResult,
  AuthError,
  AuthErrorCode,
  MFAFactor,
  MFAEnrollment,
  AuthenticatorAssuranceLevel,
  MFAChallengeResult,
} from './types';

// ============================================================================
// Helper Functions
// ============================================================================

function createAuthError(code: AuthErrorCode, message: string): AuthError {
  return { code, message };
}

function mapMFAError(error: { message: string; status?: number }): AuthError {
  const message = error.message.toLowerCase();

  if (message.includes('invalid') || message.includes('incorrect')) {
    return createAuthError('MFA_INVALID', 'Invalid verification code. Please try again.');
  }
  if (message.includes('expired')) {
    return createAuthError('INVALID_TOKEN', 'The verification code has expired. Please try again.');
  }
  if (message.includes('rate limit')) {
    return createAuthError('RATE_LIMITED', 'Too many attempts. Please wait before trying again.');
  }
  if (message.includes('not found')) {
    return createAuthError('UNKNOWN_ERROR', 'MFA factor not found.');
  }

  return createAuthError('UNKNOWN_ERROR', error.message);
}

// ============================================================================
// Get MFA Factors
// ============================================================================

/**
 * List all enrolled MFA factors for the current user
 */
export async function getMFAFactors(): Promise<ActionResult<{ totp: MFAFactor[]; phone: MFAFactor[] }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.mfa.listFactors();

  if (error) {
    return {
      success: false,
      error: mapMFAError(error),
    };
  }

  // Map Supabase factor format to our MFAFactor type
  const mapFactor = (factor: {
    id: string;
    friendly_name?: string;
    factor_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    last_challenged_at?: string;
  }): MFAFactor => ({
    id: factor.id,
    type: factor.factor_type as MFAFactor['type'],
    status: factor.status as MFAFactor['status'],
    friendly_name: factor.friendly_name,
    created_at: factor.created_at,
    updated_at: factor.updated_at,
    last_challenged_at: factor.last_challenged_at,
  });

  return {
    success: true,
    data: {
      totp: data.totp.map(mapFactor),
      phone: data.phone.map(mapFactor),
    },
  };
}

// ============================================================================
// Enroll TOTP
// ============================================================================

/**
 * Start TOTP enrollment - returns QR code and secret
 */
export async function enrollTOTP(friendlyName?: string): Promise<ActionResult<MFAEnrollment>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: friendlyName || 'Authenticator App',
  });

  if (error) {
    return {
      success: false,
      error: mapMFAError(error),
    };
  }

  return {
    success: true,
    data: {
      id: data.id,
      type: data.type as 'totp',
      totp: {
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      },
    },
  };
}

// ============================================================================
// Verify TOTP Enrollment
// ============================================================================

/**
 * Complete TOTP enrollment by verifying a code from the authenticator app
 */
export async function verifyTOTPEnrollment(
  factorId: string,
  code: string
): Promise<ActionResult<{ verified: boolean }>> {
  const supabase = await createClient();

  // First, create a challenge
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });

  if (challengeError) {
    return {
      success: false,
      error: mapMFAError(challengeError),
    };
  }

  // Then verify the code
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    return {
      success: false,
      error: mapMFAError(verifyError),
    };
  }

  return {
    success: true,
    data: { verified: true },
  };
}

// ============================================================================
// Unenroll Factor
// ============================================================================

/**
 * Remove an enrolled MFA factor
 */
export async function unenrollFactor(factorId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    return {
      success: false,
      error: mapMFAError(error),
    };
  }

  return { success: true };
}

// ============================================================================
// Create MFA Challenge
// ============================================================================

/**
 * Create a new MFA challenge for an enrolled factor
 */
export async function createMFAChallenge(factorId: string): Promise<ActionResult<MFAChallengeResult>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.mfa.challenge({
    factorId,
  });

  if (error) {
    return {
      success: false,
      error: mapMFAError(error),
    };
  }

  return {
    success: true,
    data: {
      id: data.id,
      factorId: factorId,
      expiresAt: data.expires_at,
    },
  };
}

// ============================================================================
// Verify MFA Challenge
// ============================================================================

/**
 * Verify an MFA challenge with a code from the authenticator app
 */
export async function verifyMFAChallenge(
  factorId: string,
  challengeId: string,
  code: string
): Promise<ActionResult<{ verified: boolean }>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) {
    return {
      success: false,
      error: mapMFAError(error),
    };
  }

  return {
    success: true,
    data: { verified: true },
  };
}

// ============================================================================
// Get Authenticator Assurance Level
// ============================================================================

/**
 * Get the current and next required Authenticator Assurance Level
 */
export async function getAuthenticatorAssuranceLevel(): Promise<ActionResult<AuthenticatorAssuranceLevel>> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    return {
      success: false,
      error: mapMFAError(error),
    };
  }

  return {
    success: true,
    data: {
      currentLevel: data.currentLevel,
      nextLevel: data.nextLevel,
      currentAuthenticationMethods: data.currentAuthenticationMethods,
    },
  };
}

// ============================================================================
// Check MFA Required
// ============================================================================

/**
 * Check if the current user needs to complete MFA verification
 * Returns true if user has MFA enrolled but hasn't verified this session
 */
export async function checkMFARequired(): Promise<ActionResult<{ mfaRequired: boolean; factorId?: string }>> {
  const supabase = await createClient();

  // Get AAL info
  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    return {
      success: false,
      error: mapMFAError(aalError),
    };
  }

  // If nextLevel is aal2 but currentLevel is not aal2, MFA is required
  const mfaRequired = aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2';

  if (!mfaRequired) {
    return {
      success: true,
      data: { mfaRequired: false },
    };
  }

  // Get the factor to challenge
  const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

  if (factorsError) {
    return {
      success: false,
      error: mapMFAError(factorsError),
    };
  }

  // Find the first verified TOTP factor
  const verifiedFactor = factorsData.totp.find((f) => f.status === 'verified');

  return {
    success: true,
    data: {
      mfaRequired: true,
      factorId: verifiedFactor?.id,
    },
  };
}
