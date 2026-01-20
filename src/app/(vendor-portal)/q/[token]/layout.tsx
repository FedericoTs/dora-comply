/**
 * Vendor Portal Layout
 *
 * Public layout for vendor questionnaire completion
 * No authentication required - uses magic link token
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Shield, HelpCircle } from 'lucide-react';
import { validateQuestionnaireToken } from '@/lib/nis2-questionnaire/queries';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}

export default async function VendorPortalLayout({ children, params }: LayoutProps) {
  const { token } = await params;

  // Validate token
  const validation = await validateQuestionnaireToken(token);

  if (!validation.is_valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">{validation.message}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the organization that sent you this
            questionnaire.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{validation.organization_name}</h1>
                  <p className="text-sm text-gray-500">Security Questionnaire</p>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-5 w-5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>
                    This questionnaire assesses your organization&apos;s security practices under
                    NIS2 requirements. Your answers help ensure compliance.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Powered by NIS2 Comply</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Your data is encrypted and secure</span>
                <span>|</span>
                <span>Questions? Contact {validation.organization_name}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
