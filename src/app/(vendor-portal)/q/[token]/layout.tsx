/**
 * Vendor Portal Layout
 *
 * Public layout for vendor questionnaire completion
 * No authentication required - uses magic link token
 * Supports organization branding customization
 */

import Image from 'next/image';
import { Shield, HelpCircle, Mail } from 'lucide-react';
import { validateQuestionnaireToken } from '@/lib/nis2-questionnaire/queries';
import { getBrandingByQuestionnaireToken } from '@/lib/settings/branding';
import { DEFAULT_BRANDING } from '@/lib/settings/branding-types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}

export default async function VendorPortalLayout({ children, params }: LayoutProps) {
  const { token } = await params;

  // Validate token and fetch branding in parallel
  const [validation, brandingResult] = await Promise.all([
    validateQuestionnaireToken(token),
    getBrandingByQuestionnaireToken(token),
  ]);

  // Get branding data or use defaults
  const branding = brandingResult.success && brandingResult.data
    ? brandingResult.data
    : {
        organizationName: validation.organization_name || 'Organization',
        logoUrl: null,
        primaryColor: DEFAULT_BRANDING.primaryColor,
        accentColor: DEFAULT_BRANDING.accentColor,
        portalWelcomeTitle: DEFAULT_BRANDING.portalWelcomeTitle,
        portalWelcomeMessage: DEFAULT_BRANDING.portalWelcomeMessage,
        portalFooterText: null,
        portalSupportEmail: null,
        portalLogoPosition: DEFAULT_BRANDING.portalLogoPosition,
      };

  if (!validation.is_valid) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(to bottom right, ${branding.primaryColor}15, ${branding.accentColor}10)`,
        }}
      >
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
          {branding.portalSupportEmail && (
            <a
              href={`mailto:${branding.portalSupportEmail}`}
              className="inline-flex items-center gap-2 mt-4 text-sm hover:underline"
              style={{ color: branding.primaryColor }}
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Custom CSS Variables for branding */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --portal-primary: ${branding.primaryColor};
                --portal-accent: ${branding.accentColor};
              }
              .portal-btn-primary {
                background-color: ${branding.primaryColor};
                border-color: ${branding.primaryColor};
              }
              .portal-btn-primary:hover {
                background-color: ${branding.primaryColor}dd;
              }
              .portal-text-primary {
                color: ${branding.primaryColor};
              }
              .portal-border-primary {
                border-color: ${branding.primaryColor}30;
              }
              .portal-bg-primary-light {
                background-color: ${branding.primaryColor}08;
              }
            `,
          }}
        />

        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50 portal-border-primary">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div
              className={cn(
                'flex items-center',
                branding.portalLogoPosition === 'center' && 'justify-center',
                branding.portalLogoPosition === 'right' && 'justify-end',
                branding.portalLogoPosition === 'left' && 'justify-between'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-3',
                  branding.portalLogoPosition === 'center' && 'flex-col text-center'
                )}
              >
                {branding.logoUrl ? (
                  <div className="relative h-10 w-40">
                    <Image
                      src={branding.logoUrl}
                      alt={`${branding.organizationName} logo`}
                      fill
                      className="object-contain object-left"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="font-semibold text-gray-900">{branding.organizationName}</h1>
                  <p className="text-sm text-gray-500">Security Questionnaire</p>
                </div>
              </div>

              {branding.portalLogoPosition === 'left' && (
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
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto portal-border-primary">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: branding.primaryColor }} />
                <span>Powered by NIS2 Comply</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                {branding.portalFooterText ? (
                  <span>{branding.portalFooterText}</span>
                ) : (
                  <>
                    <span>Your data is encrypted and secure</span>
                    <span className="hidden md:inline">|</span>
                  </>
                )}
                {branding.portalSupportEmail ? (
                  <a
                    href={`mailto:${branding.portalSupportEmail}`}
                    className="hover:underline flex items-center gap-1"
                    style={{ color: branding.primaryColor }}
                  >
                    <Mail className="h-3 w-3" />
                    {branding.portalSupportEmail}
                  </a>
                ) : (
                  <span>Questions? Contact {branding.organizationName}</span>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
