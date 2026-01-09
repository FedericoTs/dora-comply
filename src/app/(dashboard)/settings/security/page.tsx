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
  Monitor,
  Globe,
  LogOut,
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

// Session type from API
interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  last_active_at: string | null;
  is_current: boolean;
}

export default function SecuritySettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [aalInfo, setAalInfo] = useState<AuthenticatorAssuranceLevel | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [factorToDelete, setFactorToDelete] = useState<MFAFactor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Session state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

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

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Revoke a specific session
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      const response = await fetch(`/api/settings/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to revoke session');
      }

      toast.success('Session revoked');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('Revoke session error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke session');
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Revoke all other sessions
  const handleRevokeAllOther = async () => {
    setRevokingAll(true);
    try {
      const response = await fetch('/api/settings/sessions', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to revoke sessions');
      }

      const result = await response.json();
      toast.success(result.message || 'Signed out of other sessions');
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (error) {
      console.error('Revoke all sessions error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

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
  const otherSessions = sessions.filter((s) => !s.is_current);

  // Parse user agent to get device/browser info
  const parseUserAgent = (ua: string | null) => {
    if (!ua) return { browser: 'Unknown Browser', device: 'Unknown Device', os: 'Unknown' };

    let browser = 'Unknown Browser';
    let os = 'Unknown';
    let device = 'Desktop';

    // Detect browser
    if (ua.includes('Firefox/')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Detect device type
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
      device = 'Mobile';
    } else if (ua.includes('iPad') || ua.includes('Tablet')) {
      device = 'Tablet';
    }

    return { browser, os, device };
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
            <Badge variant={hasMFA ? 'default' : 'secondary'} className={hasMFA ? 'bg-success/20 text-success border-success/30' : ''}>
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
                            <Check className="h-3 w-3 text-success" />
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

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                View and manage your active login sessions across devices
              </CardDescription>
            </div>
            {otherSessions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAllOther}
                disabled={revokingAll}
                className="text-destructive hover:text-destructive"
              >
                {revokingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                Sign Out All Other
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="text-center">
                <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active sessions found</p>
              </div>
            </div>
          ) : (
            <>
              {sessions.map((session) => {
                const { browser, os, device } = parseUserAgent(session.user_agent);
                const isRevoking = revokingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      session.is_current ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${session.is_current ? 'bg-primary/10' : 'bg-muted'}`}>
                        {device === 'Mobile' ? (
                          <Smartphone className={`h-4 w-4 ${session.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                        ) : (
                          <Monitor className={`h-4 w-4 ${session.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {browser} on {os}
                          </p>
                          {session.is_current && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {session.ip && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {session.ip}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.last_active_at
                              ? `Active ${formatRelativeTime(session.last_active_at)}`
                              : `Started ${formatRelativeTime(session.created_at)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isRevoking}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isRevoking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}

              <p className="text-xs text-muted-foreground pt-2">
                Sessions automatically expire after 7 days of inactivity.
              </p>
            </>
          )}
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
