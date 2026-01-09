'use client';

/**
 * Webhooks Configuration Page
 *
 * Manage webhook endpoints for real-time event notifications.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Webhook,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  History,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  testWebhook,
  getWebhookDeliveries,
} from '@/lib/webhooks/actions';
import {
  type WebhookConfig,
  type WebhookEventType,
  type WebhookDelivery,
  WEBHOOK_EVENT_CATEGORIES,
  WEBHOOK_EVENT_DESCRIPTIONS,
} from '@/lib/webhooks/types';

type EventCategory = keyof typeof WEBHOOK_EVENT_CATEGORIES;

export default function WebhooksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Secret visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load webhooks
  const loadWebhooks = useCallback(async () => {
    try {
      const data = await getWebhooks();
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast.error('Failed to load webhooks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  // Load deliveries for selected webhook
  const loadDeliveries = useCallback(async (webhookId: string) => {
    setIsLoadingDeliveries(true);
    try {
      const data = await getWebhookDeliveries(webhookId);
      setDeliveries(data);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, []);

  // Handle create webhook
  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (!newUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createWebhook(newName.trim(), newUrl.trim(), selectedEvents);
      if (result.success && result.webhook) {
        setWebhooks((prev) => [result.webhook!, ...prev]);
        toast.success('Webhook created successfully');
        handleCloseCreateDialog();
      } else {
        toast.error(result.error || 'Failed to create webhook');
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
      toast.error('Failed to create webhook');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle toggle webhook active state
  const handleToggleActive = async (webhook: WebhookConfig) => {
    const result = await updateWebhook(webhook.id, { is_active: !webhook.is_active });
    if (result.success) {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhook.id ? { ...w, is_active: !w.is_active } : w))
      );
      toast.success(webhook.is_active ? 'Webhook paused' : 'Webhook activated');
    } else {
      toast.error(result.error || 'Failed to update webhook');
    }
  };

  // Handle delete webhook
  const handleDelete = async (webhookId: string) => {
    const result = await deleteWebhook(webhookId);
    if (result.success) {
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      toast.success('Webhook deleted');
      if (selectedWebhook?.id === webhookId) {
        setIsDetailSheetOpen(false);
        setSelectedWebhook(null);
      }
    } else {
      toast.error(result.error || 'Failed to delete webhook');
    }
  };

  // Handle test webhook
  const handleTest = async (webhookId: string) => {
    setIsTesting(webhookId);
    try {
      const result = await testWebhook(webhookId);
      if (result.success) {
        toast.success(`Test delivered successfully (${result.status})`);
      } else {
        toast.error(result.error || 'Test delivery failed');
      }
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast.error('Test delivery failed');
    } finally {
      setIsTesting(null);
    }
  };

  // Handle regenerate secret
  const handleRegenerateSecret = async (webhookId: string) => {
    const result = await regenerateSecret(webhookId);
    if (result.success && result.secret) {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhookId ? { ...w, secret: result.secret! } : w))
      );
      setVisibleSecrets((prev) => ({ ...prev, [webhookId]: true }));
      toast.success('Secret regenerated');
    } else {
      toast.error(result.error || 'Failed to regenerate secret');
    }
  };

  // Handle copy secret
  const handleCopySecret = async (secret: string, webhookId: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedId(webhookId);
    toast.success('Secret copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle event selection
  const handleEventToggle = (event: WebhookEventType) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  // Handle category selection (select all events in category)
  const handleCategoryToggle = (category: EventCategory) => {
    const categoryEvents = WEBHOOK_EVENT_CATEGORIES[category] as readonly WebhookEventType[];
    const allSelected = categoryEvents.every((e) => selectedEvents.includes(e));

    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((e) => !categoryEvents.includes(e)));
    } else {
      setSelectedEvents((prev) => [...new Set([...prev, ...categoryEvents])]);
    }
  };

  // Open detail sheet
  const handleOpenDetail = (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setIsDetailSheetOpen(true);
    loadDeliveries(webhook.id);
  };

  // Close create dialog
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewName('');
    setNewUrl('');
    setSelectedEvents([]);
  };

  // Get delivery status icon
  const getDeliveryStatusIcon = (delivery: WebhookDelivery) => {
    if (delivery.delivered_at && delivery.response_status && delivery.response_status < 400) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (delivery.failed_at) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/integrations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-lg font-medium">Webhooks</h2>
            <p className="text-sm text-muted-foreground">
              Configure endpoints to receive real-time event notifications
            </p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-server.com/webhook"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
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
                              onCheckedChange={() => handleCategoryToggle(category)}
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
                                  onCheckedChange={() => handleEventToggle(event)}
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
              <Button variant="outline" onClick={handleCloseCreateDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a webhook to start receiving real-time notifications
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className={!webhook.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => handleToggleActive(webhook)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{webhook.name}</span>
                        {!webhook.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[300px]">
                          {webhook.url}
                        </code>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {webhook.events.slice(0, 3).map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{webhook.events.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={isTesting === webhook.id || !webhook.is_active}
                    >
                      {isTesting === webhook.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">Test</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDetail(webhook)}
                    >
                      <History className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">History</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDetail(webhook)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(webhook)}>
                          {webhook.is_active ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRegenerateSecret(webhook.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Secret
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(webhook.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Webhook Detail Sheet */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedWebhook && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedWebhook.name}</SheetTitle>
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
                      <Badge variant={selectedWebhook.is_active ? 'default' : 'secondary'}>
                        {selectedWebhook.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </div>

                  {/* URL */}
                  <div className="space-y-2">
                    <Label>Endpoint URL</Label>
                    <code className="block text-sm bg-muted px-3 py-2 rounded break-all">
                      {selectedWebhook.url}
                    </code>
                  </div>

                  {/* Secret */}
                  <div className="space-y-2">
                    <Label>Signing Secret</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          readOnly
                          value={
                            visibleSecrets[selectedWebhook.id]
                              ? selectedWebhook.secret
                              : '•'.repeat(40)
                          }
                          className="font-mono text-xs pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() =>
                            setVisibleSecrets((prev) => ({
                              ...prev,
                              [selectedWebhook.id]: !prev[selectedWebhook.id],
                            }))
                          }
                        >
                          {visibleSecrets[selectedWebhook.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleCopySecret(selectedWebhook.secret, selectedWebhook.id)
                        }
                      >
                        {copiedId === selectedWebhook.id ? (
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
                      {selectedWebhook.events.map((event) => (
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
                      {formatDistanceToNow(new Date(selectedWebhook.created_at), {
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
    </div>
  );
}
