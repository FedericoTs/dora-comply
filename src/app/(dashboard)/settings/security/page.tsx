'use client';

/**
 * Security Settings Page
 *
 * Manage MFA enrollment, view enrolled factors, and security settings.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Smartphone,
  Plus,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Clock,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { MFASetupDialog } from './mfa-setup-dialog';
import { getMFAFactors, unenrollFactor, getAuthenticatorAssuranceLevel } from '@/lib/auth/mfa-actions';
import type { MFAFactor, AuthenticatorAssuranceLevel } from '@/lib/auth/types';
import { getCurrentUser } from '@/lib/auth/actions';
import type { UserRole } from '@/lib/auth/types';

// Roles that require MFA
const MFA_REQUIRED_ROLES: UserRole[] = ['owner', 'admin'];

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [aalInfo, setAalInfo] = useState<AuthenticatorAssuranceLevel | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<MFAFactor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load MFA factors and AAL info
  const loadMFAData = useCallback(async () => {
    try {
      const [factorsResult, aalResult, user] = await Promise.all([
        getMFAFactors(),
        getAuthenticatorAssuranceLevel(),
        getCurrentUser(),
      ]);

      if (factorsResult.success && factorsResult.data) {
        // Combine TOTP and phone factors, filter to verified only
        const allFactors = [...factorsResult.data.totp, ...factorsResult.data.phone];
        setFactors(allFactors.filter((f) => f.status === 'verified'));
      }

      if (aalResult.success && aalResult.data) {
        setAalInfo(aalResult.data);
      }

      if (user) {
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Failed to load MFA data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMFAData();
  }, [loadMFAData]);

  // Handle MFA setup completion
  const handleSetupComplete = () => {
    setShowSetupDialog(false);
    loadMFAData();
    toast.success('Two-factor authentication enabled');
  };

  // Handle factor deletion
  const handleDeleteFactor = async () => {
    if (!factorToDelete) return;

    setIsDeleting(true);
    try {
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return formatDate(dateString);
  };

  const hasMFA = factors.length > 0;
  const mfaRequired = userRole && MFA_REQUIRED_ROLES.includes(userRole);

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
      {mfaRequired && !hasMFA && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Two-Factor Authentication Required</AlertTitle>
          <AlertDescription>
            As an {userRole}, you are required to enable two-factor authentication
            for enhanced account security. Please set it up below.
          </AlertDescription>
        </Alert>
      )}

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
            </div>
            <Badge variant={hasMFA ? 'default' : 'secondary'} className={hasMFA ? 'bg-green-100 text-green-700 border-green-300' : ''}>
              {hasMFA ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <CardDescription>
            Add an extra layer of security to your account by requiring a verification code
            from your authenticator app when signing in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AAL Info */}
          {aalInfo && hasMFA && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>
                Current security level:{' '}
                <Badge variant="outline" className="ml-1">
                  {aalInfo.currentLevel === 'aal2' ? 'AAL2 (MFA verified)' : 'AAL1 (Password only)'}
                </Badge>
              </span>
            </div>
          )}

          {/* Enrolled Factors */}
          {factors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Enrolled Authenticators</h4>
              <div className="space-y-2">
                {factors.map((factor) => (
                  <div
                    key={factor.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Smartphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {factor.friendly_name || 'Authenticator App'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Check className="h-3 w-3 text-green-500" />
                            Added {formatDate(factor.created_at)}
                          </span>
                          {factor.last_challenged_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Used {formatRelativeTime(factor.last_challenged_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setFactorToDelete(factor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Add Authenticator Button */}
          <Button
            variant={hasMFA ? 'outline' : 'default'}
            className="w-full"
            onClick={() => setShowSetupDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {hasMFA ? 'Add Another Authenticator' : 'Set Up Authenticator App'}
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions - Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            View and manage your active login sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Log - Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Log
          </CardTitle>
          <CardDescription>
            View recent security events and account activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup Dialog */}
      <MFASetupDialog
        open={showSetupDialog}
        onOpenChange={setShowSetupDialog}
        onComplete={handleSetupComplete}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!factorToDelete} onOpenChange={() => setFactorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Authenticator?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the authenticator from your account. You&apos;ll need to set up
              a new one if you want to use two-factor authentication.
              {mfaRequired && factors.length === 1 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: As an {userRole}, you are required to have MFA enabled.
                  You will need to set up a new authenticator immediately.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFactor}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Authenticator'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
