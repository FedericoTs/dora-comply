/**
 * Vendor Portal - Complete Page
 *
 * Confirmation after questionnaire submission
 */

import { redirect } from 'next/navigation';
import { CheckCircle2, Clock, Mail, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVendorPortalData } from '@/lib/nis2-questionnaire/queries';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CompletePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getVendorPortalData(token);

  if (!data) {
    redirect('/');
  }

  const { questionnaire, answers, organization_name } = data;

  // Calculate stats
  const aiAssistedCount = answers.filter((a) =>
    ['ai_extracted', 'ai_confirmed', 'ai_modified'].includes(a.source)
  ).length;
  const totalAnswers = answers.length;

  const isApproved = questionnaire.status === 'approved';
  const isSubmitted = questionnaire.status === 'submitted';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div
          className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center ${
            isApproved ? 'bg-emerald-100' : 'bg-blue-100'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          ) : (
            <Clock className="h-10 w-10 text-blue-600" />
          )}
        </div>

        <div className="space-y-2">
          <Badge variant={isApproved ? 'default' : 'secondary'} className="text-sm">
            {isApproved ? 'Approved' : 'Submitted'}
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900">
            {isApproved ? 'Questionnaire Approved!' : 'Thank You!'}
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            {isApproved
              ? `Your questionnaire has been reviewed and approved by ${organization_name}.`
              : `Your questionnaire has been submitted to ${organization_name} for review.`}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card className={isApproved ? 'border-emerald-200 bg-emerald-50/50' : 'border-blue-200 bg-blue-50/50'}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                isApproved ? 'bg-emerald-100' : 'bg-blue-100'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <Clock className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {isApproved ? 'Assessment Complete' : 'Under Review'}
              </p>
              <p className="text-sm text-gray-600">
                {isApproved
                  ? 'No further action required'
                  : 'You will be notified once the review is complete'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{totalAnswers}</p>
            <p className="text-sm text-gray-500">Questions Answered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <p className="text-3xl font-bold text-gray-900">{aiAssistedCount}</p>
            </div>
            <p className="text-sm text-gray-500">AI Assisted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">
              {questionnaire.submitted_at
                ? new Date(questionnaire.submitted_at).toLocaleDateString()
                : '-'}
            </p>
            <p className="text-sm text-gray-500">Submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* What's Next */}
      {!isApproved && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Review Process</p>
                  <p className="text-sm text-gray-600">
                    {organization_name} will review your responses and uploaded documents.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Possible Follow-up</p>
                  <p className="text-sm text-gray-600">
                    You may receive requests for clarification or additional information.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-emerald-600">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Approval</p>
                  <p className="text-sm text-gray-600">
                    Once approved, you&apos;ll receive a confirmation email.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Notes (if rejected and resubmitted) */}
      {questionnaire.review_notes && isSubmitted && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Previous Review Notes</h2>
            <p className="text-sm text-gray-700">{questionnaire.review_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Mail className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            Questions? Contact {organization_name} directly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
