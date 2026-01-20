/**
 * Questionnaire Review Page
 *
 * View and review vendor questionnaire responses
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  Sparkles,
  Download,
  Flag,
  MessageSquare,
  Link2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getQuestionnaireWithDetails } from '@/lib/nis2-questionnaire/queries';
import {
  NIS2_CATEGORIES,
  type NIS2Category,
  type QuestionnaireStatus,
  type TemplateQuestion,
  type QuestionnaireAnswer,
  type AnswerSource,
} from '@/lib/nis2-questionnaire/types';
import { cn } from '@/lib/utils';
import { QuestionnaireReviewActions } from '@/components/questionnaires/company/questionnaire-review-actions';
import { CopyLinkButton } from '@/components/questionnaires/company/copy-link-button';

export const metadata = {
  title: 'Review Questionnaire | NIS2 Comply',
  description: 'Review vendor questionnaire responses',
};

interface PageProps {
  params: Promise<{ questionnaireId: string }>;
}

// Status configuration
const statusConfig: Record<
  QuestionnaireStatus,
  { label: string; icon: typeof Clock; color: string }
> = {
  draft: { label: 'Draft', icon: Clock, color: 'text-muted-foreground' },
  sent: { label: 'Sent', icon: Send, color: 'text-blue-500' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-amber-500' },
  submitted: { label: 'Pending Review', icon: AlertCircle, color: 'text-primary' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'text-emerald-500' },
  rejected: { label: 'Changes Requested', icon: AlertCircle, color: 'text-destructive' },
  expired: { label: 'Expired', icon: Clock, color: 'text-muted-foreground' },
};

// Answer source badges
const sourceConfig: Record<AnswerSource, { label: string; color: string }> = {
  manual: { label: 'Manual', color: 'bg-slate-100 text-slate-700' },
  ai_extracted: { label: 'AI Extracted', color: 'bg-purple-100 text-purple-700' },
  ai_confirmed: { label: 'AI Confirmed', color: 'bg-emerald-100 text-emerald-700' },
  ai_modified: { label: 'AI Modified', color: 'bg-amber-100 text-amber-700' },
};

function AnswerSourceBadge({ source, confidence }: { source: AnswerSource; confidence?: number | null }) {
  const config = sourceConfig[source];
  const isAI = source !== 'manual';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className={cn('gap-1 text-xs', config.color)}>
            {isAI && <Sparkles className="h-3 w-3" />}
            {config.label}
            {confidence !== null && confidence !== undefined && (
              <span className="ml-1 opacity-70">{Math.round(confidence * 100)}%</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isAI ? (
            <div className="text-xs">
              <p>Answer was {source === 'ai_extracted' ? 'extracted by AI' : source === 'ai_confirmed' ? 'confirmed by vendor' : 'modified by vendor'}</p>
              {confidence && <p>Confidence: {Math.round(confidence * 100)}%</p>}
            </div>
          ) : (
            <p className="text-xs">Answer entered manually by vendor</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AnswerCard({
  question,
  answer,
}: {
  question: TemplateQuestion;
  answer?: QuestionnaireAnswer;
}) {
  const hasAnswer = answer && (answer.answer_text || answer.answer_json);

  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3',
      answer?.is_flagged && 'border-amber-500 bg-amber-50/50'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {question.is_required && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Required
              </Badge>
            )}
            {answer?.is_flagged && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-700">
                <Flag className="h-3 w-3 mr-1" />
                Flagged
              </Badge>
            )}
          </div>
          <p className="font-medium">{question.question_text}</p>
          {question.help_text && (
            <p className="text-sm text-muted-foreground">{question.help_text}</p>
          )}
        </div>
        {answer && (
          <AnswerSourceBadge source={answer.source} confidence={answer.ai_confidence} />
        )}
      </div>

      {/* Answer Display */}
      <div className="pt-2 border-t">
        {hasAnswer ? (
          <div className="space-y-2">
            {/* Text/Textarea answers */}
            {(question.question_type === 'text' || question.question_type === 'textarea') && (
              <p className="text-sm whitespace-pre-wrap">{answer.answer_text}</p>
            )}

            {/* Boolean answers */}
            {question.question_type === 'boolean' && (
              <div className="flex items-center gap-2">
                {answer.answer_text === 'true' ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
            )}

            {/* Select/Multiselect answers */}
            {(question.question_type === 'select' || question.question_type === 'multiselect') && (
              <div className="flex flex-wrap gap-1">
                {answer.answer_json && Array.isArray(answer.answer_json) ? (
                  (answer.answer_json as string[]).map((val) => {
                    const option = question.options?.find((o) => o.value === val);
                    return (
                      <Badge key={val} variant="secondary">
                        {option?.label || val}
                      </Badge>
                    );
                  })
                ) : (
                  <Badge variant="secondary">
                    {question.options?.find((o) => o.value === answer.answer_text)?.label || answer.answer_text}
                  </Badge>
                )}
              </div>
            )}

            {/* Number answers */}
            {question.question_type === 'number' && (
              <p className="text-sm font-mono">{answer.answer_text}</p>
            )}

            {/* Date answers */}
            {question.question_type === 'date' && answer.answer_text && (
              <p className="text-sm">{format(new Date(answer.answer_text), 'PPP')}</p>
            )}

            {/* AI Citation */}
            {answer.ai_citation && (
              <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                <span className="font-medium">Source: </span>
                {answer.ai_citation}
              </div>
            )}

            {/* Flag reason */}
            {answer.is_flagged && answer.flag_reason && (
              <div className="mt-2 p-2 rounded bg-amber-100 text-xs text-amber-800">
                <span className="font-medium">Flag reason: </span>
                {answer.flag_reason}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No answer provided</p>
        )}
      </div>
    </div>
  );
}

function DocumentCard({
  document,
}: {
  document: {
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    document_type: string;
    ai_processed: boolean;
    uploaded_at: string;
  };
}) {
  const sizeInKB = Math.round(document.file_size / 1024);
  const sizeDisplay = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-sm">{document.file_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{sizeDisplay}</span>
            <span>&middot;</span>
            <Badge variant="outline" className="text-[10px]">
              {document.document_type.toUpperCase()}
            </Badge>
            {document.ai_processed && (
              <>
                <span>&middot;</span>
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI Processed
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

async function QuestionnaireContent({ questionnaireId }: { questionnaireId: string }) {
  const data = await getQuestionnaireWithDetails(questionnaireId);

  if (!data) {
    notFound();
  }

  const { questionnaire, template, questions, answers, documents } = data;
  const status = statusConfig[questionnaire.status];
  const StatusIcon = status.icon;

  // Group questions by category
  const questionsByCategory = questions.reduce(
    (acc, question) => {
      const cat = question.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(question);
      return acc;
    },
    {} as Record<NIS2Category, TemplateQuestion[]>
  );

  // Create answer lookup
  const answerMap = answers.reduce(
    (acc, answer) => {
      acc[answer.question_id] = answer;
      return acc;
    },
    {} as Record<string, QuestionnaireAnswer>
  );

  const aiAnswersCount = answers.filter((a) => a.source !== 'manual').length;
  const aiPercentage = answers.length > 0 ? Math.round((aiAnswersCount / answers.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  {questionnaire.vendor_name || 'Questionnaire Review'}
                </CardTitle>
                <Badge variant="outline" className={cn('gap-1', status.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <CardDescription>
                {template.name} &middot; Version {template.version}
              </CardDescription>
            </div>

            {/* Review Actions - only show for submitted questionnaires */}
            {questionnaire.status === 'submitted' && (
              <QuestionnaireReviewActions questionnaireId={questionnaire.id} />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Vendor & Questionnaire Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Vendor
              </p>
              <p className="text-sm font-medium">{questionnaire.vendor_name || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Contact
              </p>
              <p className="text-sm font-medium">{questionnaire.vendor_email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due Date
              </p>
              <p className="text-sm font-medium">
                {questionnaire.due_date
                  ? format(new Date(questionnaire.due_date), 'PPP')
                  : 'No deadline'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Submitted
              </p>
              <p className="text-sm font-medium">
                {questionnaire.submitted_at
                  ? formatDistanceToNow(new Date(questionnaire.submitted_at), { addSuffix: true })
                  : 'Not yet'}
              </p>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-2xl font-semibold">{questionnaire.progress_percentage}%</p>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {questionnaire.questions_answered}/{questionnaire.questions_total}
              </p>
              <p className="text-xs text-muted-foreground">Answered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{aiPercentage}%</p>
              <p className="text-xs text-muted-foreground">AI Assisted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={questionnaire.progress_percentage} className="h-2" />
          </div>

          {/* Review Notes */}
          {questionnaire.review_notes && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Review Notes</p>
                  <p className="text-sm text-muted-foreground mt-1">{questionnaire.review_notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Vendor Portal Link */}
          {questionnaire.access_token && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Link2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Vendor Portal Link</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                    Share this link with the vendor if they lost their invitation email
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white dark:bg-blue-950 px-2 py-1.5 rounded border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 truncate">
                      {process.env.NEXT_PUBLIC_APP_URL || 'https://dora-comply.vercel.app'}/q/{questionnaire.access_token}
                    </code>
                    <CopyLinkButton
                      url={`${process.env.NEXT_PUBLIC_APP_URL || 'https://dora-comply.vercel.app'}/q/${questionnaire.access_token}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                      asChild
                    >
                      <a
                        href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://dora-comply.vercel.app'}/q/${questionnaire.access_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  </div>
                  {questionnaire.token_expires_at && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                      Link expires: {format(new Date(questionnaire.token_expires_at), 'PPP')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              Documents provided by the vendor for AI extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions & Answers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Responses by Category</CardTitle>
          <CardDescription>
            Review vendor answers organized by NIS2 Article 21 categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            defaultValue={Object.keys(questionsByCategory)}
            className="space-y-3"
          >
            {(Object.entries(questionsByCategory) as [NIS2Category, TemplateQuestion[]][]).map(
              ([category, categoryQuestions]) => {
                const categoryInfo = NIS2_CATEGORIES[category];
                const answeredCount = categoryQuestions.filter(
                  (q) => answerMap[q.id]?.answer_text || answerMap[q.id]?.answer_json
                ).length;

                return (
                  <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{categoryInfo.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {categoryInfo.article} &middot; {answeredCount}/{categoryQuestions.length} answered
                          </div>
                        </div>
                        <Progress
                          value={(answeredCount / categoryQuestions.length) * 100}
                          className="w-20 h-1.5"
                        />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3">
                        {categoryQuestions.map((question) => (
                          <AnswerCard
                            key={question.id}
                            question={question}
                            answer={answerMap[question.id]}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              }
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionnaireContentSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function QuestionnaireReviewPage({ params }: PageProps) {
  const { questionnaireId } = await params;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3" asChild>
          <Link href="/questionnaires">
            <ArrowLeft className="h-4 w-4" />
            Questionnaires
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={<QuestionnaireContentSkeleton />}>
        <QuestionnaireContent questionnaireId={questionnaireId} />
      </Suspense>
    </div>
  );
}
