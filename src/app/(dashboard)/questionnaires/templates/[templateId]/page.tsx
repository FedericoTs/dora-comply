/**
 * Template Detail Page
 *
 * View and manage a questionnaire template and its questions
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Plus,
  Clock,
  FileText,
  ChevronRight,
  GripVertical,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  HelpCircle,
  ListOrdered,
  ToggleLeft,
  Type,
  Hash,
  Calendar,
  List,
  CircleDot,
  FileUp,
  Sparkles,
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
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { getTemplateWithQuestions } from '@/lib/nis2-questionnaire/queries';
import {
  NIS2_CATEGORIES,
  type NIS2Category,
  type TemplateQuestion,
  type QuestionType,
} from '@/lib/nis2-questionnaire/types';
import { getCategoryLabel, getCategoryArticle } from '@/lib/nis2-questionnaire/questions-library';
import { cn } from '@/lib/utils';
import { TemplateActions } from './template-actions';
import { AddQuestionButton } from './add-question-button';
import { AddQuestionDialog } from './add-question-dialog';

export const metadata = {
  title: 'Template Details | NIS2 Comply',
  description: 'View and manage questionnaire template',
};

interface PageProps {
  params: Promise<{ templateId: string }>;
}

// Question type icons
const questionTypeIcons: Record<QuestionType, React.ElementType> = {
  text: Type,
  textarea: FileText,
  select: List,
  multiselect: ListOrdered,
  boolean: ToggleLeft,
  date: Calendar,
  number: Hash,
  file: FileUp,
};

const questionTypeLabels: Record<QuestionType, string> = {
  text: 'Short Text',
  textarea: 'Long Text',
  select: 'Single Choice',
  multiselect: 'Multiple Choice',
  boolean: 'Yes/No',
  date: 'Date',
  number: 'Number',
  file: 'File Upload',
};

function QuestionCard({ question }: { question: TemplateQuestion }) {
  const TypeIcon = questionTypeIcons[question.question_type];

  return (
    <div className="group relative rounded-lg border bg-card p-4 transition-all hover:shadow-sm">
      <div className="flex items-start gap-3">
        {/* Drag handle (visual only for now) */}
        <div className="mt-1 cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Question content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {question.is_required && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Required
                  </Badge>
                )}
                {question.ai_extraction_enabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI extraction enabled</p>
                        <p className="text-xs text-muted-foreground">
                          Confidence threshold: {Math.round(question.ai_confidence_threshold * 100)}%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="font-medium leading-snug">{question.question_text}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Question
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  AI Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {question.help_text && (
            <p className="text-sm text-muted-foreground line-clamp-2">{question.help_text}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TypeIcon className="h-3.5 w-3.5" />
              <span>{questionTypeLabels[question.question_type]}</span>
            </div>
            {question.options && question.options.length > 0 && (
              <span>{question.options.length} options</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  questions,
  templateId,
}: {
  category: NIS2Category;
  questions: TemplateQuestion[];
  templateId: string;
}) {
  const categoryInfo = NIS2_CATEGORIES[category];

  return (
    <AccordionItem value={category} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium">{categoryInfo.label}</div>
            <div className="text-xs text-muted-foreground">
              {categoryInfo.article} &middot; {questions.length} question
              {questions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No questions in this category yet
            </div>
          ) : (
            questions.map((question) => <QuestionCard key={question.id} question={question} />)
          )}
          <AddQuestionButton templateId={templateId} category={category} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

async function TemplateContent({ templateId }: { templateId: string }) {
  const data = await getTemplateWithQuestions(templateId);

  if (!data) {
    notFound();
  }

  const { template, questions } = data;

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

  // Get categories that have questions or are in template.nis2_categories
  const activeCategories = template.nis2_categories || [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{template.name}</CardTitle>
                {template.is_default && (
                  <Badge variant="secondary">Default</Badge>
                )}
                <Badge variant={template.is_active ? 'default' : 'outline'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="max-w-2xl">
                {template.description || 'No description provided'}
              </CardDescription>
            </div>
            <TemplateActions template={template} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Questions</p>
              <p className="text-2xl font-semibold">{questions.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Categories</p>
              <p className="text-2xl font-semibold">{activeCategories.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Est. Completion</p>
              <p className="text-2xl font-semibold">{template.estimated_completion_minutes} min</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Times Used</p>
              <p className="text-2xl font-semibold">{template.times_used}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories & Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Questions by Category</h2>
            <p className="text-sm text-muted-foreground">
              Manage questions organized by NIS2 Article 21 categories
            </p>
          </div>
          <AddQuestionDialog templateId={template.id} />
        </div>

        <Accordion
          type="multiple"
          defaultValue={activeCategories}
          className="space-y-3"
        >
          {activeCategories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              questions={questionsByCategory[category] || []}
              templateId={template.id}
            />
          ))}
        </Accordion>

        {/* Show inactive categories */}
        {Object.keys(NIS2_CATEGORIES).some(
          (cat) => !activeCategories.includes(cat as NIS2Category)
        ) && (
          <div className="pt-4">
            <Separator className="mb-4" />
            <details className="group">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                Show other NIS2 categories
              </summary>
              <div className="mt-4 space-y-3">
                {(Object.keys(NIS2_CATEGORIES) as NIS2Category[])
                  .filter((cat) => !activeCategories.includes(cat))
                  .map((category) => (
                    <div
                      key={category}
                      className="rounded-lg border border-dashed p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">
                            {NIS2_CATEGORIES[category].label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {NIS2_CATEGORIES[category].article}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Add to Template
                      </Button>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateContentSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { templateId } = await params;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3" asChild>
          <Link href="/questionnaires/templates">
            <ArrowLeft className="h-4 w-4" />
            Templates
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Suspense fallback={<TemplateContentSkeleton />}>
        <TemplateContent templateId={templateId} />
      </Suspense>
    </div>
  );
}
