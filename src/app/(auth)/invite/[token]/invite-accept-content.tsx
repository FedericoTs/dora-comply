'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  organizationName: string;
  inviterName: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
}

interface InviteAcceptContentProps {
  token: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: 'Full access to all features including team management',
  analyst: 'Access to compliance workflows and assessments',
  viewer: 'Read-only access to dashboards and reports',
};

export function InviteAcceptContent({ token }: InviteAcceptContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/invite/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error?.message || 'Invalid invitation');
          return;
        }

        setInvitation(data.invitation);
        setIsLoggedIn(data.isLoggedIn);
      } catch {
        setError('Failed to validate invitation');
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const handleAccept = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/invite/${token}/accept`, {
          method: 'POST',
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error?.message || 'Failed to accept invitation');
          return;
        }

        setAccepted(true);
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch {
        setError('Failed to accept invitation');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              This invitation may have expired, been revoked, or already been used.
              Please contact your organization administrator for a new invitation.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You&apos;ve successfully joined {invitation?.organizationName}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const roleName = invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1);

  if (isExpired || invitation.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation is no longer valid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Please contact your organization administrator to request a new invitation.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            Join {invitation.organizationName} on NIS2 Comply
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{invitation.organizationName}</p>
                <p className="text-sm text-muted-foreground">Organization</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Role</span>
              <Badge variant="secondary">{roleName}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {ROLE_DESCRIPTIONS[invitation.role]}
            </p>
          </div>

          {/* Invited By */}
          <p className="text-sm text-muted-foreground text-center">
            Invited by <span className="font-medium text-foreground">{invitation.inviterName}</span>
          </p>

          {/* Actions */}
          {isLoggedIn ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  Accept Invitation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Sign in or create an account to accept this invitation
              </p>
              <Button className="w-full" asChild>
                <Link href={`/login?invite=${token}&email=${encodeURIComponent(invitation.email)}`}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Accept
                </Link>
              </Button>
            </div>
          )}

          {/* Expiry Note */}
          <p className="text-xs text-center text-muted-foreground">
            This invitation expires on{' '}
            {new Date(invitation.expiresAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
