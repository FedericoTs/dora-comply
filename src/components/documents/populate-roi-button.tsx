'use client';

/**
 * Populate RoI Button Component
 *
 * Allows users to populate Register of Information data directly from
 * AI contract analysis results. This is the key 10X differentiator.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  FileText,
  Building2,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RoiPopulationPreview {
  contractData: {
    contractRef: string;
    contractType: string;
    effectiveDate: string | null;
    expiryDate: string | null;
    governingLaw: string | null;
    complianceScore: number;
  };
  vendorData: {
    providerName: string | null;
    providerRole: string;
    existingVendorId?: string;
    needsCreation: boolean;
  };
  doraProvisions: {
    article30_2Score: number;
    article30_3Score: number;
    presentCount: number;
    partialCount: number;
    missingCount: number;
  };
  riskFlags: string[];
  complianceGaps: string[];
}

interface PopulateRoiButtonProps {
  documentId: string;
  hasAnalysis: boolean;
  vendorId?: string;
  vendorName?: string;
}

export function PopulateRoiButton({
  documentId,
  hasAnalysis,
  vendorId,
  vendorName,
}: PopulateRoiButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RoiPopulationPreview | null>(null);
  const [createVendor, setCreateVendor] = useState(false);
  const [populating, setPopulating] = useState(false);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/roi/populate?documentId=${documentId}`);
      const data = await response.json();

      if (data.success && data.preview) {
        setPreview(data.preview);
        // Auto-check create vendor if needed and no existing vendor
        setCreateVendor(data.preview.vendorData.needsCreation && !vendorId);
      } else {
        toast.error(data.error || 'Failed to load preview');
      }
    } catch {
      toast.error('Failed to load RoI preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePopulate = async () => {
    setPopulating(true);
    try {
      const response = await fetch('/api/roi/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          options: {
            createVendor: createVendor && !vendorId,
            useExistingVendorId: vendorId,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('RoI data populated successfully!', {
          description: `Contract ${data.contractId?.slice(0, 8)} created`,
          action: {
            label: 'View RoI',
            onClick: () => router.push('/roi'),
          },
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to populate RoI');
      }
    } catch {
      toast.error('Failed to populate RoI data');
    } finally {
      setPopulating(false);
    }
  };

  if (!hasAnalysis) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o && !preview) loadPreview();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          Populate RoI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Populate Register of Information
          </DialogTitle>
          <DialogDescription>
            Transfer AI-extracted contract data to your RoI templates for ESA submission.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : preview ? (
          <div className="space-y-6">
            {/* Contract Data Preview */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Contract Data
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="ml-2 font-mono">{preview.contractData.contractRef}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 capitalize">
                    {preview.contractData.contractType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Effective:</span>
                  <span className="ml-2">
                    {preview.contractData.effectiveDate || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="ml-2">
                    {preview.contractData.expiryDate || 'Not specified'}
                  </span>
                </div>
                {preview.contractData.governingLaw && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Governing Law:</span>
                    <span className="ml-2">{preview.contractData.governingLaw}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vendor Data */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                ICT Provider
              </div>
              {vendorId ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">
                    Linked to existing vendor: <strong>{vendorName}</strong>
                  </span>
                </div>
              ) : preview.vendorData.providerName ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      Provider identified: <strong>{preview.vendorData.providerName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createVendor"
                      checked={createVendor}
                      onCheckedChange={(c) => setCreateVendor(c as boolean)}
                    />
                    <Label htmlFor="createVendor" className="text-sm">
                      Create new vendor record for this provider
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-error/30 bg-error/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-error">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">No provider identified in contract</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A vendor must be linked to create RoI records. Please first link this document to an existing vendor or ensure the AI analysis identified a provider.
                  </p>
                </div>
              )}
            </div>

            {/* DORA Compliance Score */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" />
                DORA Compliance Score
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress value={preview.contractData.complianceScore} className="h-2" />
                </div>
                <span className="text-lg font-semibold">
                  {preview.contractData.complianceScore}%
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="bg-success/10 text-success">
                  {preview.doraProvisions.presentCount} Present
                </Badge>
                <Badge variant="outline" className="bg-warning/10 text-warning">
                  {preview.doraProvisions.partialCount} Partial
                </Badge>
                <Badge variant="outline" className="bg-error/10 text-error">
                  {preview.doraProvisions.missingCount} Missing
                </Badge>
              </div>
            </div>

            {/* Risk Flags */}
            {preview.riskFlags.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Flags ({preview.riskFlags.length})
                </div>
                <ul className="text-sm space-y-1 pl-6 list-disc">
                  {preview.riskFlags.map((flag, i) => (
                    <li key={i}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* What will be created */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">This will create:</p>
              <ul className="text-sm space-y-1">
                {(createVendor || vendorId) && (
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    {createVendor ? '1 new vendor' : 'Link to existing vendor'} in{' '}
                    <strong>B_02.01</strong> (Provider Registry)
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  1 contract record in <strong>B_03.01</strong> (Contracts)
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3 w-3" />
                  1 ICT service record in <strong>B_04.01</strong> (Services)
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Unable to load preview
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePopulate}
            disabled={populating || !preview || (!vendorId && !createVendor)}
            className="gap-2"
          >
            {populating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Populating...
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Populate RoI
              </>
            )}
          </Button>
          {preview && !vendorId && !createVendor && (
            <p className="text-xs text-error mt-2 w-full text-right">
              Please select or create a vendor to continue
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
