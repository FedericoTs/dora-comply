import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { checkAuthStatus } from '@/lib/auth';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign In | DORA Comply',
  description: 'Sign in to your DORA Comply account',
};

// Map error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  session_required: 'Please log in to continue.',
  auth_callback_error: 'Authentication failed. Please try again.',
  session_expired: 'Your session has expired. Please log in again.',
  unauthorized: 'You are not authorized to access that page.',
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { isAuthenticated, needsOnboarding } = await checkAuthStatus();

  if (isAuthenticated) {
    redirect(needsOnboarding ? '/onboarding' : '/dashboard');
  }

  const params = await searchParams;
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] || params.message?.replace(/\+/g, ' ') || 'An error occurred.'
    : undefined;

  return <LoginForm initialError={errorMessage} />;
}
