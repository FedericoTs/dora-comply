/**
 * Questionnaire Detail Page
 *
 * View and review vendor questionnaire responses
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  FileText,
  Mail,
  Calendar,
  Building2,
  Clock,
  Download,
  RefreshCw,
  Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getQuestionnaireWithDetails } from '@/lib/nis2-questionnaire/queries';
import {
  QuestionnaireStatus,
  AnswerSource,
  QuestionnaireAnswer,
  TemplateQuestion,
} from '@/lib/nis2-questionnaire/types';
import { getCategoryLabel } from '@/lib/nis2-questionnaire/questions-library';
import { QuestionnaireReviewActions } from '@/components/questionnaires/company/questionnaire-review-actions';

interface PageProps {
  params: Promise<{ questionnaireId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { questionnaireId } = await params;
  return {
    title: `Questionnaire Review | NIS2 Comply`,
    description: `Review vendor questionnaire responses`,
  };
}

const statusConfig: Record<
  QuestionnaireStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  draft: { label: 'Draft', icon: Clock, className: 'text-muted-foreground' },
  sent: { label: 'Sent', icon: Mail, className: 'text-blue-500' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'text-amber-500' },
  submitted: { label: 'Submitted', icon: AlertCircle, className: 'text-amber-500' },
  approved: { label: 'Approved', icon: CheckCircle2, className: 'text-emerald-500' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'text-destructive' },
  expired: { label: 'Expired', icon: Clock, className: 'text-muted-foreground' },
};

function getSourceBadge(source: AnswerSource, confidence?: number | null) {
  switch (source) {
    case 'ai_extracted':
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          AI {confidence ? `(${Math.round(confidence * 100)}%)` : ''}
        </Badge>
      );
    case 'ai_confirmed':
      return (
        <Badge variant="secondary" className="gap-1 text-xs bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-3 w-3" />
          AI Confirmed
        </Badge>
      );
    case 'ai_modified':
      return (
        <Badge variant="secondary" className="gap-1 text-xs bg-amber-100 text-amber-700">
          <Sparkles className="h-3 w-3" />
          AI Modified
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Manual
        </Badge>
      );
  }
}

interface QuestionAnswerCardProps {
  question: TemplateQuestion;
  answer?: QuestionnaireAnswer;
}

function QuestionAnswerCard({ question, answer }: QuestionAnswerCardProps) {
  const hasAnswer = answer && (answer.answer_text || answer.answer_json);

  return (
    <Card className={answer?.is_flagged ? 'border-destructive/50' : ''}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Question */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium">{question.question_text}</p>
              {question.help_text && (
                <p className="text-sm text-muted-foreground">{question.help_text}</p>
              )}
            </div>
            {question.is_required && (
              <Badge variant="outline" className="shrink-0 text-xs">
                Required
              </Badge>
            )}
          </div>

          <Separator />

          {/* Answer */}
          {hasAnswer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Answer:</span>
                {getSourceBadge(answer.source, answer.ai_confidence)}
                {answer.is_flagged && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Flag className="h-4 w-4 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Flagged: {answer.flag_reason}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="rounded-md bg-muted/50 p-3">
                {question.question_type === 'boolean' ? (
                  <span className="font-medium">
                    {answer.answer_text === 'true' || answer.answer_json === true ? 'Yes' : 'No'}
                  </span>
                ) : question.question_type === 'multiselect' && Array.isArray(answer.answer_json) ? (
                  <div className="flex flex-wrap gap-1">
                    {(answer.answer_json as string[]).map((val) => {
                      const option = question.options?.find((o) => o.value === val);
                      return (
                        <Badge key={val} variant="secondary">
                          {option?.label || val}
                        </Badge>
                      );
                    })}
                  </div>
                ) : question.question_type === 'select' ? (
                  <span>
                    {question.options?.find((o) => o.value === answer.answer_text)?.label ||
                      answer.answer_text}
                  </span>
                ) : (
                  <p className="whitespace-pre-wrap">{answer.answer_text}</p>
                )}
              </div>

              {/* AI Citation */}
              {answer.ai_citation && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Source: {answer.ai_citation}
                </p>
              )}

              {/* Original AI answer if modified */}
              {answer.source === 'ai_modified' && answer.original_ai_answer && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">Original AI suggestion:</p>
                  <p className="italic">{answer.original_ai_answer}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No answer provided</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function QuestionnaireContent({ questionnaireId }: { questionnaireId: string }) {
  const data = await getQuestionnaireWithDetails(questionnaireId);

  if (!data) {
    notFound();
  }

  const { questionnaire, template, questions, answers, documents } = data;
  const statusInfo = statusConfig[questionnaire.status];
  const StatusIcon = statusInfo.icon;

  // Group questions by category
  const questionsByCategory = questions.reduce(
    (acc, q) => {
      const category = q.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(q);
      return acc;
    },
    {} as Record<string, TemplateQuestion[]>
  );

  // Create answer map
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  // Calculate stats
  const totalQuestions = questions.length;
  const answeredQuestions = answers.filter((a) => a.answer_text || a.answer_json).length;
  const aiAssistedCount = answers.filter((a) =>
    ['ai_extracted', 'ai_confirmed', 'ai_modified'].includes(a.source)
  ).length;
  const flaggedCount = answers.filter((a) => a.is_flagged).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/questionnaires">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {questionnaire.vendor_name || 'Vendor'} Questionnaire
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {questionnaire.vendor_email}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {template.name}
            </span>
            {questionnaire.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due {new Date(questionnaire.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${statusInfo.className}`}>
            <StatusIcon className="h-5 w-5" />
            <span className="font-medium">{statusInfo.label}</span>
          </div>
          {questionnaire.status === 'submitted' && (
            <QuestionnaireReviewActions questionnaireId={questionnaire.id} />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Progress</div>
            <div className="text-2xl font-bold">{questionnaire.progress_percentage}%</div>
            <Progress value={questionnaire.progress_percentage} className="h-1.5 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {answeredQuestions}/{totalQuestions} questions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">AI Assisted</div>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {aiAssistedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalQuestions > 0 ? Math.round((aiAssistedCount / totalQuestions) * 100) : 0}% of
              answers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Documents</div>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {documents.filter((d) => d.ai_processed).length} processed by AI
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Flagged</div>
            <div className={`text-2xl font-bold ${flaggedCount > 0 ? 'text-destructive' : ''}`}>
              {flaggedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Answers needing review</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="responses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="responses">Responses</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {documents.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="space-y-6">
          {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                {getCategoryLabel(category as any)}
                <Badge variant="outline">
                  {categoryQuestions.filter((q) => answerMap.get(q.id)?.answer_text).length}/
                  {categoryQuestions.length}
                </Badge>
              </h3>
              <div className="space-y-3">
                {categoryQuestions.map((question) => (
                  <QuestionAnswerCard
                    key={question.id}
                    question={question}
                    answer={answerMap.get(question.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="documents">
          {documents.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents uploaded by vendor</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{doc.file_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{doc.document_type}</Badge>
                          <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                        </div>
                      </div>
                      {doc.ai_processed && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          AI Processed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {questionnaire.created_at && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(questionnaire.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {questionnaire.sent_at && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">Sent to vendor</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(questionnaire.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {questionnaire.started_at && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="font-medium">Vendor started</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(questionnaire.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {questionnaire.submitted_at && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-medium">Submitted by vendor</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(questionnaire.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {questionnaire.reviewed_at && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">
                        {questionnaire.status === 'approved' ? 'Approved' : 'Reviewed'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(questionnaire.reviewed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionnaireContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default async function QuestionnaireDetailPage({ params }: PageProps) {
  const { questionnaireId } = await params;

  return (
    <Suspense fallback={<QuestionnaireContentSkeleton />}>
      <QuestionnaireContent questionnaireId={questionnaireId} />
    </Suspense>
  );
}
