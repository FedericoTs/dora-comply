import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileQuestion,
  FlaskConical,
  Shield,
  ArrowRight,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Assessments | DORA Comply',
  description: 'Manage compliance assessments, questionnaires, and testing',
};

// Safe data fetching with error handling
async function safeGetQuestionnaireStats() {
  try {
    const { getQuestionnaireStats } = await import('@/lib/nis2-questionnaire/queries');
    const result = await getQuestionnaireStats();
    if (!result) return { total: 0, pending: 0, in_progress: 0, completed: 0 };
    return {
      total: result.total_questionnaires,
      pending: result.sent_count,
      in_progress: result.in_progress_count,
      completed: result.approved_count,
    };
  } catch {
    return { total: 0, pending: 0, in_progress: 0, completed: 0 };
  }
}

async function safeGetTestingStats() {
  try {
    const { getTests } = await import('@/lib/testing/queries');
    const result = await getTests();
    const tests = result.data || [];
    const total = result.count || tests.length;
    const passed = tests.filter((t: { status: string }) => t.status === 'completed').length;
    const in_progress = tests.filter((t: { status: string }) => t.status === 'in_progress').length;
    return { total, passed, failed: 0, in_progress };
  } catch {
    return { total: 0, passed: 0, failed: 0, in_progress: 0 };
  }
}

async function safeGetGDPRStats() {
  const defaultStats = {
    processing_activities: { total: 0 },
    dpias: { total: 0, in_progress: 0 },
    dsr: { total: 0, open: 0, overdue: 0 },
    breaches: { total: 0, open: 0 },
  };
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user?.organizationId) return defaultStats;

    const { getGDPRStats } = await import('@/lib/gdpr/queries');
    const result = await getGDPRStats(user.organizationId);
    return result || defaultStats;
  } catch {
    return defaultStats;
  }
}

export default async function AssessmentsPage() {
  const [questionnaireStats, testingStats, gdprStats] = await Promise.all([
    safeGetQuestionnaireStats(),
    safeGetTestingStats(),
    safeGetGDPRStats(),
  ]);

  const assessmentModules = [
    {
      title: 'Vendor Questionnaires',
      description: 'Send and manage security questionnaires to third parties',
      icon: FileQuestion,
      href: '/questionnaires',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      stats: [
        { label: 'Total', value: questionnaireStats.total },
        { label: 'Pending', value: questionnaireStats.pending, warning: true },
        { label: 'Completed', value: questionnaireStats.completed },
      ],
    },
    {
      title: 'Resilience Testing',
      description: 'Track security tests, penetration testing, and TLPT engagements',
      icon: FlaskConical,
      href: '/testing',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      stats: [
        { label: 'Total Tests', value: testingStats.total },
        { label: 'Passed', value: testingStats.passed },
        { label: 'In Progress', value: testingStats.in_progress },
      ],
    },
    {
      title: 'Data Protection (GDPR)',
      description: 'Manage processing activities, DPIAs, DSRs, and breach notifications',
      icon: Shield,
      href: '/data-protection',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      stats: [
        { label: 'Activities', value: gdprStats.processing_activities.total },
        { label: 'Open DSRs', value: gdprStats.dsr.open, warning: gdprStats.dsr.overdue > 0 },
        { label: 'DPIAs', value: gdprStats.dpias.total },
      ],
    },
  ];

  // Calculate overall status
  const totalPending = questionnaireStats.pending + gdprStats.dsr.open + testingStats.in_progress;
  const hasOverdue = gdprStats.dsr.overdue > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground mt-1">
          Manage compliance assessments, vendor questionnaires, and data protection
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPending}</p>
              <p className="text-sm text-muted-foreground">Pending Actions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-md ${hasOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
              {hasOverdue ? (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">{gdprStats.dsr.overdue}</p>
              <p className="text-sm text-muted-foreground">Overdue DSRs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{questionnaireStats.completed + testingStats.passed}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessment Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {assessmentModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-md ${module.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-lg mt-3">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    {module.stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className={`font-semibold ${stat.warning ? 'text-amber-600' : ''}`}>
                          {stat.value}
                        </span>
                        <span className="text-muted-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/questionnaires?action=new"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <FileQuestion className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Send Questionnaire</span>
            </Link>
            <Link
              href="/testing/tests/new"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <FlaskConical className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">New Test</span>
            </Link>
            <Link
              href="/data-protection/dpias?action=new"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Shield className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Start DPIA</span>
            </Link>
            <Link
              href="/data-protection/dsr?action=new"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <ClipboardCheck className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Log DSR</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
