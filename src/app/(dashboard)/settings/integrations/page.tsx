'use client';

/**
 * API & Integrations Settings Page
 *
 * Manage API keys, webhooks, and third-party integrations.
 * Consolidated view with tabs for API Keys and Webhooks.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Webhook,
  Plug,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  type ApiKey,
  type ApiKeyScope,
  type ApiKeyWithSecret,
} from '@/lib/settings/api-keys';

import { useWebhooks } from '@/hooks/use-webhooks';
import {
  CreateWebhookDialog,
  WebhookCard,
  WebhookDetailSheet,
  WebhookEmptyState,
} from '@/components/webhooks';

const SCOPE_OPTIONS: { value: ApiKeyScope; label: string; description: string }[] = [
  { value: 'read', label: 'Read', description: 'Read access to vendors, documents, and reports' },
  { value: 'write', label: 'Write', description: 'Create and update vendors, documents, and reports' },
  { value: 'admin', label: 'Admin', description: 'Full access including user and settings management' },
];

export default function IntegrationsSettingsPage() {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<ApiKeyWithSecret | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state for API keys
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<ApiKeyScope[]>(['read']);
  const [isCreating, setIsCreating] = useState(false);

  // Webhooks hook
  const webhooks = useWebhooks();

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    try {
      const result = await listApiKeys();
      if (result.success && result.data) {
        setApiKeys(result.data);
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // Handle create API key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    if (newKeyScopes.length === 0) {
      toast.error('Please select at least one scope');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createApiKey({
        name: newKeyName.trim(),
        description: newKeyDescription.trim() || undefined,
        scopes: newKeyScopes,
      });

      if (result.success && result.data) {
        setNewKeyResult(result.data);
        setApiKeys((prev) => [result.data!, ...prev]);
        toast.success('API key created successfully');
      } else {
        toast.error(result.error || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle revoke API key
  const handleRevokeKey = async (keyId: string) => {
    try {
      const result = await revokeApiKey(keyId);
      if (result.success) {
        setApiKeys((prev) =>
          prev.map((key) =>
            key.id === keyId ? { ...key, isActive: false } : key
          )
        );
        toast.success('API key revoked');
      } else {
        toast.error(result.error || 'Failed to revoke API key');
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      toast.error('Failed to revoke API key');
    }
  };

  // Handle delete API key
  const handleDeleteKey = async (keyId: string) => {
    try {
      const result = await deleteApiKey(keyId);
      if (result.success) {
        setApiKeys((prev) => prev.filter((key) => key.id !== keyId));
        toast.success('API key deleted');
      } else {
        toast.error(result.error || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    }
  };

  // Handle copy to clipboard
  const handleCopySecret = async () => {
    if (newKeyResult?.secret) {
      await navigator.clipboard.writeText(newKeyResult.secret);
      setCopied(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle scope toggle
  const handleScopeToggle = (scope: ApiKeyScope) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  // Reset dialog state
  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setNewKeyResult(null);
    setNewKeyName('');
    setNewKeyDescription('');
    setNewKeyScopes(['read']);
    setShowSecret(false);
    setCopied(false);
  };

  if (isLoading || webhooks.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-medium">API & Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Manage API keys, webhooks, and third-party integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <CardTitle className="text-base">API Keys</CardTitle>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                  if (!open) handleDialogClose();
                  else setIsCreateDialogOpen(true);
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    {!newKeyResult ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Generate a new API key for programmatic access.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="key-name">Name</Label>
                            <Input
                              id="key-name"
                              placeholder="e.g., Production API"
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="key-description">Description (optional)</Label>
                            <Input
                              id="key-description"
                              placeholder="e.g., Used for CI/CD integration"
                              value={newKeyDescription}
                              onChange={(e) => setNewKeyDescription(e.target.value)}
                            />
                          </div>
                          <div className="space-y-3">
                            <Label>Permissions</Label>
                            {SCOPE_OPTIONS.map((scope) => (
                              <div key={scope.value} className="flex items-start gap-3">
                                <Checkbox
                                  id={`scope-${scope.value}`}
                                  checked={newKeyScopes.includes(scope.value)}
                                  onCheckedChange={() => handleScopeToggle(scope.value)}
                                />
                                <div className="grid gap-0.5 leading-none">
                                  <label
                                    htmlFor={`scope-${scope.value}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {scope.label}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    {scope.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleDialogClose}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateKey} disabled={isCreating}>
                            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Key
                          </Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>API Key Created</DialogTitle>
                          <DialogDescription>
                            Copy your API key now. You won&apos;t be able to see it again.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                              This is the only time you&apos;ll see this key. Copy it now and store it securely.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2">
                            <Label>Your API Key</Label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  readOnly
                                  value={showSecret ? newKeyResult.secret : '•'.repeat(40)}
                                  className="font-mono text-sm pr-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowSecret(!showSecret)}
                                >
                                  {showSecret ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopySecret}
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleDialogClose}>Done</Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
              <CardDescription>
                Use API keys to authenticate requests to the API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No API keys yet</p>
                  <p className="text-sm">Create your first API key to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        !key.isActive ? 'opacity-60 bg-muted/50' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          {!key.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Revoked
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {key.keyPrefix}
                          </code>
                          <span>
                            Created {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                          </span>
                          {key.lastUsedAt && (
                            <span>
                              Last used {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-1">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs capitalize">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {key.isActive && (
                            <DropdownMenuItem
                              onClick={() => handleRevokeKey(key.id)}
                              className="text-warning"
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteKey(key.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Receive real-time notifications when events occur
              </p>
            </div>
            <CreateWebhookDialog
              isOpen={webhooks.isCreateDialogOpen}
              onOpenChange={webhooks.setIsCreateDialogOpen}
              newName={webhooks.newName}
              newUrl={webhooks.newUrl}
              selectedEvents={webhooks.selectedEvents}
              isCreating={webhooks.isCreating}
              onNameChange={webhooks.setNewName}
              onUrlChange={webhooks.setNewUrl}
              onEventToggle={webhooks.handleEventToggle}
              onCategoryToggle={webhooks.handleCategoryToggle}
              onSubmit={webhooks.handleCreate}
              onCancel={webhooks.handleCloseCreateDialog}
            />
          </div>

          {webhooks.webhooks.length === 0 ? (
            <WebhookEmptyState onAddWebhook={() => webhooks.setIsCreateDialogOpen(true)} />
          ) : (
            <div className="space-y-3">
              {webhooks.webhooks.map((webhook) => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  isTesting={webhooks.isTesting === webhook.id}
                  onToggleActive={() => webhooks.handleToggleActive(webhook)}
                  onTest={() => webhooks.handleTest(webhook.id)}
                  onOpenDetail={() => webhooks.handleOpenDetail(webhook)}
                  onRegenerateSecret={() => webhooks.handleRegenerateSecret(webhook.id)}
                  onDelete={() => webhooks.handleDelete(webhook.id)}
                />
              ))}
            </div>
          )}

          {/* Webhook Detail Sheet */}
          <WebhookDetailSheet
            isOpen={webhooks.isDetailSheetOpen}
            onOpenChange={webhooks.setIsDetailSheetOpen}
            webhook={webhooks.selectedWebhook}
            deliveries={webhooks.deliveries}
            isLoadingDeliveries={webhooks.isLoadingDeliveries}
            isSecretVisible={webhooks.selectedWebhook ? webhooks.visibleSecrets[webhooks.selectedWebhook.id] ?? false : false}
            isCopied={webhooks.selectedWebhook ? webhooks.copiedId === webhooks.selectedWebhook.id : false}
            onToggleSecretVisibility={() => webhooks.selectedWebhook && webhooks.toggleSecretVisibility(webhooks.selectedWebhook.id)}
            onCopySecret={() => webhooks.selectedWebhook && webhooks.handleCopySecret(webhooks.selectedWebhook.secret, webhooks.selectedWebhook.id)}
            onRetryDelivery={webhooks.handleRetryDelivery}
          />
        </TabsContent>
      </Tabs>

      {/* Third-Party Integrations - Coming Soon */}
      <Card className="border-dashed opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            <CardTitle className="text-base">Third-Party Integrations</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          </div>
          <CardDescription>
            Connect with your existing tools and workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Jira', 'ServiceNow', 'Slack', 'Microsoft Teams', 'SAP', 'Salesforce'].map((integration) => (
              <div
                key={integration}
                className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm">{integration}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
