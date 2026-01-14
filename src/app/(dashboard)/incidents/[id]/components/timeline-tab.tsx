/**
 * Timeline Tab Component
 *
 * Displays the incident event timeline
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AddEventDialog } from '@/components/incidents/add-event-dialog';
import type { EventData } from './types';

interface TimelineTabProps {
  incidentId: string;
  events: EventData;
}

export function TimelineTab({ incidentId, events }: TimelineTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Incident Timeline</CardTitle>
          <CardDescription>Chronological events for this incident</CardDescription>
        </div>
        <AddEventDialog incidentId={incidentId} />
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No timeline events recorded yet.
          </p>
        ) : (
          <div className="relative pl-6 border-l-2 border-muted space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative">
                <div
                  className={cn(
                    'absolute -left-[25px] h-4 w-4 rounded-full border-2',
                    index === 0
                      ? 'border-primary bg-primary'
                      : 'border-muted bg-background'
                  )}
                />
                <div>
                  <p className="text-sm font-medium capitalize">
                    {event.event_type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.event_datetime).toLocaleString('en-GB')}
                  </p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
