import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth';
import { OnboardingForm } from './onboarding-form';

export const metadata: Metadata = {
  title: 'Complete Setup | DORA Comply',
  description: 'Set up your organization to get started',
};

export default async function OnboardingPage() {
  const { isAuthenticated, needsOnboarding } = await checkAuthStatus();

  if (!isAuthenticated) {
    redirect('/login');
  }

  if (!needsOnboarding) {
    redirect('/dashboard');
  }

  return <OnboardingForm />;
}
