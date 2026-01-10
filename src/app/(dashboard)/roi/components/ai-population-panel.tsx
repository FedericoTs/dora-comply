'use client';

/**
 * AI Population Panel
 *
 * Prominent panel showing AI auto-population opportunities from SOC2 reports
 */

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronDown, ChevronUp, Upload, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DocumentPopulationCard } from './document-population-card';
import type { PopulatableDocument } from '@/lib/roi/types';

interface AiPopulationPanelProps {
  documents: PopulatableDocument[];
  onPopulateDocument?: (documentId: string) => Promise<void>;
  highlightDocumentId?: string;
}

export function AiPopulationPanel({ documents, onPopulateDocument, highlightDocumentId }: AiPopulationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const unpopulatedDocs = documents.filter(d => !d.isPopulated);
  const populatedDocs = documents.filter(d => d.isPopulated);
  const totalFieldsAvailable = unpopulatedDocs.reduce((sum, d) => sum + d.fieldsAvailable, 0);

  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">AI Auto-Population</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Upload SOC2 reports to automatically extract vendor information, subcontractors,
              and service details into your Register of Information.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/documents?upload=true">
                <Upload className="h-4 w-4 mr-2" />
                Upload SOC2 Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} data-ai-population-panel>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-lg p-1.5 bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              AI Auto-Population
              {unpopulatedDocs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {totalFieldsAvailable} fields available
                </span>
              )}
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          {!isExpanded && unpopulatedDocs.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unpopulatedDocs.length} document{unpopulatedDocs.length > 1 ? 's' : ''} ready for auto-population
            </p>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-2 space-y-3">
            {unpopulatedDocs.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  We found data in your uploaded documents that can populate the RoI:
                </p>
                {unpopulatedDocs.map(doc => (
                  <DocumentPopulationCard
                    key={doc.documentId}
                    document={doc}
                    onPopulate={onPopulateDocument}
                    isHighlighted={doc.documentId === highlightDocumentId}
                  />
                ))}
              </div>
            )}

            {populatedDocs.length > 0 && unpopulatedDocs.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Previously Populated
                </h4>
                {populatedDocs.slice(0, 2).map(doc => (
                  <DocumentPopulationCard
                    key={doc.documentId}
                    document={doc}
                    onPopulate={onPopulateDocument}
                  />
                ))}
              </div>
            )}

            {unpopulatedDocs.length === 0 && populatedDocs.length > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  All documents have been processed. Upload more SOC2 reports to continue.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/documents?upload=true">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload More
                  </Link>
                </Button>
              </div>
            )}

            <div className="border-t pt-3 mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>
                  Tip: Upload more SOC2 reports to auto-populate vendor data
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
