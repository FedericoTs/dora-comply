import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MFAVerifyForm } from './mfa-verify-form';

export const metadata = {
  title: 'Verify MFA - DORA Comply',
  description: 'Enter your two-factor authentication code',
};

export default async function MFAVerifyPage() {
  const supabase = await createClient();

  // Check if user has a session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Get AAL info
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // If already at AAL2, redirect to dashboard
  if (aal?.currentLevel === 'aal2') {
    redirect('/dashboard');
  }

  // If no MFA enrolled (nextLevel is aal1), redirect to dashboard
  if (aal?.nextLevel === 'aal1') {
    redirect('/dashboard');
  }

  // Get the first verified TOTP factor
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedFactor = factors?.totp?.find((f) => f.status === 'verified');

  if (!verifiedFactor) {
    // No verified factor, but was required - something is wrong
    redirect('/dashboard');
  }

  return <MFAVerifyForm factorId={verifiedFactor.id} />;
}
