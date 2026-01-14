'use client';

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { ActionItem } from './types';

interface ActionItemsListProps {
  actionItems: ActionItem[];
  completedCount: number;
  totalCount: number;
  onToggleAction: (actionId: string) => void;
  onNavigate: (link: string) => void;
}

export function ActionItemsList({
  actionItems,
  completedCount,
  totalCount,
  onToggleAction,
  onNavigate,
}: ActionItemsListProps) {
  return (
    <AccordionItem value="actions">
      <AccordionTrigger className="text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Action Items ({completedCount}/{totalCount})
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {actionItems.map((action, index) => (
            <ActionItemRow
              key={action.id}
              action={action}
              index={index}
              onToggle={() => onToggleAction(action.id)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface ActionItemRowProps {
  action: ActionItem;
  index: number;
  onToggle: () => void;
  onNavigate: (link: string) => void;
}

function ActionItemRow({ action, index, onToggle, onNavigate }: ActionItemRowProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        action.completed
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-muted/30 hover:bg-muted/50'
      )}
    >
      <Checkbox
        id={action.id}
        checked={action.completed}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={action.id}
          className={cn(
            'text-sm font-medium cursor-pointer',
            action.completed && 'line-through text-muted-foreground'
          )}
        >
          {index + 1}. {action.label}
        </label>
        <p className="text-xs text-muted-foreground mt-0.5">
          {action.description}
        </p>
        {action.link && !action.completed && (
          <Button
            variant="link"
            size="sm"
            className="h-6 px-0 text-xs mt-1"
            onClick={() => onNavigate(action.link!)}
          >
            {action.linkLabel || 'Go to page'}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      {action.completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      )}
    </div>
  );
}
