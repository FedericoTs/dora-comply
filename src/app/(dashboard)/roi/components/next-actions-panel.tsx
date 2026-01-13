/**
 * Next Actions Panel
 *
 * Displays prioritized next actions for RoI completion
 */

import { Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityActionCard, PriorityActionCardCompact } from './priority-action-card';
import type { NextAction } from '@/lib/roi/types';
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

interface NextActionsPanelProps {
  actions: NextAction[];
}

export function NextActionsPanel({ actions }: NextActionsPanelProps) {
  const highPriority = actions.filter(a => a.priority === 'high');
  const quickWins = actions.filter(a => a.priority === 'low' || a.type === 'quick_win');
  const otherActions = actions.filter(
    a => a.priority !== 'high' && a.priority !== 'low' && a.type !== 'quick_win'
  );

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <Target className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="font-medium text-lg">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your Register of Information is complete. Ready for export.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Recommended Next Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High Priority Actions */}
        {highPriority.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              High Priority
              <HelpTooltip content={KPI_HELP.highPriorityActions} iconClassName="h-3 w-3" />
            </h4>
            <div className="grid gap-2">
              {highPriority.slice(0, 3).map(action => (
                <PriorityActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Other Actions */}
        {otherActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              In Progress
            </h4>
            <div className="grid gap-2">
              {otherActions.slice(0, 2).map(action => (
                <PriorityActionCardCompact key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-emerald-500" />
              Quick Wins ({quickWins.length})
              <HelpTooltip content={KPI_HELP.quickWins} iconClassName="h-3 w-3" />
            </h4>
            <div className="grid gap-2">
              {quickWins.slice(0, 3).map(action => (
                <PriorityActionCardCompact key={action.id} action={action} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
