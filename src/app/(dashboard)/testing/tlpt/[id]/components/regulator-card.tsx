/**
 * Regulator Card Component
 *
 * Displays regulator notification status for TLPT
 */

import { UserCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TLPTComponentProps } from './types';

export function RegulatorCard({ tlpt }: TLPTComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Regulator Notification
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tlpt.regulator_notified ? (
          <div className="space-y-2">
            <Badge variant="default" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Notified
            </Badge>
            {tlpt.regulator_notification_date && (
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(tlpt.regulator_notification_date).toLocaleDateString()}
              </p>
            )}
            {tlpt.regulator_reference && (
              <p className="text-xs text-muted-foreground">
                Reference: {tlpt.regulator_reference}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Regulator not yet notified</p>
            <p className="text-xs text-muted-foreground">
              Article 26 requires notification to competent authorities before TLPT commencement.
            </p>
          </div>
        )}

        {/* Attestation */}
        {tlpt.attestation_date && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Attestation</h4>
            <div className="space-y-1">
              <p className="text-sm flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(tlpt.attestation_date).toLocaleDateString()}
              </p>
              {tlpt.attestation_reference && (
                <p className="text-xs text-muted-foreground">
                  Reference: {tlpt.attestation_reference}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
