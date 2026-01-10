import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth';
import { VerifyContent } from './verify-content';

export const metadata: Metadata = {
  title: 'Verify Email | DORA Comply',
  description: 'Check your email to verify your account',
};

interface VerifyPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  // If user is already authenticated and has completed onboarding,
  // they don't need to verify - redirect to dashboard
  const { isAuthenticated, needsOnboarding } = await checkAuthStatus();

  if (isAuthenticated && !needsOnboarding) {
    redirect('/dashboard');
  }

  // If authenticated but needs onboarding, redirect there
  if (isAuthenticated && needsOnboarding) {
    redirect('/onboarding');
  }

  const params = await searchParams;
  return <VerifyContent email={params.email} />;
}
