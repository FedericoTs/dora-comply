'use client';

/**
 * Webhooks Configuration Page
 *
 * Manage webhook endpoints for real-time event notifications.
 */

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebhooks } from '@/hooks/use-webhooks';
import {
  CreateWebhookDialog,
  WebhookCard,
  WebhookDetailSheet,
  WebhookEmptyState,
  WebhooksLoading,
} from '@/components/webhooks';

export default function WebhooksPage() {
  const {
    isLoading,
    webhooks,
    isCreateDialogOpen,
    selectedWebhook,
    isDetailSheetOpen,
    deliveries,
    isLoadingDeliveries,
    newName,
    newUrl,
    selectedEvents,
    isCreating,
    isTesting,
    visibleSecrets,
    copiedId,
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
  } = useWebhooks();

  if (isLoading) {
    return <WebhooksLoading />;
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
        <CreateWebhookDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          newName={newName}
          newUrl={newUrl}
          selectedEvents={selectedEvents}
          isCreating={isCreating}
          onNameChange={setNewName}
          onUrlChange={setNewUrl}
          onEventToggle={handleEventToggle}
          onCategoryToggle={handleCategoryToggle}
          onSubmit={handleCreate}
          onCancel={handleCloseCreateDialog}
        />
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <WebhookEmptyState onAddWebhook={() => setIsCreateDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              isTesting={isTesting === webhook.id}
              onToggleActive={() => handleToggleActive(webhook)}
              onTest={() => handleTest(webhook.id)}
              onOpenDetail={() => handleOpenDetail(webhook)}
              onRegenerateSecret={() => handleRegenerateSecret(webhook.id)}
              onDelete={() => handleDelete(webhook.id)}
            />
          ))}
        </div>
      )}

      {/* Webhook Detail Sheet */}
      <WebhookDetailSheet
        isOpen={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        webhook={selectedWebhook}
        deliveries={deliveries}
        isLoadingDeliveries={isLoadingDeliveries}
        isSecretVisible={selectedWebhook ? visibleSecrets[selectedWebhook.id] ?? false : false}
        isCopied={selectedWebhook ? copiedId === selectedWebhook.id : false}
        onToggleSecretVisibility={() => selectedWebhook && toggleSecretVisibility(selectedWebhook.id)}
        onCopySecret={() => selectedWebhook && handleCopySecret(selectedWebhook.secret, selectedWebhook.id)}
        onRetryDelivery={handleRetryDelivery}
      />
    </div>
  );
}
