'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard } from '@/components/auth/auth-card';
import { MFACodeInput } from '@/components/auth/mfa-code-input';
import { createMFAChallenge, verifyMFAChallenge } from '@/lib/auth/mfa-actions';

interface MFAVerifyFormProps {
  factorId: string;
}

export function MFAVerifyForm({ factorId }: MFAVerifyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify(verifyCode?: string) {
    const codeToVerify = verifyCode || code;
    if (codeToVerify.length !== 6) return;

    setError(null);
    setIsLoading(true);

    try {
      // Create a challenge
      const challengeResult = await createMFAChallenge(factorId);

      if (!challengeResult.success || !challengeResult.data) {
        setError(challengeResult.error?.message || 'Failed to create challenge');
        return;
      }

      // Verify the challenge
      const verifyResult = await verifyMFAChallenge(
        factorId,
        challengeResult.data.id,
        codeToVerify
      );

      if (!verifyResult.success) {
        setError(verifyResult.error?.message || 'Invalid verification code');
        setCode('');
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('MFA verification error:', err);
      setError('An unexpected error occurred. Please try again.');
      setCode('');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthCard
      title="Two-Factor Authentication"
      description="Enter the 6-digit code from your authenticator app"
      footer={
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to login
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Code Input */}
        <MFACodeInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setError(null);
          }}
          onComplete={(completeCode) => handleVerify(completeCode)}
          error={!!error}
          disabled={isLoading}
          autoFocus
        />

        {/* Verify Button */}
        <Button
          className="w-full"
          onClick={() => handleVerify()}
          disabled={code.length !== 6 || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Open your authenticator app to view your verification code
        </p>
      </div>
    </AuthCard>
  );
}
