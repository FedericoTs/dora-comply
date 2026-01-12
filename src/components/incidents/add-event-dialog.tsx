'use client';

/**
 * Add Timeline Event Dialog
 *
 * Allows adding new events to the incident timeline
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addEventAction } from '@/lib/incidents/actions';
import type { EventType } from '@/lib/incidents/types';

interface AddEventDialogProps {
  incidentId: string;
}

const EVENT_TYPES: { value: EventType; label: string; description: string }[] = [
  {
    value: 'created',
    label: 'Detection',
    description: 'Incident was first detected or reported',
  },
  {
    value: 'classified',
    label: 'Classification',
    description: 'Incident severity was assessed and classified',
  },
  {
    value: 'reclassified',
    label: 'Reclassification',
    description: 'Incident classification was updated',
  },
  {
    value: 'escalated',
    label: 'Escalation',
    description: 'Incident was escalated to higher priority',
  },
  {
    value: 'report_submitted',
    label: 'Report Submitted',
    description: 'Regulatory report was submitted',
  },
  {
    value: 'report_acknowledged',
    label: 'Report Acknowledged',
    description: 'Regulatory report was acknowledged',
  },
  {
    value: 'mitigation_started',
    label: 'Mitigation',
    description: 'Mitigation measures were implemented',
  },
  {
    value: 'service_restored',
    label: 'Service Restored',
    description: 'Affected services were restored',
  },
  {
    value: 'resolved',
    label: 'Resolution',
    description: 'Incident was fully resolved',
  },
  {
    value: 'closed',
    label: 'Closed',
    description: 'Incident was closed after review',
  },
  {
    value: 'updated',
    label: 'Status Update',
    description: 'General status update or progress note',
  },
];

export function AddEventDialog({ incidentId }: AddEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [eventType, setEventType] = useState<EventType>('updated');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!eventType || !eventDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addEventAction(incidentId, {
        event_type: eventType,
        event_datetime: new Date(eventDate).toISOString(),
        description: description || undefined,
      });

      if (result.success) {
        toast.success('Event added', {
          description: 'Timeline event has been recorded',
        });
        setOpen(false);
        // Reset form
        setEventType('updated');
        setEventDate(new Date().toISOString().slice(0, 16));
        setDescription('');
        router.refresh();
      } else {
        toast.error('Failed to add event', {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error('Failed to add event', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Timeline Event</DialogTitle>
          <DialogDescription>
            Record a new event in the incident timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type *</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger id="event-type">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-date">Date & Time *</Label>
            <div className="relative">
              <Input
                id="event-date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
