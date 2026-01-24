'use client';

import { useState, useTransition, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import type { LayoutItem, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  ArrowLeft,
  Plus,
  Settings,
  Trash2,
  GripVertical,
  LayoutDashboard,
  Hash,
  BarChart,
  List,
  Table2,
  Sparkles,
  ChevronRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  DashboardWithWidgets,
  DashboardWidget,
  WidgetType,
  WidgetCategory,
  WidgetDefinition,
} from '@/lib/dashboards/types';
import {
  WIDGET_CATALOG,
  WIDGET_CATEGORY_LABELS,
  getWidgetDefinition,
  getWidgetsByCategory,
} from '@/lib/dashboards/types';
import {
  updateDashboardAction,
  createWidgetAction,
  deleteWidgetAction,
  updateWidgetPositionsAction,
} from '@/lib/dashboards/actions';
import { WidgetRenderer } from '@/components/dashboards/widgets';
import { toast } from 'sonner';

interface DashboardBuilderClientProps {
  dashboard: DashboardWithWidgets;
}

export function DashboardBuilderClient({ dashboard: initialDashboard }: DashboardBuilderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [widgets, setWidgets] = useState(initialDashboard.widgets);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [deleteWidgetId, setDeleteWidgetId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);

  // Container width for react-grid-layout
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1200 });

  // Settings form state
  const [settingsName, setSettingsName] = useState(dashboard.name);
  const [settingsDesc, setSettingsDesc] = useState(dashboard.description || '');
  const [settingsShared, setSettingsShared] = useState(dashboard.is_shared);

  // Convert widgets to react-grid-layout format
  const layout = useMemo((): LayoutItem[] => {
    return widgets.map((w) => ({
      i: w.id,
      x: w.grid_x,
      y: w.grid_y,
      w: w.grid_w,
      h: w.grid_h,
      minW: 2,
      minH: 2,
      static: isLocked,
    }));
  }, [widgets, isLocked]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (isLocked) return;

      // Check if layout actually changed
      const hasChanges = newLayout.some((item) => {
        const widget = widgets.find((w) => w.id === item.i);
        if (!widget) return false;
        return (
          widget.grid_x !== item.x ||
          widget.grid_y !== item.y ||
          widget.grid_w !== item.w ||
          widget.grid_h !== item.h
        );
      });

      if (!hasChanges) return;

      // Update local state immediately
      setWidgets((prev) =>
        prev.map((w) => {
          const layoutItem = newLayout.find((l) => l.i === w.id);
          if (!layoutItem) return w;
          return {
            ...w,
            grid_x: layoutItem.x,
            grid_y: layoutItem.y,
            grid_w: layoutItem.w,
            grid_h: layoutItem.h,
          };
        })
      );

      // Save to database (debounced through transition)
      startTransition(async () => {
        const positions = newLayout.map((item) => ({
          id: item.i,
          grid_x: item.x,
          grid_y: item.y,
          grid_w: item.w,
          grid_h: item.h,
        }));

        const result = await updateWidgetPositionsAction(dashboard.id, positions);
        if (!result.success) {
          toast.error('Failed to save layout');
        }
      });
    },
    [widgets, isLocked, dashboard.id]
  );

  const handleSaveSettings = async () => {
    startTransition(async () => {
      const result = await updateDashboardAction(dashboard.id, {
        name: settingsName,
        description: settingsDesc || undefined,
        is_shared: settingsShared,
      });

      if (result.success && result.data) {
        setDashboard((prev) => ({
          ...prev,
          name: result.data!.name,
          description: result.data!.description,
          is_shared: result.data!.is_shared,
        }));
        toast.success('Dashboard settings saved');
        setShowSettings(false);
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    });
  };

  const handleAddWidget = async (widgetType: WidgetType) => {
    const definition = getWidgetDefinition(widgetType);
    if (!definition) return;

    // Find a suitable position for the new widget
    const maxY =
      widgets.length > 0 ? Math.max(...widgets.map((w) => w.grid_y + w.grid_h)) : 0;

    startTransition(async () => {
      const result = await createWidgetAction({
        dashboard_id: dashboard.id,
        widget_type: widgetType,
        grid_x: 0,
        grid_y: maxY,
        grid_w: definition.defaultWidth,
        grid_h: definition.defaultHeight,
      });

      if (result.success && result.data) {
        setWidgets((prev) => [...prev, result.data!]);
        toast.success('Widget added');
        setShowAddWidget(false);
      } else {
        toast.error(result.error || 'Failed to add widget');
      }
    });
  };

  const handleDeleteWidget = async (widgetId: string) => {
    startTransition(async () => {
      const result = await deleteWidgetAction(widgetId, dashboard.id);

      if (result.success) {
        setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
        toast.success('Widget removed');
      } else {
        toast.error(result.error || 'Failed to remove widget');
      }
      setDeleteWidgetId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
              {dashboard.is_default && <Badge variant="secondary">Default</Badge>}
              {dashboard.is_shared && <Badge variant="outline">Shared</Badge>}
            </div>
            {dashboard.description && (
              <p className="text-muted-foreground mt-1">{dashboard.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLocked ? 'outline' : 'default'}
            size="sm"
            onClick={() => setIsLocked(!isLocked)}
          >
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Editing
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowAddWidget(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Editing mode indicator */}
      {!isLocked && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 text-sm text-primary flex items-center gap-2">
          <GripVertical className="h-4 w-4" />
          <span>
            Drag widgets to reposition them. Resize using the handle in the bottom-right corner.
          </span>
        </div>
      )}

      {/* Widget Grid */}
      <div ref={containerRef as React.RefObject<HTMLDivElement>}>
        {widgets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <LayoutDashboard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium text-lg">No widgets yet</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Add widgets to your dashboard to visualize your compliance data
              </p>
              <Button className="mt-6" onClick={() => setShowAddWidget(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : mounted ? (
          <ResponsiveGridLayout
            className="layout"
            width={width}
            layouts={{ lg: layout, md: layout, sm: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768 }}
            cols={{ lg: dashboard.columns, md: 8, sm: 4 }}
            rowHeight={dashboard.row_height}
            onLayoutChange={(newLayout) => handleLayoutChange(newLayout)}
            dragConfig={{
              enabled: !isLocked,
              handle: '.drag-handle',
            }}
            resizeConfig={{
              enabled: !isLocked,
            }}
            margin={[16, 16]}
            containerPadding={[0, 0]}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetCard
                  widget={widget}
                  onDelete={() => setDeleteWidgetId(widget.id)}
                  isLocked={isLocked}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${dashboard.columns}, 1fr)` }}>
            {widgets.map((widget) => (
              <div key={widget.id} style={{ gridColumn: `span ${widget.grid_w}` }}>
                <Card className="h-full">
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-8 w-16 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Widget Sheet */}
      <Sheet open={showAddWidget} onOpenChange={setShowAddWidget}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Add Widget</SheetTitle>
            <SheetDescription>Choose a widget to add to your dashboard</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <Tabs defaultValue="stats">
              <TabsList className="w-full justify-start">
                {(Object.keys(WIDGET_CATEGORY_LABELS) as WidgetCategory[]).map((category) => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {WIDGET_CATEGORY_LABELS[category].label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(WIDGET_CATEGORY_LABELS) as WidgetCategory[]).map((category) => (
                <TabsContent key={category} value={category}>
                  <ScrollArea className="h-[calc(100vh-250px)]">
                    <div className="space-y-2 pr-4">
                      {getWidgetsByCategory(category).map((widget) => (
                        <WidgetOption
                          key={widget.type}
                          widget={widget}
                          onClick={() => handleAddWidget(widget.type)}
                          disabled={isPending}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>
              Configure your dashboard settings and sharing options
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Dashboard Name</Label>
              <Input
                id="settings-name"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-desc">Description</Label>
              <Textarea
                id="settings-desc"
                value={settingsDesc}
                onChange={(e) => setSettingsDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Share with team</Label>
                <p className="text-sm text-muted-foreground">
                  Allow other team members to view this dashboard
                </p>
              </div>
              <Switch checked={settingsShared} onCheckedChange={setSettingsShared} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Widget Confirmation */}
      <AlertDialog open={!!deleteWidgetId} onOpenChange={() => setDeleteWidgetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Widget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this widget from your dashboard?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWidgetId && handleDeleteWidget(deleteWidgetId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface WidgetCardProps {
  widget: DashboardWidget;
  onDelete: () => void;
  isLocked: boolean;
}

function WidgetCard({ widget, onDelete, isLocked }: WidgetCardProps) {
  const definition = getWidgetDefinition(widget.widget_type);

  return (
    <Card className="h-full group relative overflow-hidden">
      {/* Drag handle - only shown when unlocked */}
      {!isLocked && (
        <div className="drag-handle absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-move bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Delete button overlay */}
      {!isLocked && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      <CardHeader className={cn('pb-2', !isLocked && 'pt-10')}>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <WidgetIcon type={widget.widget_type} className="h-4 w-4 text-muted-foreground" />
          {widget.title || definition?.name || widget.widget_type}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] overflow-auto">
        <WidgetRenderer widget={widget} />
      </CardContent>
    </Card>
  );
}

interface WidgetOptionProps {
  widget: WidgetDefinition;
  onClick: () => void;
  disabled: boolean;
}

function WidgetOption({ widget, onClick, disabled }: WidgetOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full p-3 rounded-lg border text-left transition-colors',
        'hover:bg-accent hover:border-primary/50',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <WidgetIcon type={widget.type} className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{widget.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{widget.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
    </button>
  );
}

function WidgetIcon({ type, className }: { type: WidgetType; className?: string }) {
  if (type.startsWith('stat_')) {
    return <Hash className={className} />;
  }
  if (type.startsWith('chart_')) {
    return <BarChart className={className} />;
  }
  if (type.startsWith('list_')) {
    return <List className={className} />;
  }
  if (type.startsWith('table_')) {
    return <Table2 className={className} />;
  }
  return <Sparkles className={className} />;
}
