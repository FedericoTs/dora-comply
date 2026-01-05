'use client';

/**
 * RoI Population Tab - 10X Market Differentiator
 *
 * One-click SOC2-to-RoI population. No competitor does this.
 *
 * Features:
 * - Preview extracted data before population
 * - Select which items to include
 * - Confidence indicators
 * - Link existing vendor or create new
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Building2,
  Server,
  Network,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Plus,
  Link as LinkIcon,
  FileText,
  Sparkles,
  ChevronRight,
  XCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RoiPopulationPreview {
  vendor: {
    name: string;
    description?: string;
    auditInfo?: string;
    confidence: number;
    isNew: boolean;
    existingVendorId?: string;
  } | null;
  services: {
    name: string;
    type: string;
    description?: string;
    confidence: number;
  }[];
  subcontractors: {
    name: string;
    serviceType?: string;
    inclusionMethod: string;
    hasOwnSoc2: boolean;
    confidence: number;
  }[];
  templatesSuggested: {
    templateId: string;
    templateName: string;
    fieldsPopulated: number;
    totalFields: number;
    coverage: number;
  }[];
  overallConfidence: number;
}

interface ExistingMapping {
  id: string;
  status: string;
  isConfirmed: boolean;
  extractedAt: string;
}

interface PopulateResult {
  success: boolean;
  mappingId?: string;
  vendorId?: string;
  vendorCreated?: boolean;
  serviceIds?: string[];
  subcontractorIds?: string[];
  confidence?: number;
  errors?: string[];
  warnings?: string[];
}

interface RoiPopulationTabProps {
  documentId: string;
  vendorName?: string;
  vendorId?: string;
}

export function RoiPopulationTab({ documentId, vendorName, vendorId: existingVendorId }: RoiPopulationTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [preview, setPreview] = useState<RoiPopulationPreview | null>(null);
  const [existingMapping, setExistingMapping] = useState<ExistingMapping | null>(null);
  const [canPopulate, setCanPopulate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [createVendor, setCreateVendor] = useState(true);
  const [useExistingVendor, setUseExistingVendor] = useState(!!existingVendorId);
  const [selectedVendorId, setSelectedVendorId] = useState(existingVendorId || '');
  const [createServices, setCreateServices] = useState(true);
  const [selectedSubcontractors, setSelectedSubcontractors] = useState<string[]>([]);
  const [populateResult, setPopulateResult] = useState<PopulateResult | null>(null);

  // Fetch preview on mount
  useEffect(() => {
    fetchPreview();
  }, [documentId]);

  // Auto-select all subcontractors
  useEffect(() => {
    if (preview?.subcontractors) {
      setSelectedSubcontractors(preview.subcontractors.map(s => s.name));
    }
  }, [preview?.subcontractors]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/roi/populate-from-soc2?documentId=${documentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load preview');
      }

      setPreview(data.preview);
      setExistingMapping(data.existingMapping);
      setCanPopulate(data.canPopulate);

      // If there's an existing vendor match, pre-select it
      if (data.preview?.vendor?.existingVendorId) {
        setUseExistingVendor(true);
        setSelectedVendorId(data.preview.vendor.existingVendorId);
        setCreateVendor(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handlePopulate = async () => {
    setPopulating(true);
    setError(null);

    try {
      const response = await fetch('/api/roi/populate-from-soc2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          options: {
            createVendor: !useExistingVendor,
            useExistingVendorId: useExistingVendor ? selectedVendorId || existingVendorId : undefined,
            selectedSubcontractors,
            createServices,
          },
        }),
      });

      const result: PopulateResult = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.[0] || 'Failed to populate RoI');
      }

      setPopulateResult(result);

      if (result.success) {
        toast.success('RoI populated successfully!', {
          description: `Created: ${result.vendorCreated ? '1 vendor, ' : ''}${result.serviceIds?.length || 0} services, ${result.subcontractorIds?.length || 0} subcontractors`,
        });

        // Refresh to show updated state
        fetchPreview();
      } else if (result.warnings?.length) {
        toast.warning('RoI populated with warnings', {
          description: result.warnings[0],
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to populate';
      setError(message);
      toast.error('Population failed', { description: message });
    } finally {
      setPopulating(false);
    }
  };

  const toggleSubcontractor = (name: string) => {
    setSelectedSubcontractors(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading RoI preview...</span>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="py-8 text-center">
          <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-lg font-medium">Failed to Load Preview</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button onClick={fetchPreview} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (existingMapping?.isConfirmed) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
          <p className="text-lg font-medium">RoI Already Populated</p>
          <p className="text-sm text-muted-foreground mt-1">
            This SOC2 report was used to populate RoI on {new Date(existingMapping.extractedAt).toLocaleDateString()}
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

  if (!preview || !canPopulate) {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
          <p className="text-lg font-medium">Unable to Populate RoI</p>
          <p className="text-sm text-muted-foreground mt-1">
            The SOC2 report does not contain sufficient data for RoI population.
            Ensure the report has been fully parsed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Successfully populated
  if (populateResult?.success) {
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
            {populateResult.vendorCreated && (
              <Card>
                <CardContent className="py-4 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="font-medium">Vendor Created</p>
                  <Button
                    variant="link"
                    className="mt-1"
                    onClick={() => router.push(`/vendors/${populateResult.vendorId}`)}
                  >
                    View Vendor <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
            {(populateResult.serviceIds?.length || 0) > 0 && (
              <Card>
                <CardContent className="py-4 text-center">
                  <Server className="h-8 w-8 mx-auto text-info mb-2" />
                  <p className="font-medium">{populateResult.serviceIds?.length} Services</p>
                  <p className="text-sm text-muted-foreground">Added to RoI</p>
                </CardContent>
              </Card>
            )}
            {(populateResult.subcontractorIds?.length || 0) > 0 && (
              <Card>
                <CardContent className="py-4 text-center">
                  <Network className="h-8 w-8 mx-auto text-warning mb-2" />
                  <p className="font-medium">{populateResult.subcontractorIds?.length} Subcontractors</p>
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

  return (
    <div className="space-y-6">
      {/* Header - Clear Value Proposition */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                One-Click RoI Population
                <Badge variant="secondary" className="text-xs">AI-Powered</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Skip hours of manual data entry. We&apos;ve extracted vendor, service, and subcontractor
                data from this SOC2 report. Review below and click one button to populate your
                DORA Register of Information.
              </p>
              {/* Simple 3-step indicator */}
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-medium">1</div>
                  <span className="text-muted-foreground">Review extracted data</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-medium">2</div>
                  <span className="text-muted-foreground">Select what to include</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-medium">3</div>
                  <span className="text-muted-foreground">Populate RoI</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{preview.overallConfidence}%</div>
              <div className="text-xs text-muted-foreground">AI Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DORA Context Banner */}
      <Card className="bg-info/5 border-info/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-info flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">DORA Article 28 Compliance:</strong> Financial entities must maintain
              a Register of Information (RoI) documenting all ICT third-party providers and their supply chains.
              <strong className="text-info"> First submission deadline: April 30, 2025.</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Templates that will be populated */}
      {preview.templatesSuggested.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5" />
              ESA Templates to Populate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {preview.templatesSuggested.map(template => (
                <div
                  key={template.templateId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{template.templateId}</p>
                    <p className="text-xs text-muted-foreground">{template.templateName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">{template.coverage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {template.fieldsPopulated}/{template.totalFields} fields
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Section */}
      {preview.vendor && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                ICT Service Provider (B_05.01)
              </CardTitle>
              <ConfidenceBadge confidence={preview.vendor.confidence} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{preview.vendor.name}</p>
                  {preview.vendor.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {preview.vendor.description}
                    </p>
                  )}
                  {preview.vendor.auditInfo && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Audit: {preview.vendor.auditInfo}
                    </p>
                  )}
                </div>
                {preview.vendor.existingVendorId && (
                  <Badge variant="outline" className="border-success text-success">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Match Found
                  </Badge>
                )}
              </div>
            </div>

            {/* Vendor options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="create-vendor"
                  checked={!useExistingVendor}
                  onCheckedChange={(checked) => {
                    setUseExistingVendor(!checked);
                    setCreateVendor(!!checked);
                  }}
                />
                <label htmlFor="create-vendor" className="text-sm cursor-pointer">
                  Create new vendor in RoI
                </label>
              </div>

              {existingVendorId && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="use-existing"
                    checked={useExistingVendor}
                    onCheckedChange={(checked) => {
                      setUseExistingVendor(!!checked);
                      setCreateVendor(!checked);
                      if (checked) {
                        setSelectedVendorId(existingVendorId);
                      }
                    }}
                  />
                  <label htmlFor="use-existing" className="text-sm cursor-pointer">
                    Link to existing vendor: <strong>{vendorName}</strong>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Section */}
      {preview.services.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-5 w-5" />
                ICT Services (B_02.02, B_04.01)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="create-services"
                  checked={createServices}
                  onCheckedChange={(checked) => setCreateServices(!!checked)}
                />
                <label htmlFor="create-services" className="text-sm">
                  Include services
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preview.services.map((service, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-4 rounded-lg border',
                    createServices ? 'bg-muted/30' : 'bg-muted/10 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{service.name}</p>
                        <Badge variant="secondary" className="capitalize">
                          {service.type.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <ConfidenceBadge confidence={service.confidence} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subcontractors Section */}
      {preview.subcontractors.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-5 w-5" />
                Fourth-Party Providers (B_05.02)
                <Badge variant="secondary">{selectedSubcontractors.length}/{preview.subcontractors.length}</Badge>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedSubcontractors.length === preview.subcontractors.length) {
                    setSelectedSubcontractors([]);
                  } else {
                    setSelectedSubcontractors(preview.subcontractors.map(s => s.name));
                  }
                }}
              >
                {selectedSubcontractors.length === preview.subcontractors.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <CardDescription>
              DORA Article 28 requires tracking of the entire ICT supply chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {preview.subcontractors.map((sub, idx) => {
                const isSelected = selectedSubcontractors.includes(sub.name);
                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-4 rounded-lg border cursor-pointer transition-colors',
                      isSelected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                    )}
                    onClick={() => toggleSubcontractor(sub.name)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={isSelected} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{sub.name}</p>
                          <ConfidenceBadge confidence={sub.confidence} size="sm" />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge
                            variant={sub.inclusionMethod === 'Carve-out' ? 'outline' : 'secondary'}
                            className={sub.inclusionMethod === 'Carve-out' ? 'border-warning text-warning' : ''}
                          >
                            {sub.inclusionMethod}
                          </Badge>
                          {sub.serviceType && (
                            <Badge variant="secondary" className="capitalize">
                              {sub.serviceType.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {sub.hasOwnSoc2 && (
                            <Badge variant="outline" className="border-success text-success">
                              Has SOC2
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Action Button */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Summary: What Will Be Created
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary Grid */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {createVendor || useExistingVendor ? 1 : 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {useExistingVendor ? 'Vendor Linked' : 'Vendor Created'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {createServices ? preview.services.length : 0}
              </div>
              <div className="text-xs text-muted-foreground">ICT Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {selectedSubcontractors.length}
              </div>
              <div className="text-xs text-muted-foreground">4th Parties</div>
            </div>
          </div>

          <Separator />

          {/* Action Area */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to populate your RoI?</p>
              <p className="text-sm text-muted-foreground">
                One click saves hours of manual data entry
              </p>
            </div>
            <Button
              size="lg"
              onClick={handlePopulate}
              disabled={populating || (!createVendor && !useExistingVendor && !createServices && selectedSubcontractors.length === 0)}
              className="min-w-[200px]"
            >
              {populating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Records...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Populate RoI Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Disabled state explanation */}
          {(!createVendor && !useExistingVendor && !createServices && selectedSubcontractors.length === 0) && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <p className="text-sm">Select at least one item above to enable population</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Confidence Badge Component
function ConfidenceBadge({ confidence, size = 'md' }: { confidence: number; size?: 'sm' | 'md' }) {
  const getColor = () => {
    if (confidence >= 80) return 'text-success border-success/30 bg-success/10';
    if (confidence >= 60) return 'text-warning border-warning/30 bg-warning/10';
    return 'text-muted-foreground border-muted bg-muted/50';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn(getColor(), size === 'sm' ? 'text-xs' : '')}>
          {confidence}%
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>AI extraction confidence score</p>
      </TooltipContent>
    </Tooltip>
  );
}
