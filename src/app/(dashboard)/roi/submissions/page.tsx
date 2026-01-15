/**
 * RoI Submissions Page
 *
 * Manage submission workflow, track progress, and submit to ESAs
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Calendar,
  Clock,
  FileCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  fetchSubmissions,
  generateSubmissionChecklist,
} from '@/lib/roi/submissions';
import { fetchAllTemplateStats } from '@/lib/roi';
import {
  SubmissionCard,
  NoSubmissionsState,
} from './components/submission-card';
import {
  SubmissionChecklistCard,
} from './components/submission-checklist';
import { NewSubmissionButton } from './components/new-submission-button';

export const metadata = {
  title: 'RoI Submissions | DORA Comply',
  description: 'Manage your Register of Information submissions to ESAs',
};

async function SubmissionsContent() {
  const [submissions, templateStats] = await Promise.all([
    fetchSubmissions(),
    fetchAllTemplateStats(),
  ]);

  const checklist = await generateSubmissionChecklist(templateStats);

  // Separate submissions by status
  const activeSubmissions = submissions.filter(
    s => s.status !== 'acknowledged' && s.status !== 'rejected'
  );
  const completedSubmissions = submissions.filter(
    s => s.status === 'acknowledged'
  );
  const rejectedSubmissions = submissions.filter(
    s => s.status === 'rejected'
  );

  // Calculate deadline info
  const deadline = new Date('2026-04-30');
  const today = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate overall progress
  const totalCompletion = templateStats.length > 0
    ? Math.round(
        templateStats.reduce((sum, s) => sum + s.completeness, 0) / templateStats.length
      )
    : 0;

  // Note: RoiStats doesn't include errorCount - would need validation run to get actual error count
  const totalErrors = 0; // Placeholder until full validation is run

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/roi">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">RoI Submissions</h1>
            <p className="text-muted-foreground">
              Manage and track your ESA reporting submissions
            </p>
          </div>
        </div>
        <NewSubmissionButton />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{daysUntilDeadline}</p>
                <p className="text-xs text-muted-foreground">Days until deadline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalCompletion}%</p>
                <p className="text-xs text-muted-foreground">Data complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                totalErrors > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  totalErrors > 0 ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalErrors}</p>
                <p className="text-xs text-muted-foreground">Validation errors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{completedSubmissions.length}</p>
                <p className="text-xs text-muted-foreground">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submissions List */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">
                Active
                {activeSubmissions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5">
                    {activeSubmissions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                {completedSubmissions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 bg-green-100 text-green-700">
                    {completedSubmissions.length}
                  </Badge>
                )}
              </TabsTrigger>
              {rejectedSubmissions.length > 0 && (
                <TabsTrigger value="rejected">
                  Rejected
                  <Badge variant="secondary" className="ml-2 h-5 bg-red-100 text-red-700">
                    {rejectedSubmissions.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="active" className="space-y-4 pt-4">
              {activeSubmissions.length === 0 ? (
                <NoSubmissionsState />
              ) : (
                activeSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    checklistProgress={Math.round(
                      (checklist.completedCount / checklist.totalCount) * 100
                    )}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 pt-4">
              {completedSubmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No completed submissions yet
                </div>
              ) : (
                completedSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                  />
                ))
              )}
            </TabsContent>

            {rejectedSubmissions.length > 0 && (
              <TabsContent value="rejected" className="space-y-4 pt-4">
                {rejectedSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                  />
                ))}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submission Checklist */}
          <SubmissionChecklistCard checklist={checklist} />

          {/* Deadline Reminder */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Submission Deadline</h3>
                  <p className="text-sm text-muted-foreground">
                    First RoI submission to your National Competent Authority is due by{' '}
                    <strong>April 30, 2026</strong>.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {daysUntilDeadline} days remaining
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Help */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Submission Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    1
                  </span>
                  Complete all required template data
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    2
                  </span>
                  Resolve validation errors
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    3
                  </span>
                  Get management approval
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    4
                  </span>
                  Export and submit to NCA
                </li>
              </ol>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/help/roi-submission">
                  View Full Guide
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SubmissionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense fallback={<SubmissionsSkeleton />}>
      <SubmissionsContent />
    </Suspense>
  );
}
