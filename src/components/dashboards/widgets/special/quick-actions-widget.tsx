'use client';

import Link from 'next/link';
import {
  Zap,
  Plus,
  Building2,
  FileText,
  AlertTriangle,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface QuickActionsWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

const defaultActions = [
  {
    label: 'Add Vendor',
    href: '/vendors/new',
    icon: Building2,
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Upload Document',
    href: '/documents',
    icon: FileText,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    label: 'Report Incident',
    href: '/incidents/new',
    icon: AlertTriangle,
    color: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Send Questionnaire',
    href: '/questionnaires',
    icon: ClipboardList,
    color: 'bg-purple-100 text-purple-700',
  },
];

export function QuickActionsWidget({ title, config }: QuickActionsWidgetProps) {
  const actions = defaultActions;

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Zap className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Quick Actions'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant="outline"
              className="w-full h-auto flex-col gap-1 py-3 hover:border-primary/50"
            >
              <div className={`p-1.5 rounded-md ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
