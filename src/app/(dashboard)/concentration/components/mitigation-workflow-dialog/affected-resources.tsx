'use client';

import { Users, Layers, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { ConcentrationAlert } from '@/lib/concentration/types';

interface AffectedVendorsSectionProps {
  vendors: string[];
  onNavigate: (link: string) => void;
}

export function AffectedVendorsSection({ vendors, onNavigate }: AffectedVendorsSectionProps) {
  if (vendors.length === 0) return null;

  return (
    <AccordionItem value="vendors">
      <AccordionTrigger className="text-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Affected Vendors ({vendors.length})
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1 pt-2">
          {vendors.slice(0, 5).map((vendorId) => (
            <Button
              key={vendorId}
              variant="ghost"
              size="sm"
              className="w-full justify-between h-8 text-xs"
              onClick={() => onNavigate(`/vendors/${vendorId}`)}
            >
              <span className="truncate">{vendorId}</span>
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          ))}
          {vendors.length > 5 && (
            <p className="text-xs text-muted-foreground pl-2 pt-1">
              +{vendors.length - 5} more vendors
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface AffectedFunctionsSectionProps {
  functions: string[] | undefined;
}

export function AffectedFunctionsSection({ functions }: AffectedFunctionsSectionProps) {
  if (!functions || functions.length === 0) return null;

  return (
    <AccordionItem value="functions">
      <AccordionTrigger className="text-sm">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Affected Functions ({functions.length})
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-wrap gap-2 pt-2">
          {functions.map((func) => (
            <Badge key={func} variant="outline">
              {func}
            </Badge>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
