'use client';

/**
 * RoI Population State Components
 *
 * Various status views for the RoI population flow.
 */

import { useRouter } from 'next/navigation';
import {
  Loader2,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Server,
  Network,
  FileText,
  Link as LinkIcon,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ExistingMapping, PopulateResult } from '@/lib/roi/roi-population-types';

// Loading State
export function RoiPopulationLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-3 text-muted-foreground">Loading RoI preview...</span>
    </div>
  );
}

// Error State
interface RoiPopulationErrorProps {
  error: string;
  onRetry: () => void;
}

export function RoiPopulationError({ error, onRetry }: RoiPopulationErrorProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="py-8 text-center">
        <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-lg font-medium">Failed to Load Preview</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

// Needs Vendor State
interface RoiNeedsVendorProps {
  documentId: string;
}

export function RoiNeedsVendor({ documentId }: RoiNeedsVendorProps) {
  const router = useRouter();

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="py-8 text-center">
        <LinkIcon className="h-12 w-12 mx-auto text-warning mb-4" />
        <p className="text-lg font-medium">Document Not Linked to Vendor</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Before populating the Register of Information from this SOC2 report, you must link it to
          a registered vendor. The vendor should be registered first, then the document linked to
          them.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Button onClick={() => router.push(`/documents/${documentId}`)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Link to Vendor
          </Button>
          <Button variant="outline" onClick={() => router.push('/vendors/new')}>
            <Building2 className="h-4 w-4 mr-2" />
            Register New Vendor
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          After linking, return to this page to populate your RoI.
        </p>
      </CardContent>
    </Card>
  );
}

// Already Populated State
interface RoiAlreadyPopulatedProps {
  existingMapping: ExistingMapping;
}

export function RoiAlreadyPopulated({ existingMapping }: RoiAlreadyPopulatedProps) {
  const router = useRouter();

  return (
    <Card className="border-success/50 bg-success/5">
      <CardContent className="py-8 text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
        <p className="text-lg font-medium">RoI Already Populated</p>
        <p className="text-sm text-muted-foreground mt-1">
          This SOC2 report was used to populate RoI on{' '}
          {new Date(existingMapping.extractedAt).toLocaleDateString()}
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <Button variant="outline" onClick={() => router.push('/roi')}>
            <FileText className="h-4 w-4 mr-2" />
            View Register of Information
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Unable to Populate State
export function RoiUnableToPopulate() {
  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="py-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
        <p className="text-lg font-medium">Unable to Populate RoI</p>
        <p className="text-sm text-muted-foreground mt-1">
          The SOC2 report does not contain sufficient data for RoI population. Ensure the report
          has been fully parsed.
        </p>
      </CardContent>
    </Card>
  );
}

// Success State
interface RoiPopulationSuccessProps {
  result: PopulateResult;
}

export function RoiPopulationSuccess({ result }: RoiPopulationSuccessProps) {
  const router = useRouter();

  return (
    <Card className="border-success/50 bg-success/5">
      <CardContent className="py-8">
        <div className="text-center mb-6">
          <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
          <p className="text-lg font-medium">RoI Successfully Populated!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Data extracted from SOC2 has been added to your Register of Information
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {result.vendorUpdated && result.vendorId && (
            <Card>
              <CardContent className="py-4 text-center">
                <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-medium">Vendor Updated</p>
                <p className="text-xs text-muted-foreground">SOC2 audit info added</p>
                <Button
                  variant="link"
                  className="mt-1"
                  onClick={() => router.push(`/vendors/${result.vendorId}`)}
                >
                  View Vendor <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
          {(result.serviceIds?.length || 0) > 0 && (
            <Card>
              <CardContent className="py-4 text-center">
                <Server className="h-8 w-8 mx-auto text-info mb-2" />
                <p className="font-medium">{result.serviceIds?.length} Services</p>
                <p className="text-sm text-muted-foreground">Added to RoI</p>
              </CardContent>
            </Card>
          )}
          {(result.subcontractorIds?.length || 0) > 0 && (
            <Card>
              <CardContent className="py-4 text-center">
                <Network className="h-8 w-8 mx-auto text-warning mb-2" />
                <p className="font-medium">{result.subcontractorIds?.length} Subcontractors</p>
                <p className="text-sm text-muted-foreground">4th parties tracked</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={() => router.push('/roi')}>
            <FileText className="h-4 w-4 mr-2" />
            View Register of Information
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Parse Another Document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
