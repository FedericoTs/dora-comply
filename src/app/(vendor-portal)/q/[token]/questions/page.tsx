/**
 * Vendor Portal - Questions Page
 *
 * Answer questionnaire questions with AI suggestions
 */

import { redirect } from 'next/navigation';
import { getVendorPortalData } from '@/lib/nis2-questionnaire/queries';
import { VendorPortalSteps } from '@/components/questionnaires/vendor-portal/vendor-portal-steps';
import { QuestionnaireForm } from '@/components/questionnaires/vendor-portal/questionnaire-form';
import { ProcessDocumentsCard } from '@/components/questionnaires/vendor-portal/process-documents-card';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function QuestionsPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getVendorPortalData(token);

  if (!data) {
    redirect('/');
  }

  const { questionnaire, questions, answers, documents } = data;

  // Calculate unprocessed documents
  const unprocessedDocuments = documents.filter((d) => !d.ai_processed);
  const hasAIAnswers = answers.some((a) => a.source === 'ai_extracted');

  // If already completed
  if (['approved', 'submitted'].includes(questionnaire.status)) {
    redirect(`/q/${token}/complete`);
  }

  // Create answer map
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  // Group questions by category with section titles
  const groupedQuestions = questions.reduce(
    (acc, q) => {
      const sectionTitle = q.section_title || q.category;
      if (!acc[sectionTitle]) {
        acc[sectionTitle] = {
          title: q.section_title || formatCategory(q.category),
          category: q.category,
          questions: [],
        };
      }
      acc[sectionTitle].questions.push(q);
      return acc;
    },
    {} as Record<string, { title: string; category: string; questions: typeof questions }>
  );

  return (
    <div className="space-y-6">
      {/* Steps */}
      <VendorPortalSteps currentStep={2} token={token} />

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Answer Questions</h1>
        <p className="text-gray-600">
          Complete all required questions. AI suggestions are highlighted - review and confirm them.
        </p>
      </div>

      {/* Process Documents Card - show if there are unprocessed documents */}
      {documents.length > 0 && (
        <ProcessDocumentsCard
          token={token}
          unprocessedCount={unprocessedDocuments.length}
          totalDocuments={documents.length}
        />
      )}

      {/* Questionnaire Form */}
      <QuestionnaireForm
        token={token}
        sections={Object.values(groupedQuestions)}
        answerMap={answerMap}
        questionnaireId={questionnaire.id}
      />
    </div>
  );
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
