'use client';

/**
 * Webhook Detail Sheet Component
 *
 * Side sheet showing webhook details and delivery history.
 */

import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  History,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import type { WebhookConfig, WebhookDelivery } from '@/lib/webhooks/types';

interface WebhookDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: WebhookConfig | null;
  deliveries: WebhookDelivery[];
  isLoadingDeliveries: boolean;
  isSecretVisible: boolean;
  isCopied: boolean;
  onToggleSecretVisibility: () => void;
  onCopySecret: () => void;
}

// Get delivery status icon
function getDeliveryStatusIcon(delivery: WebhookDelivery) {
  if (delivery.delivered_at && delivery.response_status && delivery.response_status < 400) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (delivery.failed_at) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-yellow-500" />;
}

export function WebhookDetailSheet({
  isOpen,
  onOpenChange,
  webhook,
  deliveries,
  isLoadingDeliveries,
  isSecretVisible,
  isCopied,
  onToggleSecretVisibility,
  onCopySecret,
}: WebhookDetailSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {webhook && (
          <>
            <SheetHeader>
              <SheetTitle>{webhook.name}</SheetTitle>
              <SheetDescription>
                Webhook configuration and delivery history
              </SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                      {webhook.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <code className="block text-sm bg-muted px-3 py-2 rounded break-all">
                    {webhook.url}
                  </code>
                </div>

                {/* Secret */}
                <div className="space-y-2">
                  <Label>Signing Secret</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        readOnly
                        value={isSecretVisible ? webhook.secret : '•'.repeat(40)}
                        className="font-mono text-xs pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={onToggleSecretVisibility}
                      >
                        {isSecretVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={onCopySecret}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this secret to verify webhook signatures
                  </p>
                </div>

                {/* Events */}
                <div className="space-y-2">
                  <Label>Subscribed Events</Label>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-2">
                  <Label>Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(webhook.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {/* Signature Verification */}
                <Separator />
                <div className="space-y-2">
                  <Label>Signature Verification</Label>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      All webhook payloads include an{' '}
                      <code className="bg-muted px-1 rounded">X-Webhook-Signature</code>{' '}
                      header with format{' '}
                      <code className="bg-muted px-1 rounded">t=timestamp,v1=signature</code>.
                      Verify using HMAC-SHA256.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="deliveries" className="mt-4">
                {isLoadingDeliveries ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : deliveries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No deliveries yet</p>
                    <p className="text-sm">
                      Test your webhook or wait for events to trigger
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        {getDeliveryStatusIcon(delivery)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {delivery.event_type}
                            </Badge>
                            {delivery.response_status && (
                              <span
                                className={`text-xs ${
                                  delivery.response_status < 400
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {delivery.response_status}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(delivery.created_at), {
                              addSuffix: true,
                            })}
                            {delivery.retry_count > 0 && ` (${delivery.retry_count} retries)`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
