'use client';

/**
 * useWebhooks Hook
 *
 * Manages webhooks state, CRUD operations, and UI state for the webhooks page.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  regenerateSecret,
  testWebhook,
  getWebhookDeliveries,
  retryDelivery,
} from '@/lib/webhooks/actions';
import {
  type WebhookConfig,
  type WebhookEventType,
  type WebhookDelivery,
  WEBHOOK_EVENT_CATEGORIES,
} from '@/lib/webhooks/types';

export type EventCategory = keyof typeof WEBHOOK_EVENT_CATEGORIES;

export interface UseWebhooksReturn {
  // State
  isLoading: boolean;
  webhooks: WebhookConfig[];
  isCreateDialogOpen: boolean;
  selectedWebhook: WebhookConfig | null;
  isDetailSheetOpen: boolean;
  deliveries: WebhookDelivery[];
  isLoadingDeliveries: boolean;

  // Form state
  newName: string;
  newUrl: string;
  selectedEvents: WebhookEventType[];
  isCreating: boolean;
  isTesting: string | null;

  // Secret visibility
  visibleSecrets: Record<string, boolean>;
  copiedId: string | null;

  // Actions
  setIsCreateDialogOpen: (open: boolean) => void;
  setIsDetailSheetOpen: (open: boolean) => void;
  setNewName: (name: string) => void;
  setNewUrl: (url: string) => void;
  handleCreate: () => Promise<void>;
  handleToggleActive: (webhook: WebhookConfig) => Promise<void>;
  handleDelete: (webhookId: string) => Promise<void>;
  handleTest: (webhookId: string) => Promise<void>;
  handleRegenerateSecret: (webhookId: string) => Promise<void>;
  handleCopySecret: (secret: string, webhookId: string) => Promise<void>;
  handleEventToggle: (event: WebhookEventType) => void;
  handleCategoryToggle: (category: EventCategory) => void;
  handleOpenDetail: (webhook: WebhookConfig) => void;
  handleCloseCreateDialog: () => void;
  toggleSecretVisibility: (webhookId: string) => void;
  handleRetryDelivery: (deliveryId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useWebhooks(): UseWebhooksReturn {
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

  // Close create dialog
  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
    setNewName('');
    setNewUrl('');
    setSelectedEvents([]);
  }, []);

  // Handle create webhook
  const handleCreate = useCallback(async () => {
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
  }, [newName, newUrl, selectedEvents, handleCloseCreateDialog]);

  // Handle toggle webhook active state
  const handleToggleActive = useCallback(async (webhook: WebhookConfig) => {
    const result = await updateWebhook(webhook.id, { is_active: !webhook.is_active });
    if (result.success) {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === webhook.id ? { ...w, is_active: !w.is_active } : w))
      );
      toast.success(webhook.is_active ? 'Webhook paused' : 'Webhook activated');
    } else {
      toast.error(result.error || 'Failed to update webhook');
    }
  }, []);

  // Handle delete webhook
  const handleDelete = useCallback(async (webhookId: string) => {
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
  }, [selectedWebhook?.id]);

  // Handle test webhook
  const handleTest = useCallback(async (webhookId: string) => {
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
  }, []);

  // Handle regenerate secret
  const handleRegenerateSecret = useCallback(async (webhookId: string) => {
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
  }, []);

  // Handle copy secret
  const handleCopySecret = useCallback(async (secret: string, webhookId: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedId(webhookId);
    toast.success('Secret copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Handle event selection
  const handleEventToggle = useCallback((event: WebhookEventType) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }, []);

  // Handle category selection (select all events in category)
  const handleCategoryToggle = useCallback((category: EventCategory) => {
    const categoryEvents = WEBHOOK_EVENT_CATEGORIES[category] as readonly WebhookEventType[];
    setSelectedEvents((prev) => {
      const allSelected = categoryEvents.every((e) => prev.includes(e));
      if (allSelected) {
        return prev.filter((e) => !categoryEvents.includes(e));
      } else {
        return [...new Set([...prev, ...categoryEvents])];
      }
    });
  }, []);

  // Open detail sheet
  const handleOpenDetail = useCallback((webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setIsDetailSheetOpen(true);
    loadDeliveries(webhook.id);
  }, [loadDeliveries]);

  // Toggle secret visibility
  const toggleSecretVisibility = useCallback((webhookId: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [webhookId]: !prev[webhookId],
    }));
  }, []);

  // Handle retry delivery
  const handleRetryDelivery = useCallback(async (deliveryId: string) => {
    const result = await retryDelivery(deliveryId);
    if (result.success) {
      toast.success('Delivery retried successfully');
      // Reload deliveries if webhook is selected
      if (selectedWebhook) {
        loadDeliveries(selectedWebhook.id);
      }
    } else {
      toast.error(result.error || 'Failed to retry delivery');
    }
    return result;
  }, [selectedWebhook, loadDeliveries]);

  return {
    // State
    isLoading,
    webhooks,
    isCreateDialogOpen,
    selectedWebhook,
    isDetailSheetOpen,
    deliveries,
    isLoadingDeliveries,

    // Form state
    newName,
    newUrl,
    selectedEvents,
    isCreating,
    isTesting,

    // Secret visibility
    visibleSecrets,
    copiedId,

    // Actions
    setIsCreateDialogOpen,
    setIsDetailSheetOpen,
    setNewName,
    setNewUrl,
    handleCreate,
    handleToggleActive,
    handleDelete,
    handleTest,
    handleRegenerateSecret,
    handleCopySecret,
    handleEventToggle,
    handleCategoryToggle,
    handleOpenDetail,
    handleCloseCreateDialog,
    toggleSecretVisibility,
    handleRetryDelivery,
  };
}
