'use client';

import {
  Mail,
  Clock,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ROLE_CONFIG,
  formatSentDate,
  formatRelativeTime,
  type PendingInvitation,
} from '@/lib/settings/team-constants';

interface PendingInvitationsCardProps {
  invitations: PendingInvitation[];
  processingInviteId: string | null;
  onResend: (inviteId: string) => void;
  onRevoke: (inviteId: string) => void;
}

export function PendingInvitationsCard({
  invitations,
  processingInviteId,
  onResend,
  onRevoke,
}: PendingInvitationsCardProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Invitations ({invitations.length})
          </CardTitle>
        </div>
        <CardDescription>
          These invitations are waiting for recipients to accept
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {invitations.map((invitation) => {
            const roleConfig = ROLE_CONFIG[invitation.role as keyof typeof ROLE_CONFIG];
            const RoleIcon = roleConfig?.icon || Eye;
            const isProcessing = processingInviteId === invitation.id;

            return (
              <div
                key={invitation.id}
                className={cn(
                  'flex items-center justify-between p-4 transition-colors',
                  invitation.isExpired && 'bg-amber-50 dark:bg-amber-950/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{invitation.email}</p>
                      {invitation.isExpired && (
                        <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatSentDate(invitation.created_at)} by {invitation.invitedBy} · {formatRelativeTime(invitation.expires_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn('gap-1', roleConfig?.color)}>
                    <RoleIcon className="h-3 w-3" />
                    {roleConfig?.label || invitation.role}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResend(invitation.id)}
                      disabled={isProcessing}
                      title="Resend invitation"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRevoke(invitation.id)}
                      disabled={isProcessing}
                      title="Revoke invitation"
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
