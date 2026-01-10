import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MFAVerifyForm } from './mfa-verify-form';
import { MFAErrorState } from './mfa-error-state';

export const metadata = {
  title: 'Verify MFA - DORA Comply',
  description: 'Enter your two-factor authentication code',
};

export default async function MFAVerifyPage() {
  const supabase = await createClient();

  // Check if user has a session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login with a message
    redirect('/login?error=session_required&message=Please+log+in+to+continue');
  }

  // Get AAL info
  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalError) {
    return (
      <MFAErrorState
        title="Authentication Error"
        message="Unable to verify your authentication status. Please try logging in again."
        actionLabel="Back to Login"
        actionHref="/login"
      />
    );
  }

  // If already at AAL2, redirect to dashboard
  if (aal?.currentLevel === 'aal2') {
    redirect('/dashboard');
  }

  // If no MFA enrolled (nextLevel is aal1), redirect to dashboard
  if (aal?.nextLevel === 'aal1') {
    redirect('/dashboard');
  }

  // Get the first verified TOTP factor
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

  if (factorsError) {
    return (
      <MFAErrorState
        title="MFA Error"
        message="Unable to retrieve your MFA settings. Please try again."
        actionLabel="Try Again"
        actionHref="/mfa/verify"
      />
    );
  }

  const verifiedFactor = factors?.totp?.find((f) => f.status === 'verified');

  if (!verifiedFactor) {
    // No verified factor but MFA was required - redirect to setup
    return (
      <MFAErrorState
        title="MFA Not Configured"
        message="Two-factor authentication is required but not set up. Please configure MFA to continue."
        actionLabel="Set Up MFA"
        actionHref="/settings/security"
      />
    );
  }

  return <MFAVerifyForm factorId={verifiedFactor.id} />;
}
