'use client';

/**
 * Create Webhook Dialog Component
 *
 * Dialog for creating a new webhook with event selection.
 */

import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  type WebhookEventType,
  WEBHOOK_EVENT_CATEGORIES,
  WEBHOOK_EVENT_DESCRIPTIONS,
} from '@/lib/webhooks/types';
import type { EventCategory } from '@/hooks/use-webhooks';

interface CreateWebhookDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newName: string;
  newUrl: string;
  selectedEvents: WebhookEventType[];
  isCreating: boolean;
  onNameChange: (name: string) => void;
  onUrlChange: (url: string) => void;
  onEventToggle: (event: WebhookEventType) => void;
  onCategoryToggle: (category: EventCategory) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CreateWebhookDialog({
  isOpen,
  onOpenChange,
  newName,
  newUrl,
  selectedEvents,
  isCreating,
  onNameChange,
  onUrlChange,
  onEventToggle,
  onCategoryToggle,
  onSubmit,
  onCancel,
}: CreateWebhookDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Webhook</DialogTitle>
          <DialogDescription>
            Configure a new webhook endpoint to receive event notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="webhook-name">Name</Label>
            <Input
              id="webhook-name"
              placeholder="e.g., Slack Notifications"
              value={newName}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-server.com/webhook"
              value={newUrl}
              onChange={(e) => onUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Must be a valid HTTPS URL that accepts POST requests
            </p>
          </div>
          <div className="space-y-3">
            <Label>Events to Subscribe</Label>
            <Accordion type="multiple" className="w-full">
              {(Object.keys(WEBHOOK_EVENT_CATEGORIES) as EventCategory[]).map((category) => {
                const events = WEBHOOK_EVENT_CATEGORIES[category] as readonly WebhookEventType[];
                const selectedCount = events.filter((e) => selectedEvents.includes(e)).length;
                const allSelected = selectedCount === events.length;

                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => onCategoryToggle(category)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="capitalize">{category}</span>
                        {selectedCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedCount}/{events.length}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-6">
                        {events.map((event) => (
                          <div key={event} className="flex items-start gap-2">
                            <Checkbox
                              id={event}
                              checked={selectedEvents.includes(event)}
                              onCheckedChange={() => onEventToggle(event)}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label
                                htmlFor={event}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {event}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {WEBHOOK_EVENT_DESCRIPTIONS[event]}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isCreating}>
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
