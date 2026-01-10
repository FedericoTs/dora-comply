import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth';
import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Create Account | DORA Comply',
  description: 'Create your DORA Comply account to start your compliance journey',
};

export default async function RegisterPage() {
  const { isAuthenticated, needsOnboarding } = await checkAuthStatus();

  if (isAuthenticated) {
    redirect(needsOnboarding ? '/onboarding' : '/dashboard');
  }

  return <RegisterForm />;
}
