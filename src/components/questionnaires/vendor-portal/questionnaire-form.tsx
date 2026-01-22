'use client';

/**
 * QuestionnaireForm Component
 *
 * Main form for answering questionnaire questions
 */

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  TemplateQuestion,
  QuestionnaireAnswer,
  QuestionnaireDocument,
  AnswerSource,
} from '@/lib/nis2-questionnaire/types';
import { saveAnswer } from '@/lib/nis2-questionnaire/actions';
import { DocumentSourceViewer } from './document-source-viewer';

interface QuestionSection {
  title: string;
  category: string;
  questions: TemplateQuestion[];
}

interface QuestionnaireFormProps {
  token: string;
  sections: QuestionSection[];
  answerMap: Map<string, QuestionnaireAnswer>;
  questionnaireId: string;
  documents?: QuestionnaireDocument[];
}

// Helper to parse multiselect values from JSON string or array
function parseMultiselectValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(v => String(v));
  }
  if (typeof value === 'string') {
    // Try to parse JSON array string like '["option1","option2"]'
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(v => String(v));
        }
      } catch {
        // Not valid JSON, fall through
      }
    }
    // Single value string
    if (value) {
      return [value];
    }
  }
  return [];
}

// Helper to extract page number from citation like "Page 45, Section 5.2"
function extractPageFromCitation(citation: string): number {
  const match = citation.match(/page\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 1;
}

interface LocalAnswer {
  answer_text?: string;
  answer_json?: unknown;
  source: AnswerSource;
  isDirty: boolean;
  isSaving: boolean;
}

// Source context for document viewer
interface SourceContext {
  question: TemplateQuestion;
  answer: QuestionnaireAnswer;
  document: QuestionnaireDocument;
  pageNumber: number;
}

export function QuestionnaireForm({
  token,
  sections,
  answerMap,
  questionnaireId: _questionnaireId, // Reserved for future use
  documents = [],
}: QuestionnaireFormProps) {
  const router = useRouter();
  const [sourceViewerState, setSourceViewerState] = useState<{
    isOpen: boolean;
    context: SourceContext | null;
  }>({
    isOpen: false,
    context: null,
  });
  const [localAnswers, setLocalAnswers] = useState<Map<string, LocalAnswer>>(
    new Map(
      Array.from(answerMap.entries()).map(([qId, answer]) => [
        qId,
        {
          answer_text: answer.answer_text || undefined,
          answer_json: answer.answer_json,
          source: answer.source,
          isDirty: false,
          isSaving: false,
        },
      ])
    )
  );

  // Calculate progress
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
  const answeredQuestions = sections.reduce(
    (acc, s) =>
      acc +
      s.questions.filter((q) => {
        const local = localAnswers.get(q.id);
        const saved = answerMap.get(q.id);
        return local?.answer_text || local?.answer_json || saved?.answer_text || saved?.answer_json;
      }).length,
    0
  );
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Update answer locally
  const updateAnswer = useCallback(
    (questionId: string, value: string | boolean | string[] | undefined) => {
      setLocalAnswers((prev) => {
        const existing = prev.get(questionId) || { source: 'manual' as const, isDirty: false, isSaving: false };
        const newMap = new Map(prev);
        newMap.set(questionId, {
          ...existing,
          answer_text: typeof value === 'string' ? value : undefined,
          answer_json: typeof value !== 'string' ? value : undefined,
          source: existing.source.startsWith('ai_') ? 'ai_modified' : 'manual',
          isDirty: true,
        });
        return newMap;
      });
    },
    []
  );

  // Confirm AI suggestion
  const confirmAISuggestion = useCallback((questionId: string) => {
    setLocalAnswers((prev) => {
      const existing = prev.get(questionId);
      if (!existing) return prev;
      const newMap = new Map(prev);
      newMap.set(questionId, {
        ...existing,
        source: 'ai_confirmed',
        isDirty: true,
      });
      return newMap;
    });
  }, []);

  // Save single answer
  const saveQuestionAnswer = useCallback(
    async (questionId: string) => {
      const local = localAnswers.get(questionId);
      if (!local || !local.isDirty) return;

      setLocalAnswers((prev) => {
        const newMap = new Map(prev);
        const existing = newMap.get(questionId)!;
        newMap.set(questionId, { ...existing, isSaving: true });
        return newMap;
      });

      try {
        const result = await saveAnswer(token, {
          question_id: questionId,
          answer_text: local.answer_text,
          answer_json: local.answer_json,
          source: local.source,
          vendor_confirmed: local.source === 'ai_confirmed',
        });

        if (result.success) {
          setLocalAnswers((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(questionId)!;
            newMap.set(questionId, { ...existing, isDirty: false, isSaving: false });
            return newMap;
          });
        } else {
          toast.error('Failed to save answer');
          setLocalAnswers((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(questionId)!;
            newMap.set(questionId, { ...existing, isSaving: false });
            return newMap;
          });
        }
      } catch {
        toast.error('Failed to save answer');
        setLocalAnswers((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(questionId)!;
          newMap.set(questionId, { ...existing, isSaving: false });
          return newMap;
        });
      }
    },
    [localAnswers, token]
  );

  // Save all dirty answers
  const saveAllAnswers = useCallback(async () => {
    const dirtyQuestions = Array.from(localAnswers.entries()).filter(([, a]) => a.isDirty);

    for (const [questionId] of dirtyQuestions) {
      await saveQuestionAnswer(questionId);
    }

    toast.success('All answers saved');
    router.refresh();
  }, [localAnswers, saveQuestionAnswer, router]);

  // Collect all AI sources for navigation
  const allAISources = useMemo(() => {
    const sources: SourceContext[] = [];
    for (const section of sections) {
      for (const question of section.questions) {
        const answer = answerMap.get(question.id);
        if (answer?.source === 'ai_extracted' && answer.ai_extraction_id && answer.ai_citation) {
          const document = documents.find(d => d.ai_extraction_id === answer.ai_extraction_id);
          if (document) {
            sources.push({
              question,
              answer,
              document,
              pageNumber: extractPageFromCitation(answer.ai_citation),
            });
          }
        }
      }
    }
    return sources;
  }, [sections, answerMap, documents]);

  // Open source viewer at citation
  const openSourceViewer = useCallback((
    question: TemplateQuestion,
    answer: QuestionnaireAnswer
  ) => {
    // Find the document associated with this extraction
    const document = documents.find(d => d.ai_extraction_id === answer.ai_extraction_id);
    if (!document) {
      toast.error('Source document not found');
      return;
    }

    const pageNumber = extractPageFromCitation(answer.ai_citation || '');

    setSourceViewerState({
      isOpen: true,
      context: { question, answer, document, pageNumber },
    });
  }, [documents]);

  const hasDirtyAnswers = Array.from(localAnswers.values()).some((a) => a.isDirty);
  const isSaving = Array.from(localAnswers.values()).some((a) => a.isSaving);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">
              {answeredQuestions} of {totalQuestions} questions
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Sections Accordion */}
      <Accordion type="multiple" defaultValue={sections.map((s) => s.title)} className="space-y-4">
        {sections.map((section) => {
          const sectionAnswered = section.questions.filter((q) => {
            const local = localAnswers.get(q.id);
            const saved = answerMap.get(q.id);
            return local?.answer_text || local?.answer_json || saved?.answer_text || saved?.answer_json;
          }).length;

          return (
            <AccordionItem key={section.title} value={section.title} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-medium text-left">{section.title}</span>
                  <Badge variant="outline">
                    {sectionAnswered}/{section.questions.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6">
                  {section.questions.map((question) => {
                    const savedAnswer = answerMap.get(question.id);
                    return (
                      <QuestionField
                        key={question.id}
                        question={question}
                        savedAnswer={savedAnswer}
                        localAnswer={localAnswers.get(question.id)}
                        onUpdate={(value) => updateAnswer(question.id, value)}
                        onConfirmAI={() => confirmAISuggestion(question.id)}
                        onBlur={() => saveQuestionAnswer(question.id)}
                        onViewSource={
                          documents.length > 0 && savedAnswer
                            ? () => openSourceViewer(question, savedAnswer)
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" asChild>
          <Link href={`/q/${token}/documents`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {hasDirtyAnswers && (
            <Button variant="outline" onClick={saveAllAnswers} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Progress
                </>
              )}
            </Button>
          )}
          <Button asChild>
            <Link href={`/q/${token}/review`}>
              Review & Submit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Document Source Viewer Sheet */}
      <DocumentSourceViewer
        isOpen={sourceViewerState.isOpen}
        onClose={() => setSourceViewerState({ isOpen: false, context: null })}
        token={token}
        sourceContext={sourceViewerState.context}
        documents={documents}
        allSources={allAISources}
        onNavigate={(context) => setSourceViewerState({ isOpen: true, context })}
      />
    </div>
  );
}

// Individual Question Field Component
interface QuestionFieldProps {
  question: TemplateQuestion;
  savedAnswer?: QuestionnaireAnswer;
  localAnswer?: LocalAnswer;
  onUpdate: (value: string | boolean | string[] | undefined) => void;
  onConfirmAI: () => void;
  onBlur: () => void;
  onViewSource?: () => void;
}

function QuestionField({
  question,
  savedAnswer,
  localAnswer,
  onUpdate,
  onConfirmAI,
  onBlur,
  onViewSource,
}: QuestionFieldProps) {
  const isAISuggestion = savedAnswer?.source === 'ai_extracted' && !localAnswer?.isDirty;
  const currentValue = localAnswer?.answer_text ?? localAnswer?.answer_json ?? savedAnswer?.answer_text ?? savedAnswer?.answer_json ?? '';

  return (
    <div className={cn('space-y-3 p-4 rounded-lg border', isAISuggestion && 'border-emerald-200 bg-emerald-50/30')}>
      {/* Question Label */}
      <div className="flex items-start justify-between gap-4">
        <Label className="text-base font-medium">
          {question.question_text}
          {question.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {isAISuggestion && (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Sparkles className="h-3 w-3" />
            AI Suggestion
          </Badge>
        )}
      </div>

      {/* Help Text */}
      {question.help_text && <p className="text-sm text-gray-500">{question.help_text}</p>}

      {/* Input based on question type */}
      {question.question_type === 'text' && (
        <Input
          value={currentValue as string}
          onChange={(e) => onUpdate(e.target.value)}
          onBlur={onBlur}
          placeholder="Enter your answer..."
        />
      )}

      {question.question_type === 'textarea' && (
        <Textarea
          value={currentValue as string}
          onChange={(e) => onUpdate(e.target.value)}
          onBlur={onBlur}
          placeholder="Enter your answer..."
          className="min-h-[100px]"
        />
      )}

      {question.question_type === 'boolean' && (
        <div className="flex items-center gap-3">
          <Switch
            checked={currentValue === 'true' || currentValue === true}
            onCheckedChange={(checked) => {
              onUpdate(checked ? 'true' : 'false');
              setTimeout(onBlur, 100);
            }}
          />
          <span className="text-sm text-gray-600">
            {currentValue === 'true' || currentValue === true ? 'Yes' : 'No'}
          </span>
        </div>
      )}

      {question.question_type === 'select' && (
        <Select
          value={currentValue as string}
          onValueChange={(value) => {
            onUpdate(value);
            setTimeout(onBlur, 100);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {question.question_type === 'multiselect' && (
        <div className="space-y-2">
          {question.options?.map((option) => {
            // Parse JSON string to array if needed (AI extractions store as JSON string)
            const selectedValues = parseMultiselectValue(currentValue);
            const isChecked = selectedValues.includes(option.value);

            return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option.value}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value);
                    onUpdate(newValues);
                    setTimeout(onBlur, 100);
                  }}
                />
                <label
                  htmlFor={`${question.id}-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                  {option.description && (
                    <span className="text-gray-500 ml-1">- {option.description}</span>
                  )}
                </label>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Citation with View Source button */}
      {isAISuggestion && savedAnswer?.ai_citation && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">Source: {savedAnswer.ai_citation}</span>
          {onViewSource && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={onViewSource}
            >
              <FileText className="h-3 w-3 mr-1" />
              View Source
            </Button>
          )}
        </div>
      )}

      {/* Confirm AI Suggestion Button */}
      {isAISuggestion && (
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onConfirmAI();
              setTimeout(onBlur, 100);
            }}
            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Confirm AI Answer
          </Button>
          <span className="text-xs text-gray-500">or edit to modify</span>
        </div>
      )}

      {/* Saving Indicator */}
      {localAnswer?.isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
