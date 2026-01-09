'use client';

import * as React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MFARecoveryInfoProps {
  secret: string;
  onConfirm: (confirmed: boolean) => void;
  confirmed: boolean;
  className?: string;
}

export function MFARecoveryInfo({
  secret,
  onConfirm,
  confirmed,
  className,
}: MFARecoveryInfoProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <Alert variant="destructive" className="border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Save Your Recovery Information</AlertTitle>
        <AlertDescription className="text-sm">
          If you lose access to your authenticator app, you&apos;ll need this secret key to
          recover your account. Store it in a safe place.
        </AlertDescription>
      </Alert>

      {/* Secret Key Display */}
      <div className="p-4 bg-muted rounded-lg border space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Your Recovery Secret Key
        </div>
        <code className="block font-mono text-sm bg-background p-3 rounded border break-all">
          {secret}
        </code>
        <p className="text-xs text-muted-foreground">
          You can use this key to re-add the authenticator in a new device.
        </p>
      </div>

      {/* Tips */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p className="font-medium">Recommended storage methods:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Password manager (1Password, Bitwarden, etc.)</li>
          <li>Secure physical document in a safe location</li>
          <li>Encrypted digital backup</li>
        </ul>
      </div>

      {/* Confirmation */}
      <div className="flex items-start gap-3 pt-2">
        <Checkbox
          id="backup-confirmed"
          checked={confirmed}
          onCheckedChange={(checked) => onConfirm(checked === true)}
        />
        <Label
          htmlFor="backup-confirmed"
          className="text-sm leading-relaxed cursor-pointer"
        >
          I have saved my recovery secret key in a secure location and understand
          that I&apos;ll need it if I lose access to my authenticator app.
        </Label>
      </div>
    </div>
  );
}
