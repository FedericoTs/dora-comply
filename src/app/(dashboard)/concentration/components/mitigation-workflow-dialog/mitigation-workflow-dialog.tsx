'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Accordion } from '@/components/ui/accordion';
import type { MitigationWorkflowDialogProps } from './types';
import { useMitigationWorkflow } from './use-mitigation-workflow';
import { WorkflowHeader } from './workflow-header';
import { WorkflowProgress } from './workflow-progress';
import { AffectedVendorsSection, AffectedFunctionsSection } from './affected-resources';
import { ActionItemsList } from './action-items-list';
import { WorkflowFooter } from './workflow-footer';

export function MitigationWorkflowDialog({
  alert,
  open,
  onOpenChange,
}: MitigationWorkflowDialogProps) {
  const {
    actionItems,
    expandedSection,
    setExpandedSection,
    completedCount,
    totalCount,
    progressPercentage,
    handleToggleAction,
    handleNavigate,
    handleMarkAllComplete,
    handleResetProgress,
    handleMarkResolved,
  } = useMitigationWorkflow({ alert, onOpenChange });

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <WorkflowHeader alert={alert} />

        <div className="space-y-6 mt-4">
          {/* Progress Overview */}
          <WorkflowProgress
            alert={alert}
            completedCount={completedCount}
            totalCount={totalCount}
            progressPercentage={progressPercentage}
          />

          {/* Affected Resources */}
          <Accordion
            type="single"
            collapsible
            value={expandedSection}
            onValueChange={setExpandedSection}
          >
            {/* Affected Vendors */}
            <AffectedVendorsSection
              vendors={alert.affected_vendors}
              onNavigate={handleNavigate}
            />

            {/* Affected Functions */}
            <AffectedFunctionsSection functions={alert.affected_functions} />

            {/* Action Items */}
            <ActionItemsList
              actionItems={actionItems}
              completedCount={completedCount}
              totalCount={totalCount}
              onToggleAction={handleToggleAction}
              onNavigate={handleNavigate}
            />
          </Accordion>

          {/* Action Buttons */}
          <WorkflowFooter
            completedCount={completedCount}
            totalCount={totalCount}
            progressPercentage={progressPercentage}
            onResetProgress={handleResetProgress}
            onMarkAllComplete={handleMarkAllComplete}
            onClose={() => onOpenChange(false)}
            onMarkResolved={handleMarkResolved}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
