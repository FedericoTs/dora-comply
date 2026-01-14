'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ConcentrationAlert } from '@/lib/concentration/types';
import type { ActionItem, StoredActions } from './types';
import { ALERT_WORKFLOWS, STORAGE_KEY } from './constants';

interface UseMitigationWorkflowProps {
  alert: ConcentrationAlert | null;
  onOpenChange: (open: boolean) => void;
}

export function useMitigationWorkflow({ alert, onOpenChange }: UseMitigationWorkflowProps) {
  const router = useRouter();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [expandedSection, setExpandedSection] = useState<string>('actions');

  // Load completed actions from localStorage
  const loadStoredActions = useCallback((alertId: string): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredActions = JSON.parse(stored);
        return parsed[alertId]?.completedActions || [];
      }
    } catch (e) {
      console.error('Failed to load stored actions:', e);
    }
    return [];
  }, []);

  // Save completed actions to localStorage
  const saveStoredActions = useCallback((alertId: string, completedActions: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: StoredActions = stored ? JSON.parse(stored) : {};
      parsed[alertId] = {
        completedActions,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      console.error('Failed to save stored actions:', e);
    }
  }, []);

  // Initialize action items when alert changes
  useEffect(() => {
    if (!alert) return;

    const workflow = ALERT_WORKFLOWS[alert.type];
    if (!workflow) return;

    const completedActions = loadStoredActions(alert.id);
    const vendorId = alert.affected_vendors[0] || '';

    const items: ActionItem[] = workflow.actions.map((action, index) => ({
      id: `${alert.id}-action-${index}`,
      label: action.label,
      description: action.description,
      link: action.link?.replace('{vendorId}', vendorId),
      linkLabel: action.linkLabel,
      completed: completedActions.includes(`${alert.id}-action-${index}`),
    }));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActionItems(items);
  }, [alert, loadStoredActions]);

  const handleToggleAction = useCallback((actionId: string) => {
    if (!alert) return;

    setActionItems((prev) => {
      const updated = prev.map((item) =>
        item.id === actionId ? { ...item, completed: !item.completed } : item
      );

      // Save to localStorage
      const completedIds = updated.filter((a) => a.completed).map((a) => a.id);
      saveStoredActions(alert.id, completedIds);

      return updated;
    });
  }, [alert, saveStoredActions]);

  const handleNavigate = useCallback((link: string) => {
    router.push(link);
    onOpenChange(false);
  }, [router, onOpenChange]);

  const handleMarkAllComplete = useCallback(() => {
    if (!alert) return;

    setActionItems((prev) => {
      const updated = prev.map((item) => ({ ...item, completed: true }));
      const completedIds = updated.map((a) => a.id);
      saveStoredActions(alert.id, completedIds);
      return updated;
    });
    toast.success('All actions marked as complete');
  }, [alert, saveStoredActions]);

  const handleResetProgress = useCallback(() => {
    if (!alert) return;

    setActionItems((prev) => prev.map((item) => ({ ...item, completed: false })));
    saveStoredActions(alert.id, []);
    toast.info('Progress reset');
  }, [alert, saveStoredActions]);

  const handleMarkResolved = useCallback(() => {
    toast.success('Alert resolved! Great job completing all actions.');
    onOpenChange(false);
  }, [onOpenChange]);

  const completedCount = actionItems.filter((a) => a.completed).length;
  const totalCount = actionItems.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
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
  };
}
