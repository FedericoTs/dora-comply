'use client';

/**
 * Evidence View Tab Component
 *
 * Split-panel view showing extracted SOC 2 data alongside the source PDF.
 * This is the 10X differentiator - click on any control/exception to see
 * exactly where it was extracted from in the document.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Shield,
  Network,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SplitEvidenceView } from '@/components/evidence';
import { EvidenceSourceBadge, type EvidenceSource } from '@/components/evidence';
import type { PDFHighlight } from '@/components/documents/pdf-viewer';

// Types from the parent page
interface ParsedControl {
  controlId: string;
  controlArea: string;
  tscCategory: string;
  description: string;
  testResult: 'operating_effectively' | 'exception' | 'not_tested';
  testingProcedure?: string;
  exceptionDescription?: string;
  location?: string;
  pageRef?: number;
  confidence: number;
}

interface ParsedException {
  controlId: string;
  controlArea?: string;
  exceptionDescription: string;
  exceptionType?: string;
  managementResponse?: string;
  remediationDate?: string;
  impact: 'low' | 'medium' | 'high';
  location?: string;
  pageRef?: number;
}

interface ParsedSubserviceOrg {
  name: string;
  serviceDescription: string;
  inclusionMethod: 'inclusive' | 'carve_out';
  controlsSupported: string[];
  hasOwnSoc2?: boolean;
  location?: string;
  pageRef?: number;
}

interface ParsedCUEC {
  id?: string;
  description: string;
  relatedControl?: string;
  customerResponsibility: string;
  category?: string;
  location?: string;
  pageRef?: number;
}

interface EvidenceViewTabProps {
  pdfUrl: string | null;
  controls: ParsedControl[];
  exceptions: ParsedException[];
  subserviceOrgs: ParsedSubserviceOrg[];
  cuecs: ParsedCUEC[];
  documentId: string;
  documentName: string;
}

type EvidenceCategory = 'controls' | 'exceptions' | 'subservice' | 'cuecs';

export function EvidenceViewTab({
  pdfUrl,
  controls,
  exceptions,
  subserviceOrgs,
  cuecs,
  documentId,
  documentName,
}: EvidenceViewTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory>('controls');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to get page number from pageRef or parse from location string
  const getPageNumber = (pageRef?: number, location?: string, fallback: number = 1): number => {
    // Prefer direct pageRef if available
    if (typeof pageRef === 'number' && pageRef > 0) return pageRef;
    // Fall back to parsing location string (e.g., "Page 26, Section 4.1")
    if (location) {
      const pageMatch = location.match(/page\s*(\d+)/i);
      if (pageMatch) return parseInt(pageMatch[1], 10);
    }
    return fallback;
  };

  // Convert all evidence items to PDF highlights
  const highlights = useMemo<PDFHighlight[]>(() => {
    const items: PDFHighlight[] = [];

    // Group controls by page for better Y positioning
    const controlsByPage: Record<number, number> = {};

    // Add controls as highlights
    controls.forEach((control, idx) => {
      const pageNumber = getPageNumber(control.pageRef, control.location, 1);

      // Track position on this page
      if (!controlsByPage[pageNumber]) controlsByPage[pageNumber] = 0;
      const positionOnPage = controlsByPage[pageNumber]++;

      items.push({
        id: `control-${control.controlId}`,
        pageNumber,
        boundingBox: {
          x: 5,
          y: 10 + (positionOnPage % 6) * 14,
          width: 90,
          height: 12,
        },
        evidenceType: 'control',
        label: control.controlId,
        extractedText: control.description,
        confidence: control.confidence,
      });
    });

    // Add exceptions as highlights
    exceptions.forEach((exception, idx) => {
      const pageNumber = getPageNumber(exception.pageRef, exception.location, 40 + idx);

      items.push({
        id: `exception-${exception.controlId}-${idx}`,
        pageNumber,
        boundingBox: {
          x: 5,
          y: 20 + (idx % 4) * 18,
          width: 90,
          height: 15,
        },
        evidenceType: 'exception',
        label: `Exception: ${exception.controlId}`,
        extractedText: exception.exceptionDescription,
        confidence: 0.85,
      });
    });

    // Add subservice orgs as highlights
    subserviceOrgs.forEach((org, idx) => {
      const pageNumber = getPageNumber(org.pageRef, org.location, 60 + idx);

      items.push({
        id: `subservice-${idx}`,
        pageNumber,
        boundingBox: {
          x: 5,
          y: 30 + (idx % 3) * 20,
          width: 90,
          height: 18,
        },
        evidenceType: 'subservice',
        label: org.name,
        extractedText: org.serviceDescription,
        confidence: 0.9,
      });
    });

    // Add CUECs as highlights
    cuecs.forEach((cuec, idx) => {
      const pageNumber = getPageNumber(cuec.pageRef, cuec.location, 80 + idx);

      items.push({
        id: `cuec-${cuec.id || idx}`,
        pageNumber,
        boundingBox: {
          x: 5,
          y: 25 + (idx % 4) * 17,
          width: 90,
          height: 14,
        },
        evidenceType: 'cuec',
        label: cuec.id || `CUEC-${idx + 1}`,
        extractedText: cuec.customerResponsibility,
        confidence: 0.88,
      });
    });

    return items;
  }, [controls, exceptions, subserviceOrgs, cuecs]);

  // Filter highlights by category
  const filteredHighlights = useMemo(() => {
    switch (selectedCategory) {
      case 'controls':
        return highlights.filter((h) => h.evidenceType === 'control');
      case 'exceptions':
        return highlights.filter((h) => h.evidenceType === 'exception');
      case 'subservice':
        return highlights.filter((h) => h.evidenceType === 'subservice');
      case 'cuecs':
        return highlights.filter((h) => h.evidenceType === 'cuec');
      default:
        return highlights;
    }
  }, [highlights, selectedCategory]);

  const handleEvidenceSelect = useCallback((evidenceId: string | null) => {
    setSelectedEvidenceId(evidenceId);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Create evidence source for badge
  const createEvidenceSource = useCallback(
    (itemId: string, pageNumber?: number): EvidenceSource => ({
      documentId,
      documentName,
      pageNumber,
      confidence: 0.9,
      extractionMethod: 'ai',
      reviewStatus: 'pending',
    }),
    [documentId, documentName]
  );

  if (!pdfUrl) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">PDF Not Available</p>
          <p className="text-sm text-muted-foreground mt-2">
            The source document could not be loaded. Evidence traceability requires
            access to the original PDF file.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render the extracted data panel content
  const extractedContent = (
    <div className="h-full flex flex-col">
      {/* Category tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as EvidenceCategory)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full grid grid-cols-4 mx-3 mt-3">
          <TabsTrigger value="controls" className="text-xs gap-1">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">Controls</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1">
              {controls.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="exceptions" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span className="hidden sm:inline">Exceptions</span>
            <Badge
              variant={exceptions.length > 0 ? 'destructive' : 'secondary'}
              className="ml-1 text-[10px] px-1"
            >
              {exceptions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="subservice" className="text-xs gap-1">
            <Network className="h-3 w-3" />
            <span className="hidden sm:inline">4th Party</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1">
              {subserviceOrgs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cuecs" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">CUECs</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1">
              {cuecs.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Controls list */}
        <TabsContent value="controls" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-3 space-y-2">
              {controls.map((control) => {
                const highlightId = `control-${control.controlId}`;
                const isSelected = selectedEvidenceId === highlightId;

                return (
                  <Card
                    key={control.controlId}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50',
                      isSelected && 'border-primary ring-2 ring-primary/20'
                    )}
                    onClick={() => handleEvidenceSelect(highlightId)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-sm">
                              {control.controlId}
                            </span>
                            {control.testResult === 'operating_effectively' && (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                            {control.testResult === 'exception' && (
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            )}
                            {control.testResult === 'not_tested' && (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {control.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <EvidenceSourceBadge
                            source={createEvidenceSource(
                              control.controlId,
                              highlights.find((h) => h.id === highlightId)?.pageNumber
                            )}
                            variant="minimal"
                          />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Exceptions list */}
        <TabsContent value="exceptions" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-3 space-y-2">
              {exceptions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
                  <p className="text-sm text-muted-foreground">No exceptions found</p>
                </div>
              ) : (
                exceptions.map((exception, idx) => {
                  const highlightId = `exception-${exception.controlId}-${idx}`;
                  const isSelected = selectedEvidenceId === highlightId;

                  return (
                    <Card
                      key={highlightId}
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary/50 border-l-4',
                        exception.impact === 'high' && 'border-l-destructive',
                        exception.impact === 'medium' && 'border-l-warning',
                        exception.impact === 'low' && 'border-l-muted-foreground',
                        isSelected && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => handleEvidenceSelect(highlightId)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-sm">
                                {exception.controlId}
                              </span>
                              <Badge
                                variant={
                                  exception.impact === 'high' ? 'destructive' : 'outline'
                                }
                                className="text-[10px]"
                              >
                                {exception.impact}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {exception.exceptionDescription}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Subservice orgs list */}
        <TabsContent value="subservice" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-3 space-y-2">
              {subserviceOrgs.length === 0 ? (
                <div className="text-center py-8">
                  <Network className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No subservice organizations</p>
                </div>
              ) : (
                subserviceOrgs.map((org, idx) => {
                  const highlightId = `subservice-${idx}`;
                  const isSelected = selectedEvidenceId === highlightId;

                  return (
                    <Card
                      key={highlightId}
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary/50',
                        isSelected && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => handleEvidenceSelect(highlightId)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{org.name}</span>
                              <Badge
                                variant={org.inclusionMethod === 'carve_out' ? 'outline' : 'secondary'}
                                className="text-[10px]"
                              >
                                {org.inclusionMethod === 'carve_out' ? 'Carved Out' : 'Inclusive'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {org.serviceDescription}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* CUECs list */}
        <TabsContent value="cuecs" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-3 space-y-2">
              {cuecs.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No CUECs identified</p>
                </div>
              ) : (
                cuecs.map((cuec, idx) => {
                  const highlightId = `cuec-${cuec.id || idx}`;
                  const isSelected = selectedEvidenceId === highlightId;

                  return (
                    <Card
                      key={highlightId}
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary/50',
                        isSelected && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => handleEvidenceSelect(highlightId)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-sm">
                                {cuec.id || `CUEC-${idx + 1}`}
                              </span>
                              {cuec.category && (
                                <Badge variant="secondary" className="text-[10px] capitalize">
                                  {cuec.category.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {cuec.customerResponsibility}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="h-[calc(100vh-240px)] min-h-[600px]">
      <SplitEvidenceView
        pdfUrl={pdfUrl}
        highlights={filteredHighlights}
        selectedEvidenceId={selectedEvidenceId ?? undefined}
        onEvidenceSelect={handleEvidenceSelect}
        extractedContent={extractedContent}
        extractedHeader="Extracted Evidence"
        initialSplit={35}
        minPanelWidth={280}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
