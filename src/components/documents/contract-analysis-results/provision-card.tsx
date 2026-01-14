'use client';

import { Badge } from '@/components/ui/badge';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FileText } from 'lucide-react';
import { DORA_PROVISION_LABELS } from '@/lib/contracts/types';
import { STATUS_CONFIG } from './constants';
import type { ExtractedProvision, ProvisionStatus } from './types';

interface ProvisionCardProps {
  provisionKey: string;
  provision: ExtractedProvision;
}

export function ProvisionCard({ provisionKey, provision }: ProvisionCardProps) {
  const config = STATUS_CONFIG[provision.status as ProvisionStatus] || STATUS_CONFIG.not_analyzed;
  const Icon = config.icon;
  const labelInfo = DORA_PROVISION_LABELS[provisionKey];

  return (
    <AccordionItem value={provisionKey} className="border rounded-lg px-4 mb-2">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`rounded-full p-1.5 ${config.bgColor}`}>
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium">{labelInfo?.label || provisionKey}</span>
              <Badge variant="outline" className="text-xs">
                {labelInfo?.article || 'Art. 30'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {labelInfo?.description}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`${config.bgColor} ${config.color} border-0`}>
                  {Math.round(provision.confidence * 100)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>AI confidence: {Math.round(provision.confidence * 100)}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        <div className="space-y-3">
          {provision.location && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span>{provision.location}</span>
            </div>
          )}

          {provision.analysis && (
            <div className="text-sm">
              <p className="font-medium mb-1">Analysis</p>
              <p className="text-muted-foreground">{provision.analysis}</p>
            </div>
          )}

          {provision.excerpts && provision.excerpts.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2">Relevant Excerpts</p>
              <div className="space-y-2">
                {provision.excerpts.map((excerpt, i) => (
                  <blockquote
                    key={i}
                    className="border-l-2 border-primary/50 pl-3 py-1 text-muted-foreground italic text-xs"
                  >
                    &ldquo;{excerpt}&rdquo;
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {provision.gaps && provision.gaps.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2 text-warning">Identified Gaps</p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                {provision.gaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
