'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  LayoutDashboard,
  Star,
  StarOff,
  MoreHorizontal,
  Copy,
  Trash2,
  Share2,
  Settings,
  Sparkles,
  Users,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/lib/dashboards/types';
import {
  createDashboardAction,
  deleteDashboardAction,
  cloneDashboardAction,
  toggleFavoriteAction,
  setDefaultDashboardAction,
} from '@/lib/dashboards/actions';
import { toast } from 'sonner';

interface DashboardListClientProps {
  initialDashboards: DashboardSummary[];
  templates: DashboardSummary[];
}

export function DashboardListClient({ initialDashboards, templates }: DashboardListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dashboards, setDashboards] = useState(initialDashboards);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardDesc, setNewDashboardDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const myDashboards = dashboards.filter((d) => !d.is_template);
  const favoriteDashboards = dashboards.filter((d) => d.is_favorited);

  const handleCreate = async () => {
    if (!newDashboardName.trim()) {
      toast.error('Please enter a dashboard name');
      return;
    }

    startTransition(async () => {
      let result;
      if (selectedTemplate) {
        result = await cloneDashboardAction(selectedTemplate, newDashboardName);
      } else {
        result = await createDashboardAction({
          name: newDashboardName,
          description: newDashboardDesc || undefined,
        });
      }

      if (result.success && result.data) {
        toast.success('Dashboard created');
        setShowCreateDialog(false);
        setNewDashboardName('');
        setNewDashboardDesc('');
        setSelectedTemplate(null);
        router.push(`/dashboards/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to create dashboard');
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteDashboardAction(id);
      if (result.success) {
        setDashboards((prev) => prev.filter((d) => d.id !== id));
        toast.success('Dashboard deleted');
      } else {
        toast.error(result.error || 'Failed to delete dashboard');
      }
      setShowDeleteDialog(null);
    });
  };

  const handleClone = async (dashboard: DashboardSummary) => {
    startTransition(async () => {
      const result = await cloneDashboardAction(dashboard.id, `${dashboard.name} (Copy)`);
      if (result.success && result.data) {
        toast.success('Dashboard cloned');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to clone dashboard');
      }
    });
  };

  const handleToggleFavorite = async (id: string) => {
    startTransition(async () => {
      const result = await toggleFavoriteAction(id);
      if (result.success) {
        setDashboards((prev) =>
          prev.map((d) => (d.id === id ? { ...d, is_favorited: result.data! } : d))
        );
      } else {
        toast.error(result.error || 'Failed to update favorite');
      }
    });
  };

  const handleSetDefault = async (id: string) => {
    startTransition(async () => {
      const result = await setDefaultDashboardAction(id);
      if (result.success) {
        setDashboards((prev) =>
          prev.map((d) => ({ ...d, is_default: d.id === id }))
        );
        toast.success('Default dashboard updated');
      } else {
        toast.error(result.error || 'Failed to set default');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Dashboards</p>
            <p className="text-2xl font-bold">{myDashboards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Favorites</p>
            <p className="text-2xl font-bold">{favoriteDashboards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Shared</p>
            <p className="text-2xl font-bold">{dashboards.filter((d) => d.is_shared).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Templates</p>
            <p className="text-2xl font-bold">{templates.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for My Dashboards / Favorites / Templates */}
      <Tabs defaultValue="my-dashboards" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="my-dashboards">My Dashboards</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
        </div>

        <TabsContent value="my-dashboards" className="space-y-4">
          {myDashboards.length === 0 ? (
            <EmptyState onCreateClick={() => setShowCreateDialog(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myDashboards.map((dashboard) => (
                <DashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  onToggleFavorite={() => handleToggleFavorite(dashboard.id)}
                  onClone={() => handleClone(dashboard)}
                  onDelete={() => setShowDeleteDialog(dashboard.id)}
                  onSetDefault={() => handleSetDefault(dashboard.id)}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {favoriteDashboards.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg">No favorites yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Click the star icon on any dashboard to add it to your favorites
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteDashboards.map((dashboard) => (
                <DashboardCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  onToggleFavorite={() => handleToggleFavorite(dashboard.id)}
                  onClone={() => handleClone(dashboard)}
                  onDelete={() => setShowDeleteDialog(dashboard.id)}
                  onSetDefault={() => handleSetDefault(dashboard.id)}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg">No templates available</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Dashboard templates will appear here once created
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => {
                    setSelectedTemplate(template.id);
                    setNewDashboardName(`${template.name} - Copy`);
                    setShowCreateDialog(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Create from Template' : 'Create Dashboard'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? 'Create a new dashboard based on the selected template'
                : 'Create a new custom dashboard with your choice of widgets'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dashboard Name</Label>
              <Input
                id="name"
                placeholder="My Dashboard"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
              />
            </div>
            {!selectedTemplate && (
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of this dashboard..."
                  value={newDashboardDesc}
                  onChange={(e) => setNewDashboardDesc(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedTemplate(null);
                setNewDashboardName('');
                setNewDashboardDesc('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Dashboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dashboard? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface DashboardCardProps {
  dashboard: DashboardSummary;
  onToggleFavorite: () => void;
  onClone: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isPending: boolean;
}

function DashboardCard({
  dashboard,
  onToggleFavorite,
  onClone,
  onDelete,
  onSetDefault,
  isPending,
}: DashboardCardProps) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                <Link
                  href={`/dashboards/${dashboard.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {dashboard.name}
                </Link>
              </CardTitle>
              <div className="flex items-center gap-1 mt-0.5">
                {dashboard.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
                {dashboard.is_shared && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Shared
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleFavorite}
              disabled={isPending}
            >
              {dashboard.is_favorited ? (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboards/${dashboard.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClone}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {!dashboard.is_default && (
                  <DropdownMenuItem onClick={onSetDefault}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {dashboard.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {dashboard.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{dashboard.widget_count} widgets</span>
          <span>
            {new Date(dashboard.updated_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface TemplateCardProps {
  template: DashboardSummary;
  onUse: () => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              {template.created_by_name && (
                <p className="text-xs text-muted-foreground">by {template.created_by_name}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Template
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {template.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{template.widget_count} widgets</span>
          <Button size="sm" onClick={onUse}>
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <LayoutDashboard className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-medium text-lg">No dashboards yet</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          Create your first custom dashboard to visualize your compliance data with
          drag-and-drop widgets
        </p>
        <Button className="mt-6" onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Create Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
