import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | DORA Comply',
  description: 'Sign in to your DORA Comply account',
};

export default async function LoginPage() {
  const { isAuthenticated, needsOnboarding } = await checkAuthStatus();

  if (isAuthenticated) {
    redirect(needsOnboarding ? '/onboarding' : '/dashboard');
  }

  return <LoginForm />;
}
