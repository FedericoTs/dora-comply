'use client';

import { Accordion } from '@/components/ui/accordion';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { ProvisionCard } from './provision-card';
import type { ExtractedProvision, ExtractedArticle30_2, ExtractedArticle30_3 } from './types';

interface ProvisionsListProps {
  provisions: ExtractedArticle30_2 | ExtractedArticle30_3;
  article: '30.2' | '30.3';
}

export function ProvisionsList({ provisions }: Omit<ProvisionsListProps, 'article'>) {
  const entries = Object.entries(provisions) as [string, ExtractedProvision][];

  // Count statuses
  const statusCounts = entries.reduce(
    (acc, [, p]) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Summary:</span>
        {statusCounts.present > 0 && (
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-4 w-4" />
            {statusCounts.present} present
          </span>
        )}
        {statusCounts.partial > 0 && (
          <span className="flex items-center gap-1 text-warning">
            <AlertCircle className="h-4 w-4" />
            {statusCounts.partial} partial
          </span>
        )}
        {statusCounts.missing > 0 && (
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-4 w-4" />
            {statusCounts.missing} missing
          </span>
        )}
      </div>

      <Accordion type="multiple" className="space-y-0">
        {entries.map(([key, provision]) => (
          <ProvisionCard key={key} provisionKey={key} provision={provision} />
        ))}
      </Accordion>
    </div>
  );
}
