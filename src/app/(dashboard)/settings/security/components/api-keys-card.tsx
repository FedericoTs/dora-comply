'use client';

/**
 * API Keys Card Component
 *
 * Manage API keys for programmatic access to the platform.
 */

import { useState, useEffect, useTransition } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  PowerOff,
  Clock,
  Shield,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  deleteApiKey,
  type ApiKey,
  type ApiKeyScope,
  type ApiKeyWithSecret,
} from '@/lib/settings/api-keys';

// ============================================================================
// Component
// ============================================================================

export function ApiKeysCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scopes: ['read'] as ApiKeyScope[],
    expiresIn: 'never' as 'never' | '30' | '90' | '365',
  });

  // Load API keys
  const loadApiKeys = async () => {
    setIsLoading(true);
    const result = await listApiKeys();
    if (result.success && result.data) {
      setApiKeys(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  // Handle create API key
  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    startTransition(async () => {
      // Calculate expiry date
      let expiresAt: string | undefined;
      if (formData.expiresIn !== 'never') {
        const days = parseInt(formData.expiresIn);
        const date = new Date();
        date.setDate(date.getDate() + days);
        expiresAt = date.toISOString();
      }

      const result = await createApiKey({
        name: formData.name,
        description: formData.description || undefined,
        scopes: formData.scopes,
        expiresAt,
      });

      if (result.success && result.data) {
        setNewKeySecret(result.data.secret);
        setShowCreateDialog(false);
        setShowSecretDialog(true);
        setFormData({
          name: '',
          description: '',
          scopes: ['read'],
          expiresIn: 'never',
        });
        loadApiKeys();
        toast.success('API key created successfully');
      } else {
        toast.error(result.error || 'Failed to create API key');
      }
    });
  };

  // Handle revoke API key
  const handleRevoke = (key: ApiKey) => {
    startTransition(async () => {
      const result = await revokeApiKey(key.id);
      if (result.success) {
        loadApiKeys();
        toast.success('API key revoked');
      } else {
        toast.error(result.error || 'Failed to revoke API key');
      }
    });
  };

  // Handle delete API key
  const handleDelete = () => {
    if (!keyToDelete) return;

    startTransition(async () => {
      const result = await deleteApiKey(keyToDelete.id);
      if (result.success) {
        setKeyToDelete(null);
        loadApiKeys();
        toast.success('API key deleted');
      } else {
        toast.error(result.error || 'Failed to delete API key');
      }
    });
  };

  // Handle copy to clipboard
  const copyToClipboard = async (text: string, keyId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (keyId) {
        setCopiedKeyId(keyId);
        setTimeout(() => setCopiedKeyId(null), 2000);
      }
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Toggle scope
  const toggleScope = (scope: ApiKeyScope) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const activeKeys = apiKeys.filter((k) => k.isActive);
  const revokedKeys = apiKeys.filter((k) => !k.isActive);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              <CardTitle className="text-base">API Keys</CardTitle>
            </div>
            {activeKeys.length > 0 && (
              <Badge variant="secondary">{activeKeys.length} active</Badge>
            )}
          </div>
          <CardDescription>
            Create and manage API keys for programmatic access to the platform.
            Keys can be scoped with read, write, or admin permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Active Keys */}
              {activeKeys.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Active Keys</h4>
                  <div className="space-y-2">
                    {activeKeys.map((key) => {
                      const isExpired = key.expiresAt && isPast(new Date(key.expiresAt));

                      return (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                              <Key className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">
                                  {key.name}
                                </p>
                                {isExpired && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                                  {key.keyPrefix}
                                </code>
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  {key.scopes.join(', ')}
                                </span>
                                {key.lastUsedAt && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Used {formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-warning"
                              onClick={() => handleRevoke(key)}
                              disabled={isPending}
                              title="Revoke key"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setKeyToDelete(key)}
                              disabled={isPending}
                              title="Delete key"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Revoked Keys */}
              {revokedKeys.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Revoked Keys
                  </h4>
                  <div className="space-y-2 opacity-60">
                    {revokedKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-muted rounded-lg shrink-0">
                            <Key className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-muted-foreground line-through truncate">
                              {key.name}
                            </p>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {key.keyPrefix}
                            </code>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setKeyToDelete(key)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {apiKeys.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No API keys yet</p>
                  <p className="text-xs mt-1">
                    Create your first API key to access the platform programmatically
                  </p>
                </div>
              )}

              <Separator />

              {/* Create Button */}
              <Button
                variant={apiKeys.length === 0 ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Create API Key
            </DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access. The key will only be
              shown once upon creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., CI/CD Pipeline"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What will this key be used for?"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2">
                {(['read', 'write', 'admin'] as const).map((scope) => (
                  <div key={scope} className="flex items-center gap-3">
                    <Checkbox
                      id={`scope-${scope}`}
                      checked={formData.scopes.includes(scope)}
                      onCheckedChange={() => toggleScope(scope)}
                    />
                    <label
                      htmlFor={`scope-${scope}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <span className="font-medium capitalize">{scope}</span>
                      <span className="text-muted-foreground ml-2">
                        {scope === 'read' && '- Read data and view reports'}
                        {scope === 'write' && '- Create and update records'}
                        {scope === 'admin' && '- Full administrative access'}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiration</Label>
              <Select
                value={formData.expiresIn}
                onValueChange={(v) =>
                  setFormData({ ...formData, expiresIn: v as typeof formData.expiresIn })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Display Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. You won&apos;t be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
              <code className="flex-1 text-sm font-mono break-all">
                {newKeySecret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => newKeySecret && copyToClipboard(newKeySecret, 'new')}
              >
                {copiedKeyId === 'new' ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-sm text-warning">
                Make sure to copy your API key now. For security reasons, you
                won&apos;t be able to see it again after closing this dialog.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowSecretDialog(false);
                setNewKeySecret(null);
              }}
            >
              I&apos;ve copied my key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!keyToDelete}
        onOpenChange={() => setKeyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the API key &quot;
              {keyToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
