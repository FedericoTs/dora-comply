import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  Shield,
  AlertTriangle,
  Calendar,
  Plus,
  FileText,
  ClipboardCheck,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance command center',
};

// Import queries with error handling
async function safeGetCurrentUser() {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    return await getCurrentUser();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

async function safeGetVendorStats() {
  try {
    const { getVendorStats } = await import('@/lib/vendors/queries');
    return await getVendorStats();
  } catch (error) {
    console.error('Failed to get vendor stats:', error);
    return {
      total: 0,
      by_status: { active: 0, inactive: 0, pending_review: 0, offboarding: 0 },
      by_tier: { critical: 0, important: 0, standard: 0 },
      by_risk: { critical: 0, high: 0, medium: 0, low: 0 },
      pending_reviews: 0,
    };
  }
}

async function safeGetDocumentStats() {
  try {
    const { getDocumentStats } = await import('@/lib/documents/queries');
    return await getDocumentStats();
  } catch (error) {
    console.error('Failed to get document stats:', error);
    return { total: 0, by_type: {}, by_status: {} };
  }
}

async function safeGetIncidentStats() {
  try {
    const { getIncidentStatsEnhanced } = await import('@/lib/incidents/queries');
    return await getIncidentStatsEnhanced();
  } catch (error) {
    console.error('Failed to get incident stats:', error);
    return { data: null, error: null };
  }
}

async function safeGetRoiStats() {
  try {
    const { fetchAllTemplateStats } = await import('@/lib/roi/queries');
    return await fetchAllTemplateStats();
  } catch (error) {
    console.error('Failed to get ROI stats:', error);
    return [];
  }
}

async function safeGetMaturitySnapshot() {
  try {
    const { getLatestSnapshot } = await import('@/lib/compliance/maturity-history');
    return await getLatestSnapshot();
  } catch (error) {
    console.error('Failed to get maturity snapshot:', error);
    return { data: null, error: null };
  }
}

export default async function DashboardPage() {
  // Fetch data with individual error handling
  const [user, vendorStats, documentStats, incidentStatsResult, roiStats, maturitySnapshot] =
    await Promise.all([
      safeGetCurrentUser(),
      safeGetVendorStats(),
      safeGetDocumentStats(),
      safeGetIncidentStats(),
      safeGetRoiStats(),
      safeGetMaturitySnapshot(),
    ]);

  const firstName = user?.fullName?.split(' ')[0] || '';
  const incidentStats = incidentStatsResult?.data;

  // Calculate stats
  const totalVendors = vendorStats.total;
  const criticalRisks = vendorStats.by_risk.critical + vendorStats.by_risk.high;

  // Calculate RoI readiness
  const templatesWithData = roiStats.filter((s: { rowCount: number }) => s.rowCount > 0);
  const avgRoiCompleteness = templatesWithData.length > 0
    ? Math.round(templatesWithData.reduce((sum: number, s: { completeness: number }) => sum + s.completeness, 0) / templatesWithData.length)
    : 0;

  // Calculate days to deadline (April 30, 2026)
  const deadline = new Date('2026-04-30');
  const today = new Date();
  const daysToDeadline = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Compliance score from maturity snapshot
  const snapshot = maturitySnapshot?.data;
  const complianceScore = snapshot?.overall_readiness_percent ?? 0;

  // Onboarding check
  const onboardingSteps = [
    { done: totalVendors > 0, label: 'Add first vendor' },
    { done: documentStats.total > 0, label: 'Upload documents' },
    { done: (incidentStats?.total ?? 0) > 0, label: 'Set up incidents' },
    { done: avgRoiCompleteness > 0, label: 'Start RoI' },
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const isNewUser = completedSteps < 2;

  // Simple onboarding view for new users
  if (isNewUser) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s get your DORA compliance program set up.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {onboardingSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className={`text-sm ${step.done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.done ? '✓' : '○'} {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center p-6 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            {daysToDeadline} days until RoI deadline
          </p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
            April 30, 2026
          </p>
        </div>
      </div>
    );
  }

  // Full dashboard for existing users
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s your DORA compliance overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">DORA Score</span>
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
            <Calendar className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-muted-foreground">Days to Deadline</span>
          </div>
          <p className="text-2xl font-bold">{daysToDeadline}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/vendors/new"
            className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium">Add Vendor</span>
          </Link>
          <Link
            href="/incidents/new"
            className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium">Report Incident</span>
          </Link>
          <Link
            href="/documents"
            className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium">Upload Document</span>
          </Link>
          <Link
            href="/questionnaires"
            className="flex items-center gap-3 p-3 bg-card rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30">
              <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium">Send Questionnaire</span>
          </Link>
        </div>
      </div>

      {/* Feature Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/vendors" className="group p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Third Parties</h3>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">Manage vendors, contracts, and risk assessments</p>
        </Link>
        <Link href="/data-protection" className="group p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Data Protection</h3>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">GDPR compliance, DPIAs, and breach management</p>
        </Link>
        <Link href="/dashboards" className="group p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Custom Dashboards</h3>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground mt-2">Build personalized views and reports</p>
        </Link>
      </div>
    </div>
  );
}
