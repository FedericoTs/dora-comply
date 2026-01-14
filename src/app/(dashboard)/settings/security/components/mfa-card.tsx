'use client';

/**
 * MFA Card Component
 *
 * Two-factor authentication management card
 */

import { Shield, Smartphone, Plus, Trash2, Check, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatRelativeTime } from './utils';
import type { MFAFactor, AuthenticatorAssuranceLevel } from '@/lib/auth/types';

interface MFACardProps {
  factors: MFAFactor[];
  aalInfo: AuthenticatorAssuranceLevel | null;
  hasMFA: boolean;
  onSetupClick: () => void;
  onDeleteClick: (factor: MFAFactor) => void;
}

export function MFACard({
  factors,
  aalInfo,
  hasMFA,
  onSetupClick,
  onDeleteClick,
}: MFACardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
          </div>
          <Badge
            variant={hasMFA ? 'default' : 'secondary'}
            className={hasMFA ? 'bg-success/20 text-success border-success/30' : ''}
          >
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
                    onClick={() => onDeleteClick(factor)}
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
          onClick={onSetupClick}
        >
          <Plus className="h-4 w-4 mr-2" />
          {hasMFA ? 'Add Another Authenticator' : 'Set Up Authenticator App'}
        </Button>
      </CardContent>
    </Card>
  );
}
