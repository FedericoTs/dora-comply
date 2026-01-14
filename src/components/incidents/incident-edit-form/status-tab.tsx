'use client';

/**
 * Incident Status Tab Component
 *
 * Current status and lifecycle information.
 */

import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TabsContent } from '@/components/ui/tabs';
import type { Incident } from '@/lib/incidents/types';
import { getStatusLabel } from '@/lib/incidents/types';

interface StatusTabProps {
  incident: Incident;
}

export function StatusTab({ incident }: StatusTabProps) {
  return (
    <TabsContent value="status" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Incident Status</CardTitle>
          <CardDescription>Current status and lifecycle management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-base py-1 px-3">
                {getStatusLabel(incident.status)}
              </Badge>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Status Changes</AlertTitle>
            <AlertDescription>
              Status changes should be made through the incident timeline to maintain proper audit
              trail. Use the incident detail page to change status.
            </AlertDescription>
          </Alert>

          {/* Show current dates */}
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(incident.created_at).toLocaleString('en-GB')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{new Date(incident.updated_at).toLocaleString('en-GB')}</span>
            </div>
            {incident.recovery_datetime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recovered</span>
                <span>{new Date(incident.recovery_datetime).toLocaleString('en-GB')}</span>
              </div>
            )}
            {incident.resolution_datetime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Resolved</span>
                <span>{new Date(incident.resolution_datetime).toLocaleString('en-GB')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
