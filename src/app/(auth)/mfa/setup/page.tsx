import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MFASetupFlow } from './mfa-setup-flow';

export const metadata = {
  title: 'Set Up Two-Factor Authentication - DORA Comply',
  description: 'Enable two-factor authentication to secure your account',
};

interface MFASetupPageProps {
  searchParams: Promise<{ required?: string }>;
}

export default async function MFASetupPage({ searchParams }: MFASetupPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Check if user has a session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?error=session_required&message=Please+log+in+to+continue');
  }

  // Check if MFA is already enrolled
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // If already at AAL2, redirect to dashboard
  if (aal?.currentLevel === 'aal2') {
    redirect('/dashboard');
  }

  // Check if user already has a verified factor
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = factors?.totp?.some((f) => f.status === 'verified');

  if (hasVerifiedFactor) {
    // Already has MFA, redirect to verify instead
    redirect('/mfa/verify');
  }

  // Get user role to check if MFA is required
  const { data: userData } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', session.user.id)
    .single();

  const isRequired = params.required === 'true';
  const isAdminOrOwner = ['admin', 'owner'].includes(userData?.role || '');

  return (
    <MFASetupFlow
      required={isRequired && isAdminOrOwner}
      userName={userData?.full_name || userData?.email || 'User'}
    />
  );
}
