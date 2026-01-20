/**
 * Vendor Portal Entry Page
 *
 * Shows questionnaire overview and allows vendor to start
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  Calendar,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { validateQuestionnaireToken, getVendorPortalData } from '@/lib/nis2-questionnaire/queries';
import { startQuestionnaire } from '@/lib/nis2-questionnaire/actions';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VendorPortalEntryPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getVendorPortalData(token);

  if (!data) {
    redirect('/');
  }

  const { questionnaire, template, questions, answers, documents, organization_name } = data;

  // If already completed
  if (['approved', 'submitted'].includes(questionnaire.status)) {
    redirect(`/q/${token}/complete`);
  }

  // Check if already started
  const isStarted = ['in_progress', 'rejected'].includes(questionnaire.status);
  const hasDocuments = documents.length > 0;
  const answeredCount = answers.filter((a) => a.answer_text || a.answer_json).length;

  // Estimate time
  const estimatedMinutes = template.estimated_completion_minutes || 30;

  const steps = [
    {
      number: 1,
      title: 'Upload Documents',
      description: 'Upload SOC 2, ISO 27001, or security policies',
      icon: Upload,
      isComplete: hasDocuments,
    },
    {
      number: 2,
      title: 'Answer Questions',
      description: 'Review AI suggestions and complete responses',
      icon: FileText,
      isComplete: answeredCount === questions.length,
    },
    {
      number: 3,
      title: 'Review & Submit',
      description: 'Review your answers and submit',
      icon: CheckCircle2,
      isComplete: questionnaire.status === 'submitted',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="text-sm">
          <Building2 className="h-3 w-3 mr-1" />
          Requested by {organization_name}
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
        {template.description && (
          <p className="text-gray-600 max-w-2xl mx-auto">{template.description}</p>
        )}
      </div>

      {/* Status Card (if in progress) */}
      {isStarted && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Welcome back!</h3>
                <p className="text-sm text-gray-600">
                  You&apos;ve answered {answeredCount} of {questions.length} questions
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32">
                  <Progress value={questionnaire.progress_percentage} className="h-2" />
                </div>
                <span className="text-sm font-medium">{questionnaire.progress_percentage}%</span>
              </div>
            </div>
            {questionnaire.status === 'rejected' && questionnaire.review_notes && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm font-medium text-amber-800">Changes Requested</p>
                <p className="text-sm text-amber-700 mt-1">{questionnaire.review_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Estimated Time</p>
              <p className="font-semibold">{estimatedMinutes} minutes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="font-semibold">{questions.length} questions</p>
            </div>
          </CardContent>
        </Card>
        {questionnaire.due_date && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-semibold">
                  {new Date(questionnaire.due_date).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Feature Highlight */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Auto-Fill</h3>
              <p className="text-gray-600 text-sm">
                Upload your SOC 2 report, ISO 27001 certificate, or security policies. Our AI will
                automatically extract relevant information and pre-fill answers for you to review
                and confirm.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Complete these three steps to submit your questionnaire</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-start gap-4">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    step.isComplete
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.isComplete ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                {index === 0 && !step.isComplete && (
                  <Badge variant="outline" className="shrink-0">
                    Optional
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center">
        <form
          action={async () => {
            'use server';
            await startQuestionnaire(token);
          }}
        >
          <Button size="lg" className="px-8" asChild>
            <Link href={`/q/${token}/documents`}>
              {isStarted ? 'Continue Questionnaire' : 'Get Started'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </form>
      </div>

      {/* Security Note */}
      <p className="text-center text-sm text-gray-500">
        Your responses are encrypted and stored securely. Only {organization_name} will have access
        to your answers.
      </p>
    </div>
  );
}
