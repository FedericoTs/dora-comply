'use client';

/**
 * Security Settings Page
 *
 * Manage MFA enrollment, view enrolled factors, and security settings.
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { MFASetupDialog } from './mfa-setup-dialog';
import { useMFAData, useSessionsData } from './hooks';
import {
  MFARequiredAlert,
  MFACard,
  ActiveSessionsCard,
  SecurityLogCard,
  ApiKeysCard,
  DeleteFactorDialog,
  MFA_REQUIRED_ROLES,
} from './components';
import type { MFAFactor } from '@/lib/auth/types';

export default function SecuritySettingsPage() {
  const {
    isLoading,
    factors,
    aalInfo,
    userRole,
    loadMFAData,
    hasMFA,
  } = useMFAData();

  const {
    sessions,
    sessionsLoading,
    revokingSessionId,
    revokingAll,
    otherSessions,
    handleRevokeSession,
    handleRevokeAllOther,
  } = useSessionsData();

  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<MFAFactor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const mfaRequired = userRole && MFA_REQUIRED_ROLES.includes(userRole);

  const handleSetupComplete = () => {
    setShowSetupDialog(false);
    loadMFAData();
    toast.success('Two-factor authentication enabled');
  };

  const handleDeleteFactor = async () => {
    if (!factorToDelete) return;

    setIsDeleting(true);
    try {
      const { unenrollFactor } = await import('@/lib/auth/mfa-actions');
      const result = await unenrollFactor(factorToDelete.id);

      if (result.success) {
        toast.success('Authenticator removed');
        loadMFAData();
      } else {
        toast.error(result.error?.message || 'Failed to remove authenticator');
      }
    } catch (error) {
      console.error('Failed to remove factor:', error);
      toast.error('Failed to remove authenticator');
    } finally {
      setIsDeleting(false);
      setFactorToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-medium">Security</h2>
        <p className="text-sm text-muted-foreground">
          Manage two-factor authentication and security settings
        </p>
      </div>

      {/* MFA Required Warning */}
      {mfaRequired && !hasMFA && userRole && (
        <MFARequiredAlert userRole={userRole} />
      )}

      {/* Two-Factor Authentication */}
      <MFACard
        factors={factors}
        aalInfo={aalInfo}
        hasMFA={hasMFA}
        onSetupClick={() => setShowSetupDialog(true)}
        onDeleteClick={setFactorToDelete}
      />

      {/* Active Sessions */}
      <ActiveSessionsCard
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        revokingSessionId={revokingSessionId}
        revokingAll={revokingAll}
        otherSessions={otherSessions}
        onRevokeSession={handleRevokeSession}
        onRevokeAllOther={handleRevokeAllOther}
      />

      {/* API Keys */}
      <ApiKeysCard />

      {/* Security Log - Coming Soon */}
      <SecurityLogCard />

      {/* MFA Setup Dialog */}
      <MFASetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        onComplete={handleSetupComplete}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteFactorDialog
        factor={factorToDelete}
        factorsCount={factors.length}
        userRole={userRole}
        isDeleting={isDeleting}
        onOpenChange={() => setFactorToDelete(null)}
        onConfirm={handleDeleteFactor}
      />
    </div>
  );
}
