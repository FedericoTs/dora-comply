'use client';

/**
 * Document Population Card
 *
 * Displays a parsed SOC2 document that can auto-populate RoI fields
 */

import { useState } from 'react';
import Link from 'next/link';
import { FileText, ChevronDown, ChevronUp, Sparkles, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { PopulatableDocument } from '@/lib/roi/types';

interface DocumentPopulationCardProps {
  document: PopulatableDocument;
  onPopulate?: (documentId: string) => void;
}

export function DocumentPopulationCard({ document, onPopulate }: DocumentPopulationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  const handlePopulate = async () => {
    if (!onPopulate) return;
    setIsPopulating(true);
    try {
      await onPopulate(document.documentId);
    } finally {
      setIsPopulating(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Card className={cn(
      'transition-all',
      document.isPopulated && 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">
                {document.fileName}
              </h4>
              {document.isPopulated && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  Populated
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {document.vendorName} &bull; Parsed {formatDate(document.parsedAt)}
            </p>

            <p className="text-sm mt-2">
              <span className="font-medium text-primary">{document.fieldsAvailable}</span>
              <span className="text-muted-foreground"> fields can be auto-populated across </span>
              <span className="font-medium">{document.templateBreakdown.length}</span>
              <span className="text-muted-foreground"> templates</span>
            </p>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs mt-2">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      View breakdown
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2">
                <div className="space-y-2 text-xs">
                  {document.templateBreakdown.map(template => (
                    <div
                      key={template.templateId}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                    >
                      <div>
                        <Badge variant="outline" className="text-xs mr-2">
                          {template.templateId}
                        </Badge>
                        <span className="text-muted-foreground">
                          {template.fieldCount} fields
                        </span>
                      </div>
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {template.fieldNames.slice(0, 2).join(', ')}
                        {template.fieldNames.length > 2 && '...'}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center gap-2 mt-3">
              {document.isPopulated ? (
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link href={`/documents/${document.documentId}/soc2-analysis`}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Analysis
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link href={`/documents/${document.documentId}/soc2-analysis`}>
                      Preview
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handlePopulate}
                    disabled={isPopulating || !document.vendorId}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {isPopulating ? 'Populating...' : 'Auto-Populate'}
                  </Button>
                </>
              )}
            </div>

            {!document.vendorId && !document.isPopulated && (
              <p className="text-xs text-amber-600 mt-2">
                Link this document to a vendor first to enable auto-population
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
