/**
 * Vendor Portal - Review Page
 *
 * Review answers before submitting
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getVendorPortalData } from '@/lib/nis2-questionnaire/queries';
import { VendorPortalSteps } from '@/components/questionnaires/vendor-portal/vendor-portal-steps';
import { SubmitQuestionnaireButton } from '@/components/questionnaires/vendor-portal/submit-questionnaire-button';
import { getCategoryLabel } from '@/lib/nis2-questionnaire/questions-library';
import type { NIS2Category } from '@/lib/nis2-questionnaire/types';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getVendorPortalData(token);

  if (!data) {
    redirect('/');
  }

  const { questionnaire, questions, answers, documents, organization_name } = data;

  // If already completed
  if (['approved', 'submitted'].includes(questionnaire.status)) {
    redirect(`/q/${token}/complete`);
  }

  // Create answer map
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  // Calculate stats
  const totalQuestions = questions.length;
  const answeredQuestions = answers.filter((a) => a.answer_text || a.answer_json).length;
  const requiredQuestions = questions.filter((q) => q.is_required);
  const unansweredRequired = requiredQuestions.filter(
    (q) => !answerMap.get(q.id)?.answer_text && !answerMap.get(q.id)?.answer_json
  );
  const aiAssistedCount = answers.filter((a) =>
    ['ai_extracted', 'ai_confirmed', 'ai_modified'].includes(a.source)
  ).length;

  const canSubmit = unansweredRequired.length === 0;

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
    {} as Record<string, typeof questions>
  );

  return (
    <div className="space-y-6">
      {/* Steps */}
      <VendorPortalSteps currentStep={3} token={token} />

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Review & Submit</h1>
        <p className="text-gray-600">
          Review your answers before submitting to {organization_name}.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                canSubmit ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              {canSubmit ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="font-semibold">
                {answeredQuestions}/{totalQuestions} questions
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">AI Assisted</p>
              <p className="font-semibold">{aiAssistedCount} answers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Documents</p>
              <p className="font-semibold">{documents.length} uploaded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Warning */}
      {!canSubmit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Required Questions Missing</AlertTitle>
          <AlertDescription>
            Please answer all required questions before submitting. You have{' '}
            {unansweredRequired.length} required question(s) unanswered.
          </AlertDescription>
        </Alert>
      )}

      {/* Answers Review */}
      <Card>
        <CardHeader>
          <CardTitle>Your Answers</CardTitle>
          <CardDescription>Review your responses below. Click Edit to make changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(questionsByCategory).map(([category, categoryQuestions]) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{getCategoryLabel(category as NIS2Category)}</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/q/${token}/questions`}>Edit</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {categoryQuestions.map((question) => {
                  const answer = answerMap.get(question.id);
                  const hasAnswer = answer?.answer_text || answer?.answer_json;

                  return (
                    <div
                      key={question.id}
                      className="flex items-start justify-between p-3 rounded-lg border bg-gray-50/50"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </p>
                        {hasAnswer ? (
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {formatAnswer(question, answer)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No answer provided</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {hasAnswer ? (
                          <>
                            {answer.source.startsWith('ai_') && (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI
                              </Badge>
                            )}
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </>
                        ) : question.is_required ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <span className="text-xs text-gray-400">Optional</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit Section */}
      <Card className={canSubmit ? 'border-emerald-200 bg-emerald-50/50' : ''}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                {canSubmit ? 'Ready to Submit' : 'Complete Required Questions'}
              </h3>
              <p className="text-sm text-gray-600">
                {canSubmit
                  ? `Your questionnaire will be sent to ${organization_name} for review.`
                  : 'Please complete all required questions before submitting.'}
              </p>
            </div>
            <SubmitQuestionnaireButton token={token} disabled={!canSubmit} />
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" asChild>
          <Link href={`/q/${token}/questions`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Questions
          </Link>
        </Button>
      </div>
    </div>
  );
}

function formatAnswer(
  question: { question_type: string; options?: { value: string; label: string }[] },
  answer?: { answer_text?: string | null; answer_json?: unknown }
): string {
  if (!answer) return '';

  if (question.question_type === 'boolean') {
    return answer.answer_text === 'true' || answer.answer_json === true ? 'Yes' : 'No';
  }

  if (question.question_type === 'multiselect' && Array.isArray(answer.answer_json)) {
    const values = answer.answer_json as string[];
    return values
      .map((v) => question.options?.find((o) => o.value === v)?.label || v)
      .join(', ');
  }

  if (question.question_type === 'select' && answer.answer_text) {
    return question.options?.find((o) => o.value === answer.answer_text)?.label || answer.answer_text;
  }

  return answer.answer_text || '';
}
