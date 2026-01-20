/**
 * Questionnaires Dashboard Page
 *
 * NIS2 vendor security questionnaire management
 * Send, track, and review vendor responses
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileQuestion,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { getQuestionnaires, getQuestionnaireStats, getTemplates } from '@/lib/nis2-questionnaire/queries';
import { QuestionnaireSummary, QuestionnaireStats as Stats } from '@/lib/nis2-questionnaire/types';
import { QuestionnaireList } from '@/components/questionnaires/company/questionnaire-list';
import { SendQuestionnaireDialog } from '@/components/questionnaires/company/send-questionnaire-dialog';

export const metadata = {
  title: 'Questionnaires | NIS2 Comply',
  description: 'NIS2 vendor security questionnaire management',
};

// Stats Cards Component
async function QuestionnaireStatsCards() {
  const stats = await getQuestionnaireStats();

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Sent',
      value: stats.total_questionnaires - stats.draft_count,
      icon: Send,
      description: 'Questionnaires sent to vendors',
    },
    {
      title: 'Awaiting Response',
      value: stats.sent_count + stats.in_progress_count,
      icon: Clock,
      description: `${stats.in_progress_count} in progress`,
      highlight: stats.sent_count + stats.in_progress_count > 0,
    },
    {
      title: 'Pending Review',
      value: stats.submitted_count,
      icon: FileText,
      description: 'Ready for your review',
      variant: stats.submitted_count > 0 ? 'warning' : 'default',
    },
    {
      title: 'Completed',
      value: stats.approved_count,
      icon: CheckCircle2,
      description: 'Approved responses',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className={stat.highlight ? 'border-primary/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.variant === 'warning' && stat.value > 0 ? (
                <span className="text-amber-500">{stat.value}</span>
              ) : (
                stat.value
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Questionnaires List Section
async function QuestionnairesListSection() {
  const { data: questionnaires } = await getQuestionnaires(
    { status: ['sent', 'in_progress', 'submitted'] },
    { field: 'created_at', direction: 'desc' },
    20
  );

  if (!questionnaires || questionnaires.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Active Questionnaires</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Send your first NIS2 security questionnaire to assess vendor compliance.
            AI will help vendors auto-fill answers from their security documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <SendQuestionnaireDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Send First Questionnaire
            </Button>
          </SendQuestionnaireDialog>
        </CardContent>
      </Card>
    );
  }

  return <QuestionnaireList questionnaires={questionnaires} />;
}

function QuestionnairesListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Pending Review Section
async function PendingReviewSection() {
  const { data: pendingReview } = await getQuestionnaires(
    { status: ['submitted'] },
    { field: 'submitted_at', direction: 'asc' },
    5
  );

  if (!pendingReview || pendingReview.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Pending Review
        </CardTitle>
        <CardDescription>Questionnaires awaiting your approval</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pendingReview.map((q) => (
            <Link
              key={q.id}
              href={`/questionnaires/${q.id}`}
              className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {q.vendor_company_name || q.vendor_name}
                </p>
                <p className="text-xs text-muted-foreground">{q.template_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {q.questions_ai_filled > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {Math.round((q.questions_ai_filled / q.questions_total) * 100)}% AI
                  </Badge>
                )}
                <Badge variant="outline">Review</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// AI Stats Card
async function AIStatsCard() {
  const stats = await getQuestionnaireStats();

  if (!stats || !stats.avg_ai_fill_rate) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Assistance
        </CardTitle>
        <CardDescription>Document parsing performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Avg. Auto-fill Rate</span>
            <span className="font-medium">{Math.round(stats.avg_ai_fill_rate)}%</span>
          </div>
          <Progress value={stats.avg_ai_fill_rate} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground">
          Vendors upload SOC 2, ISO 27001, and policy documents. AI extracts answers automatically.
        </p>
      </CardContent>
    </Card>
  );
}

// Quick Actions Card
function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SendQuestionnaireDialog>
          <Button variant="outline" className="w-full justify-start">
            <Send className="mr-2 h-4 w-4" />
            Send Questionnaire
          </Button>
        </SendQuestionnaireDialog>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link href="/questionnaires/templates">
            <FileText className="mr-2 h-4 w-4" />
            Manage Templates
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function QuestionnairesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendor Questionnaires</h1>
          <p className="text-muted-foreground">
            NIS2 Article 21 security assessments for third-party vendors
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/questionnaires/templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <SendQuestionnaireDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Send Questionnaire
            </Button>
          </SendQuestionnaireDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <QuestionnaireStatsCards />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Questionnaires List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Active Questionnaires</h2>
          <Suspense fallback={<QuestionnairesListSkeleton />}>
            <QuestionnairesListSection />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Suspense fallback={<Skeleton className="h-48" />}>
            <PendingReviewSection />
          </Suspense>

          <Suspense fallback={<Skeleton className="h-32" />}>
            <AIStatsCard />
          </Suspense>

          <QuickActionsCard />

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  1
                </div>
                <p className="text-muted-foreground">
                  Send questionnaire to vendor via magic link
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  2
                </div>
                <p className="text-muted-foreground">
                  Vendor uploads SOC 2, ISO 27001, or policy docs
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  3
                </div>
                <p className="text-muted-foreground">
                  AI pre-fills answers, vendor confirms & submits
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                  4
                </div>
                <p className="text-muted-foreground">
                  You review and approve the responses
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
