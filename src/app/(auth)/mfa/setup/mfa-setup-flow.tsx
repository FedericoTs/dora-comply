'use client';

/**
 * MFA Setup Flow
 *
 * Standalone page for enrolling TOTP-based MFA.
 * Used when admin/owner users log in without MFA configured.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, ArrowLeft, Check, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { MFAQRCode } from '@/components/auth/mfa-qr-code';
import { MFACodeInput } from '@/components/auth/mfa-code-input';
import { MFARecoveryInfo } from '@/components/auth/mfa-recovery-info';
import { enrollTOTP, verifyTOTPEnrollment, unenrollFactor } from '@/lib/auth/mfa-actions';
import type { MFAEnrollment } from '@/lib/auth/types';

type SetupStep = 'intro' | 'qr' | 'verify' | 'recovery';

interface MFASetupFlowProps {
  required: boolean;
  userName: string;
}

export function MFASetupFlow({ required, userName }: MFASetupFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>('intro');
  const [enrollment, setEnrollment] = useState<MFAEnrollment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);

  // Clean up on unmount if setup not completed
  useEffect(() => {
    return () => {
      if (enrollment && step !== 'recovery') {
        unenrollFactor(enrollment.id).catch(() => {});
      }
    };
  }, [enrollment, step]);

  // Start TOTP enrollment
  const startEnrollment = async () => {
    setIsLoading(true);
    try {
      const result = await enrollTOTP();

      if (result.success && result.data) {
        setEnrollment(result.data);
        setStep('qr');
      } else {
        toast.error(result.error?.message || 'Failed to start MFA setup');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to start MFA setup');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the code
  const handleVerify = async () => {
    if (!enrollment || code.length !== 6) return;

    setIsLoading(true);
    setCodeError(false);

    try {
      const result = await verifyTOTPEnrollment(enrollment.id, code);

      if (result.success) {
        setStep('recovery');
        toast.success('Two-factor authentication enabled!');
      } else {
        setCodeError(true);
        setCode('');
        toast.error(result.error?.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setCodeError(true);
      setCode('');
      toast.error('Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete setup and redirect to dashboard
  const handleComplete = () => {
    router.push('/dashboard');
    router.refresh();
  };

  // Skip setup (only if not required)
  const handleSkip = () => {
    if (enrollment) {
      unenrollFactor(enrollment.id).catch(() => {});
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === 'intro' && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Secure Your Account</CardTitle>
              <CardDescription>
                {required ? (
                  <>Hi {userName}, as an administrator, you&apos;re required to enable two-factor authentication.</>
                ) : (
                  <>Add an extra layer of security to your account with two-factor authentication.</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {required && (
                <Alert variant="default" className="border-primary/50 bg-primary/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Required for Administrators</AlertTitle>
                  <AlertDescription>
                    DORA compliance requires enhanced security measures for privileged accounts.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    1
                  </div>
                  <p>Install an authenticator app on your phone (Google Authenticator, Authy, 1Password)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    2
                  </div>
                  <p>Scan the QR code with your app</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    3
                  </div>
                  <p>Enter the verification code to confirm</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={startEnrollment} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                {!required && (
                  <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                    Skip for now
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        )}

        {step === 'qr' && enrollment && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Open your authenticator app and scan the QR code below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MFAQRCode
                qrCode={enrollment.totp.qr_code}
                secret={enrollment.totp.secret}
              />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => {
                    unenrollFactor(enrollment.id).catch(() => {});
                    setEnrollment(null);
                    setStep('intro');
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={() => setStep('verify')}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'verify' && (
          <>
            <CardHeader>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <MFACodeInput
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setCodeError(false);
                  }}
                  onComplete={handleVerify}
                  error={codeError}
                  disabled={isLoading}
                  autoFocus
                />

                {codeError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      The code you entered is incorrect. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('qr')} disabled={isLoading}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleVerify} disabled={code.length !== 6 || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'recovery' && enrollment && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                MFA Enabled Successfully
              </CardTitle>
              <CardDescription>
                Your account is now protected with two-factor authentication.
                Save your recovery information below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <MFARecoveryInfo
                secret={enrollment.totp.secret}
                confirmed={recoveryConfirmed}
                onConfirm={setRecoveryConfirmed}
              />

              <Button onClick={handleComplete} disabled={!recoveryConfirmed} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Continue to Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {/* Step indicator */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center gap-2">
            {['intro', 'qr', 'verify', 'recovery'].map((s, index) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  ['intro', 'qr', 'verify', 'recovery'].indexOf(step) >= index
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
