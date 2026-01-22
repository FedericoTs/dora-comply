/**
 * Vendor Portal - Documents Upload Page
 *
 * Upload documents for AI-assisted answer extraction.
 * Documents are automatically processed after upload.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getVendorPortalData } from '@/lib/nis2-questionnaire/queries';
import { DocumentUploadZone } from '@/components/questionnaires/vendor-portal/document-upload-zone';
import { VendorPortalSteps } from '@/components/questionnaires/vendor-portal/vendor-portal-steps';

interface PageProps {
  params: Promise<{ token: string }>;
}

const SUPPORTED_DOCUMENT_TYPES = [
  {
    type: 'soc2',
    label: 'SOC 2 Report',
    description: 'Type I or Type II audit report',
    icon: FileText,
  },
  {
    type: 'iso27001',
    label: 'ISO 27001 Certificate',
    description: 'Current certification document',
    icon: FileText,
  },
  {
    type: 'policy',
    label: 'Security Policies',
    description: 'Information security policies',
    icon: FileText,
  },
  {
    type: 'certificate',
    label: 'Other Certifications',
    description: 'PCI DSS, HIPAA, etc.',
    icon: FileText,
  },
];

export default async function DocumentsPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getVendorPortalData(token);

  if (!data) {
    redirect('/');
  }

  const { questionnaire, documents } = data;

  // If already completed
  if (['approved', 'submitted'].includes(questionnaire.status)) {
    redirect(`/q/${token}/complete`);
  }

  return (
    <div className="space-y-6">
      {/* Steps */}
      <VendorPortalSteps currentStep={1} token={token} />

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Upload Documents</h1>
        <p className="text-gray-600">
          Upload your security documents and our AI will automatically extract relevant information
          to help fill out the questionnaire.
        </p>
      </div>

      {/* AI Feature Highlight */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">AI-Powered Extraction</p>
            <p className="text-sm text-gray-600">
              Our AI analyzes your documents and pre-fills questionnaire answers. You&apos;ll review
              and confirm each suggestion.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Supported Documents</CardTitle>
          <CardDescription>
            Upload any of these document types (PDF format, max 50MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {SUPPORTED_DOCUMENT_TYPES.map((docType) => (
              <div
                key={docType.type}
                className="flex items-center gap-3 p-3 rounded-lg border bg-white"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <docType.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{docType.label}</p>
                  <p className="text-sm text-gray-500">{docType.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <DocumentUploadZone token={token} existingDocuments={documents} />

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Previously Uploaded Documents
              <Badge variant="secondary">{documents.length}</Badge>
            </CardTitle>
            <CardDescription>
              These documents have already been uploaded and processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${doc.ai_processed ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      {doc.ai_processed ? (
                        <Sparkles className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type}
                        </Badge>
                        <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.ai_processed ? (
                      <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        AI Analyzed
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending Analysis</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip Note */}
      <Card className="border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-gray-500">
            <strong>No documents?</strong> No problem! You can skip this step and fill out the
            questionnaire manually.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" asChild>
          <Link href={`/q/${token}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/q/${token}/questions`}>
            Continue to Questions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
