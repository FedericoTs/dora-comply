'use client';

import { Suspense } from 'react';
import type { DashboardWidget, WidgetType } from '@/lib/dashboards/types';
import { Skeleton } from '@/components/ui/skeleton';

// Stat widgets
import { VendorsCountWidget } from './stats/vendors-count-widget';
import { VendorsByTierWidget } from './stats/vendors-by-tier-widget';
import { VendorsByRiskWidget } from './stats/vendors-by-risk-widget';
import { IncidentsCountWidget } from './stats/incidents-count-widget';
import { TasksCountWidget } from './stats/tasks-count-widget';
import { ComplianceScoreWidget } from './stats/compliance-score-widget';

// List widgets
import { HighRiskVendorsWidget } from './lists/high-risk-vendors-widget';
import { PendingTasksWidget } from './lists/pending-tasks-widget';
import { OpenIncidentsWidget } from './lists/open-incidents-widget';

// Special widgets
import { QuickActionsWidget } from './special/quick-actions-widget';
import { GettingStartedWidget } from './special/getting-started-widget';

interface WidgetRendererProps {
  widget: DashboardWidget;
}

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  return (
    <Suspense fallback={<WidgetSkeleton type={widget.widget_type} />}>
      <WidgetContent widget={widget} />
    </Suspense>
  );
}

function WidgetContent({ widget }: WidgetRendererProps) {
  const { widget_type, config, title } = widget;

  switch (widget_type) {
    // Stat widgets
    case 'stat_vendors_count':
      return <VendorsCountWidget title={title} config={config} />;
    case 'stat_vendors_by_tier':
      return <VendorsByTierWidget title={title} config={config} />;
    case 'stat_vendors_by_risk':
      return <VendorsByRiskWidget title={title} config={config} />;
    case 'stat_incidents_count':
      return <IncidentsCountWidget title={title} config={config} />;
    case 'stat_tasks_count':
      return <TasksCountWidget title={title} config={config} />;
    case 'stat_compliance_score':
      return <ComplianceScoreWidget title={title} config={config} />;

    // List widgets
    case 'list_high_risk_vendors':
      return <HighRiskVendorsWidget title={title} config={config} />;
    case 'list_pending_tasks':
      return <PendingTasksWidget title={title} config={config} />;
    case 'list_open_incidents':
      return <OpenIncidentsWidget title={title} config={config} />;

    // Special widgets
    case 'quick_actions':
      return <QuickActionsWidget title={title} config={config} />;
    case 'getting_started':
      return <GettingStartedWidget title={title} config={config} />;

    // Placeholder for unimplemented widgets
    default:
      return <PlaceholderWidget type={widget_type} />;
  }
}

function WidgetSkeleton({ type }: { type: WidgetType }) {
  if (type.startsWith('stat_')) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  if (type.startsWith('list_')) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return <Skeleton className="h-24 w-full" />;
}

function PlaceholderWidget({ type }: { type: WidgetType }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
      Widget "{type}" coming soon
    </div>
  );
}
