/**
 * Providers Card Component
 *
 * Displays TI and Red Team provider information for TLPT
 */

import { Building2, Shield, Target, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TLPTComponentProps } from './types';

export function ProvidersCard({ tlpt }: TLPTComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Test Providers
        </CardTitle>
        <CardDescription>TI and Red Team providers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Threat Intelligence Provider */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Threat Intelligence
          </h4>
          {tlpt.ti_provider ? (
            <div className="pl-6 space-y-1">
              <p className="text-sm">{tlpt.ti_provider}</p>
              {tlpt.ti_provider_accreditation && (
                <p className="text-xs text-muted-foreground">
                  Accreditation: {tlpt.ti_provider_accreditation}
                </p>
              )}
              {(tlpt.ti_start_date || tlpt.ti_end_date) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {tlpt.ti_start_date && new Date(tlpt.ti_start_date).toLocaleDateString()}
                  {tlpt.ti_start_date && tlpt.ti_end_date && ' - '}
                  {tlpt.ti_end_date && new Date(tlpt.ti_end_date).toLocaleDateString()}
                </p>
              )}
              {tlpt.ti_report_received && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Report Received
                </Badge>
              )}
            </div>
          ) : (
            <p className="pl-6 text-sm text-muted-foreground">Not assigned</p>
          )}
        </div>

        {/* Red Team Provider */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Red Team
          </h4>
          {tlpt.rt_provider ? (
            <div className="pl-6 space-y-1">
              <p className="text-sm">{tlpt.rt_provider}</p>
              {tlpt.rt_provider_accreditation && (
                <p className="text-xs text-muted-foreground">
                  Accreditation: {tlpt.rt_provider_accreditation}
                </p>
              )}
              {(tlpt.rt_start_date || tlpt.rt_end_date) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {tlpt.rt_start_date && new Date(tlpt.rt_start_date).toLocaleDateString()}
                  {tlpt.rt_start_date && tlpt.rt_end_date && ' - '}
                  {tlpt.rt_end_date && new Date(tlpt.rt_end_date).toLocaleDateString()}
                </p>
              )}
              {tlpt.rt_report_received && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Report Received
                </Badge>
              )}
            </div>
          ) : (
            <p className="pl-6 text-sm text-muted-foreground">Not assigned</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
