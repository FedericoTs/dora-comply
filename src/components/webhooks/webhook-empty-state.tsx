'use client';

/**
 * Webhook Empty State Component
 *
 * Displayed when no webhooks are configured.
 */

import { Webhook, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WebhookEmptyStateProps {
  onAddWebhook: () => void;
}

export function WebhookEmptyState({ onAddWebhook }: WebhookEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center">
          <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a webhook to start receiving real-time notifications
          </p>
          <Button onClick={onAddWebhook}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Webhook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WebhooksLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
