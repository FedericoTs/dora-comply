import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Request Access | DORA Comply',
  description: 'Request access to DORA Comply',
};

export default async function RegisterPage() {
  const { isAuthenticated, needsOnboarding } = await checkAuthStatus();

  if (isAuthenticated) {
    redirect(needsOnboarding ? '/onboarding' : '/dashboard');
  }

  // Public registration is disabled - redirect to contact page
  redirect('/contact?source=register');
}
