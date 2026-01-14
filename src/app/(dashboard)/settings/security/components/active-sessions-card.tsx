'use client';

/**
 * Active Sessions Card Component
 *
 * Displays and manages active login sessions
 */

import { Monitor, Smartphone, Globe, Clock, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, parseUserAgent } from './utils';
import type { Session } from './types';

interface ActiveSessionsCardProps {
  sessions: Session[];
  sessionsLoading: boolean;
  revokingSessionId: string | null;
  revokingAll: boolean;
  otherSessions: Session[];
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllOther: () => void;
}

export function ActiveSessionsCard({
  sessions,
  sessionsLoading,
  revokingSessionId,
  revokingAll,
  otherSessions,
  onRevokeSession,
  onRevokeAllOther,
}: ActiveSessionsCardProps) {
  return (
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
              onClick={onRevokeAllOther}
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
                      onClick={() => onRevokeSession(session.id)}
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
  );
}
