'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rocket, Check, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface GettingStartedWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  completed: boolean;
}

export function GettingStartedWidget({ title, config }: GettingStartedWidgetProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/getting-started');
        if (res.ok) {
          const json = await res.json();
          setItems(json.items || []);
        }
      } catch {
        // Use defaults
        setItems([
          { id: '1', label: 'Add your first vendor', href: '/vendors/new', completed: false },
          { id: '2', label: 'Upload a document', href: '/documents', completed: false },
          { id: '3', label: 'Complete your profile', href: '/settings', completed: false },
          { id: '4', label: 'Set up notifications', href: '/settings/notifications', completed: false },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-2 bg-muted rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const completedCount = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Rocket className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Getting Started'}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedCount}/{items.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors group ${
              item.completed
                ? 'bg-emerald-50 text-emerald-700'
                : 'hover:bg-muted/50'
            }`}
          >
            <div
              className={`h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                item.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-muted-foreground/30'
              }`}
            >
              {item.completed && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className={`text-sm flex-1 ${item.completed ? 'line-through' : ''}`}>
              {item.label}
            </span>
            {!item.completed && (
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
