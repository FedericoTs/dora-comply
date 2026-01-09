'use client';

/**
 * MFA Setup Dialog
 *
 * Multi-step dialog for enrolling TOTP-based MFA:
 * 1. Show QR code and secret
 * 2. Verify with code from authenticator
 * 3. Show recovery information
 */

import { useState } from 'react';
import { Loader2, ArrowRight, ArrowLeft, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { MFAQRCode } from '@/components/auth/mfa-qr-code';
import { MFACodeInput } from '@/components/auth/mfa-code-input';
import { MFARecoveryInfo } from '@/components/auth/mfa-recovery-info';
import { enrollTOTP, verifyTOTPEnrollment, unenrollFactor } from '@/lib/auth/mfa-actions';
import type { MFAEnrollment } from '@/lib/auth/types';

type SetupStep = 'qr' | 'verify' | 'recovery';

interface MFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function MFASetupDialog({ open, onOpenChange, onComplete }: MFASetupDialogProps) {
  const [step, setStep] = useState<SetupStep>('qr');
  const [enrollment, setEnrollment] = useState<MFAEnrollment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);

  // Start enrollment when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && !enrollment) {
      await startEnrollment();
    } else if (!isOpen) {
      // Clean up if dialog is closed without completing
      if (enrollment && step !== 'recovery') {
        // Unenroll the unverified factor
        await unenrollFactor(enrollment.id);
      }
      resetState();
    }
    onOpenChange(isOpen);
  };

  // Reset state
  const resetState = () => {
    setStep('qr');
    setEnrollment(null);
    setCode('');
    setCodeError(false);
    setRecoveryConfirmed(false);
  };

  // Start TOTP enrollment
  const startEnrollment = async () => {
    setIsLoading(true);
    try {
      const result = await enrollTOTP();

      if (result.success && result.data) {
        setEnrollment(result.data);
      } else {
        toast.error(result.error?.message || 'Failed to start MFA setup');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to start MFA setup');
      onOpenChange(false);
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

  // Complete setup
  const handleComplete = () => {
    resetState();
    onComplete();
  };

  // Render step content
  const renderStepContent = () => {
    if (isLoading && !enrollment) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Generating your secure key...</p>
        </div>
      );
    }

    switch (step) {
      case 'qr':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Set Up Authenticator App
              </DialogTitle>
              <DialogDescription>
                Scan the QR code below with your authenticator app
                (Google Authenticator, 1Password, Authy, etc.)
              </DialogDescription>
            </DialogHeader>

            {enrollment && (
              <MFAQRCode
                qrCode={enrollment.totp.qr_code}
                secret={enrollment.totp.secret}
              />
            )}

            <div className="flex justify-end">
              <Button onClick={() => setStep('verify')}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Verify Your Authenticator</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app to confirm setup
              </DialogDescription>
            </DialogHeader>

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
          </div>
        );

      case 'recovery':
        return (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Two-Factor Authentication Enabled
              </DialogTitle>
              <DialogDescription>
                Your account is now protected with two-factor authentication.
                Save your recovery information below.
              </DialogDescription>
            </DialogHeader>

            {enrollment && (
              <MFARecoveryInfo
                secret={enrollment.totp.secret}
                confirmed={recoveryConfirmed}
                onConfirm={setRecoveryConfirmed}
              />
            )}

            <div className="flex justify-end">
              <Button onClick={handleComplete} disabled={!recoveryConfirmed}>
                <Check className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        );
    }
  };

  // Step indicators
  const steps = [
    { key: 'qr', label: 'Scan QR Code' },
    { key: 'verify', label: 'Verify Code' },
    { key: 'recovery', label: 'Save Recovery' },
  ] as const;

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {steps.map((s, index) => (
            <div key={s.key} className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
