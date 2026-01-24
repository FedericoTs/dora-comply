'use client';

/**
 * Export Progress Button Component
 *
 * Generates and downloads a progress report for a remediation plan.
 */

import { useState } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  RemediationPlanWithRelations,
  RemediationActionWithRelations,
} from '@/lib/remediation/types';
import { PLAN_STATUS_INFO, ACTION_STATUS_INFO, PRIORITY_INFO } from '@/lib/remediation/types';
import { toast } from 'sonner';

interface ExportProgressButtonProps {
  plan: RemediationPlanWithRelations;
  actions: RemediationActionWithRelations[];
}

export function ExportProgressButton({ plan, actions }: ExportProgressButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const generateCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'Action Ref',
        'Title',
        'Status',
        'Priority',
        'Type',
        'Assignee',
        'Due Date',
        'Requires Evidence',
        'Evidence Count',
        'Evidence Verified',
        'Estimated Hours',
        'Actual Hours',
        'Created At',
      ];

      const rows = actions.map(action => [
        action.action_ref,
        `"${action.title.replace(/"/g, '""')}"`,
        ACTION_STATUS_INFO[action.status].label,
        PRIORITY_INFO[action.priority].label,
        action.action_type,
        action.assignee?.full_name || 'Unassigned',
        action.due_date ? format(new Date(action.due_date), 'yyyy-MM-dd') : '',
        action.requires_evidence ? 'Yes' : 'No',
        action.evidence?.length || 0,
        action.evidence?.filter(e => e.verified_at).length || 0,
        action.estimated_hours || '',
        action.actual_hours || '',
        format(new Date(action.created_at), 'yyyy-MM-dd'),
      ]);

      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${plan.plan_ref}-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Progress report exported as CSV');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const generateMarkdown = () => {
    setIsExporting(true);
    try {
      const total = actions.length;
      const completed = actions.filter(a => a.status === 'completed').length;
      const blocked = actions.filter(a => a.status === 'blocked').length;
      const overdue = actions.filter(a =>
        a.due_date &&
        isPast(new Date(a.due_date)) &&
        !['completed', 'cancelled'].includes(a.status)
      ).length;

      let md = `# Remediation Plan Progress Report\n\n`;
      md += `**Plan:** ${plan.plan_ref} - ${plan.title}\n`;
      md += `**Generated:** ${format(new Date(), 'MMMM d, yyyy HH:mm')}\n\n`;

      md += `## Summary\n\n`;
      md += `| Metric | Value |\n`;
      md += `|--------|-------|\n`;
      md += `| Status | ${PLAN_STATUS_INFO[plan.status].label} |\n`;
      md += `| Priority | ${PRIORITY_INFO[plan.priority].label} |\n`;
      md += `| Progress | ${plan.progress_percentage}% |\n`;
      md += `| Total Actions | ${total} |\n`;
      md += `| Completed | ${completed} |\n`;
      md += `| Blocked | ${blocked} |\n`;
      md += `| Overdue | ${overdue} |\n`;
      if (plan.target_date) {
        const daysRemaining = differenceInDays(new Date(plan.target_date), new Date());
        md += `| Target Date | ${format(new Date(plan.target_date), 'MMM d, yyyy')} (${daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}) |\n`;
      }
      if (plan.owner) {
        md += `| Owner | ${plan.owner.full_name} |\n`;
      }
      md += `\n`;

      md += `## Status Breakdown\n\n`;
      const statusCounts = actions.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      md += `| Status | Count | Percentage |\n`;
      md += `|--------|-------|------------|\n`;
      Object.entries(statusCounts).forEach(([status, count]) => {
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        md += `| ${ACTION_STATUS_INFO[status as keyof typeof ACTION_STATUS_INFO]?.label || status} | ${count} | ${percent}% |\n`;
      });
      md += `\n`;

      md += `## Actions\n\n`;
      actions.forEach(action => {
        const status = ACTION_STATUS_INFO[action.status];
        md += `### ${action.action_ref}: ${action.title}\n\n`;
        md += `- **Status:** ${status.label}\n`;
        md += `- **Priority:** ${PRIORITY_INFO[action.priority].label}\n`;
        if (action.assignee) {
          md += `- **Assignee:** ${action.assignee.full_name}\n`;
        }
        if (action.due_date) {
          const isOverdue = isPast(new Date(action.due_date)) && !['completed', 'cancelled'].includes(action.status);
          md += `- **Due Date:** ${format(new Date(action.due_date), 'MMM d, yyyy')}${isOverdue ? ' ⚠️ OVERDUE' : ''}\n`;
        }
        if (action.requires_evidence) {
          const evidenceCount = action.evidence?.length || 0;
          const verifiedCount = action.evidence?.filter(e => e.verified_at).length || 0;
          md += `- **Evidence:** ${evidenceCount} uploaded, ${verifiedCount} verified\n`;
        }
        if (action.description) {
          md += `\n${action.description}\n`;
        }
        md += `\n`;
      });

      md += `---\n\n`;
      md += `*Report generated by NIS2 & DORA Compliance Platform*\n`;

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${plan.plan_ref}-progress-${format(new Date(), 'yyyy-MM-dd')}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Progress report exported as Markdown');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={generateCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateMarkdown}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
