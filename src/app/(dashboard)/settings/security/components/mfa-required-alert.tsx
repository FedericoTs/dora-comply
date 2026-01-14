'use client';

/**
 * MFA Required Alert Component
 *
 * Warning shown when user role requires MFA but none is enabled
 */

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { UserRole } from '@/lib/auth/types';

interface MFARequiredAlertProps {
  userRole: UserRole;
}

export function MFARequiredAlert({ userRole }: MFARequiredAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Two-Factor Authentication Required</AlertTitle>
      <AlertDescription>
        As an {userRole}, you are required to enable two-factor authentication
        for enhanced account security. Please set it up below.
      </AlertDescription>
    </Alert>
  );
}
