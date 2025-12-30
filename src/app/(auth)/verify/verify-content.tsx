'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard } from '@/components/auth';
import { resendVerificationEmail } from '@/lib/auth';

interface VerifyContentProps {
  email?: string;
}

export function VerifyContent({ email }: VerifyContentProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    if (!email) return;

    setIsResending(true);
    setResendStatus('idle');
    setError(null);

    try {
      const result = await resendVerificationEmail(email);

      if (result.success) {
        setResendStatus('success');
      } else {
        setResendStatus('error');
        setError(result.error?.message || 'Failed to resend email');
      }
    } catch {
      setResendStatus('error');
      setError('An unexpected error occurred');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthCard
      title="Check your email"
      description="We've sent you a verification link"
      footer={
        <p>
          Wrong email?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Go back
          </Link>
        </p>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to:
          </p>
          {email && (
            <p className="font-medium">{email}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Click the link in the email to verify your account and continue.
          </p>
        </div>

        {resendStatus === 'success' && (
          <Alert>
            <AlertDescription>
              Verification email sent! Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        {resendStatus === 'error' && error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending || !email}
          >
            {isResending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Resend verification email
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try a different email address.
          </p>
        </div>
      </div>
    </AuthCard>
  );
}
