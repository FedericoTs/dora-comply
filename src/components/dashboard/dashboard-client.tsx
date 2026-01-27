'use client';

/**
 * Dashboard Client Component
 *
 * Framework-adaptive dashboard that changes based on the selected framework.
 * Receives pre-fetched data from the server component and renders
 * framework-specific pillars, deadlines, and labels.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  AlertTriangle,
  Calendar,
  Plus,
  FileText,
  ClipboardCheck,
  Shield,
  CheckCircle2,
} from 'lucide-react';

import { useFramework } from '@/lib/context/framework-context';
import { ComplianceGauge } from '@/components/dashboard/compliance-gauge';
import { VendorsByRiskCard } from '@/components/dashboard/vendors-by-risk-card';
import { PendingDeadlinesCard } from '@/components/dashboard/pending-deadlines-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { ActionRequired, type ActionItem } from '@/components/dashboard/action-required';
import {
  buildPillarsForFramework,
  getFrameworkGaugeLabel,
  extractDORAScores,
  extractNIS2Scores,
  type DORAScores,
  type NIS2Scores,
} from '@/lib/compliance/pillar-builders';
import {
  getFrameworkDeadline,
  getDeadlineStyles,
  shouldShowDeadlineCountdown,
} from '@/lib/compliance/framework-deadlines';

// =============================================================================
// Types
// =============================================================================

interface VendorStats {
  total: number;
  by_status: { active: number; pending: number; inactive: number; offboarding: number };
  by_tier: { critical: number; important: number; standard: number };
  by_risk: { critical: number; high: number; medium: number; low: number };
  pending_reviews: number;
}

interface DocumentStats {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

interface IncidentStats {
  total: number;
  by_status: Record<string, number>;
  by_classification?: Record<string, number>;
  by_type?: Record<string, number>;
  pending_reports?: number;
  overdue_reports?: number;
  avg_resolution_hours?: number | null;
}

interface MaturitySnapshot {
  overall_readiness_percent: number;
  pillar_ict_risk_mgmt_percent?: number;
  pillar_incident_reporting_percent?: number;
  pillar_resilience_testing_percent?: number;
  pillar_third_party_risk_percent?: number;
  pillar_info_sharing_percent?: number;
}

interface NIS2ComplianceData {
  overallPercentage: number;
  categories: Record<string, { percentage?: number }>;
}

interface TaskStats {
  overdue: number;
  due_this_week: number;
}

interface PendingDeadline {
  incident_id: string;
  incident_ref: string;
  incident_title: string;
  report_type: string;
  deadline: string;
  hours_remaining: number;
  is_overdue: boolean;
}

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_name?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  user_id?: string | null;
  user_email?: string | null;
}

export interface DashboardClientProps {
  // User info
  firstName: string;

  // Stats
  vendorStats: VendorStats;
  documentStats: DocumentStats;
  incidentStats: IncidentStats | null;
  taskStats: TaskStats | null;

  // Framework-specific compliance data
  maturitySnapshot: MaturitySnapshot | null;
  nis2Compliance: NIS2ComplianceData | null;

  // Lists
  pendingDeadlines: PendingDeadline[];
  recentActivity: Activity[];
  actionItems: ActionItem[];

  // Derived values
  totalVendors: number;
  criticalRisks: number;
  openIncidents: number;

  // State
  isNewUser: boolean;
  onboardingSteps: Array<{ done: boolean; label: string }>;
  completedSteps: number;
}

// =============================================================================
// Main Component
// =============================================================================

export function DashboardClient({
  firstName,
  vendorStats,
  documentStats,
  incidentStats,
  taskStats,
  maturitySnapshot,
  nis2Compliance,
  pendingDeadlines,
  recentActivity,
  actionItems,
  totalVendors,
  criticalRisks,
  openIncidents,
  isNewUser,
  onboardingSteps,
  completedSteps,
}: DashboardClientProps) {
  const { activeFramework } = useFramework();

  // Calculate framework-specific compliance score
  const complianceScore = useMemo(() => {
    switch (activeFramework) {
      case 'nis2':
        return nis2Compliance?.overallPercentage ?? 0;
      case 'dora':
        return maturitySnapshot?.overall_readiness_percent ?? 0;
      case 'gdpr':
      case 'iso27001':
        // Placeholder for future implementation
        return 0;
      default:
        return 0;
    }
  }, [activeFramework, maturitySnapshot, nis2Compliance]);

  // Build framework-specific pillars
  const pillars = useMemo(() => {
    let scores: DORAScores | NIS2Scores | undefined;

    switch (activeFramework) {
      case 'dora':
        scores = extractDORAScores(maturitySnapshot);
        // Fill in calculated scores if not available from snapshot
        if (!scores.ictRisk && complianceScore > 0) {
          scores.ictRisk = Math.round(complianceScore * 0.9);
        }
        if (!scores.incidents && incidentStats) {
          scores.incidents = Math.round(100 - (openIncidents / Math.max(incidentStats.total, 1)) * 100);
        }
        if (!scores.tprm && totalVendors > 0) {
          scores.tprm = Math.round(100 - (criticalRisks / totalVendors) * 100);
        }
        break;

      case 'nis2':
        scores = extractNIS2Scores(nis2Compliance?.categories ?? null);
        // Fill in calculated scores if not available
        if (!scores.supply_chain && totalVendors > 0) {
          scores.supply_chain = Math.round(100 - (criticalRisks / totalVendors) * 100);
        }
        if (!scores.incident_handling && incidentStats) {
          scores.incident_handling = Math.round(100 - (openIncidents / Math.max(incidentStats.total, 1)) * 100);
        }
        break;

      default:
        scores = undefined;
    }

    return buildPillarsForFramework(activeFramework, scores);
  }, [activeFramework, maturitySnapshot, nis2Compliance, complianceScore, incidentStats, openIncidents, totalVendors, criticalRisks]);

  // Get framework-specific label
  const gaugeLabel = getFrameworkGaugeLabel(activeFramework);

  // Get framework deadline info
  const deadline = getFrameworkDeadline(activeFramework);
  const deadlineStyles = getDeadlineStyles(deadline.urgencyLevel);
  const showDeadlineCountdown = shouldShowDeadlineCountdown(activeFramework);

  // ============================================================================
  // Onboarding View (New Users)
  // ============================================================================

  if (isNewUser) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s get your compliance program set up.
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground">Setup Progress</span>
            <span className="font-medium">{completedSteps} of {onboardingSteps.length} steps</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {onboardingSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className={`text-sm ${step.done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.done ? '✓' : '○'} {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/vendors/new"
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">Add First Vendor</span>
            <span className="text-sm text-muted-foreground text-center">Start tracking your third parties</span>
          </Link>
          <Link
            href="/documents"
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium">Upload Documents</span>
            <span className="text-sm text-muted-foreground text-center">SOC 2 reports, contracts, policies</span>
          </Link>
          <Link
            href="/incidents/new"
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="font-medium">Report Incident</span>
            <span className="text-sm text-muted-foreground text-center">Track ICT incidents</span>
          </Link>
        </div>

        {/* Framework-specific deadline banner */}
        {showDeadlineCountdown ? (
          <div className={`text-center p-6 rounded-lg border ${deadlineStyles.bg} ${deadlineStyles.border}`}>
            <p className={`font-medium ${deadlineStyles.text}`}>
              {deadline.displayText}
            </p>
            <p className={`text-sm mt-1 ${deadlineStyles.text} opacity-80`}>
              January 17, 2026
            </p>
          </div>
        ) : deadline.urgencyLevel === 'enforced' ? (
          <div className={`text-center p-6 rounded-lg border ${deadlineStyles.bg} ${deadlineStyles.border}`}>
            <p className={`font-medium ${deadlineStyles.text} flex items-center justify-center gap-2`}>
              <CheckCircle2 className="h-5 w-5" />
              {deadline.displayText}
            </p>
            <p className={`text-sm mt-1 ${deadlineStyles.text} opacity-80`}>
              Compliance is now mandatory
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // ============================================================================
  // Full Dashboard (Existing Users)
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your compliance overview
          </p>
        </div>

        {/* Framework-specific deadline badge */}
        {showDeadlineCountdown ? (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${deadlineStyles.bg} ${deadlineStyles.border}`}>
            <Calendar className={`h-4 w-4 ${deadlineStyles.icon}`} />
            <span className={`text-sm font-medium ${deadlineStyles.text}`}>
              {deadline.displayText}
            </span>
          </div>
        ) : deadline.urgencyLevel === 'enforced' ? (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${deadlineStyles.bg} ${deadlineStyles.border}`}>
            <CheckCircle2 className={`h-4 w-4 ${deadlineStyles.icon}`} />
            <span className={`text-sm font-medium ${deadlineStyles.text}`}>
              {deadline.displayText}
            </span>
          </div>
        ) : null}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Compliance Score</span>
          </div>
          <p className="text-2xl font-bold">{Math.round(complianceScore)}%</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Third Parties</span>
          </div>
          <p className="text-2xl font-bold">{totalVendors}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Risk Exposure</span>
          </div>
          <p className="text-2xl font-bold">{criticalRisks}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Documents</span>
          </div>
          <p className="text-2xl font-bold">{documentStats.total}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Compliance & Risk */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Gauge - Framework Adaptive */}
          <ComplianceGauge
            score={complianceScore}
            label={gaugeLabel}
            pillars={pillars}
            href={activeFramework === 'nis2' ? '/nis2' : '/compliance'}
          />

          {/* Vendors by Risk */}
          <VendorsByRiskCard
            vendorStats={vendorStats}
            totalVendors={totalVendors}
          />
        </div>

        {/* Right Column - Actions & Deadlines */}
        <div className="space-y-6">
          {/* Action Required */}
          <ActionRequired items={actionItems} maxItems={5} />

          {/* Pending Deadlines */}
          <PendingDeadlinesCard pendingDeadlines={pendingDeadlines} />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivityCard
        recentActivity={recentActivity}
        totalVendors={totalVendors}
      />

      {/* Quick Actions - Compact row */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendors/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Link>
        <Link
          href="/incidents/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
        >
          <AlertTriangle className="h-4 w-4" />
          Report Incident
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
        >
          <FileText className="h-4 w-4" />
          Upload Document
        </Link>
        <Link
          href="/questionnaires"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium"
        >
          <ClipboardCheck className="h-4 w-4" />
          Send Questionnaire
        </Link>
      </div>
    </div>
  );
}
