'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Building2, ArrowDown, ExternalLink, HelpCircle } from 'lucide-react';
import type { Vendor } from '@/lib/vendors/types';

interface VendorParentHierarchyProps {
  vendor: Vendor;
}

// Country flag emoji from ISO 2-letter code
function getCountryFlag(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface HierarchyNodeProps {
  name?: string | null;
  lei?: string | null;
  country?: string | null;
  isCurrent?: boolean;
  level: 'ultimate' | 'direct' | 'current';
}

function HierarchyNode({ name, lei, country, isCurrent, level }: HierarchyNodeProps) {
  const flag = getCountryFlag(country);
  const levelLabels = {
    ultimate: 'Ultimate Parent',
    direct: 'Direct Parent',
    current: 'Current Entity',
  };

  if (!name && !lei) {
    return null;
  }

  return (
    <div
      className={`relative p-4 rounded-lg border ${
        isCurrent
          ? 'bg-primary/5 border-primary/30'
          : 'bg-muted/30 border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
            <Building2 className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{levelLabels[level]}</p>
            <p className={`font-medium truncate ${isCurrent ? 'text-primary' : ''}`}>
              {name || 'Unknown Entity'}
            </p>
            {lei && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`https://search.gleif.org/#/record/${lei}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground font-mono inline-flex items-center gap-1 mt-1"
                    >
                      {lei.slice(0, 10)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono">{lei}</p>
                    <p className="text-muted-foreground text-xs">Click to view on GLEIF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {country && (
          <Badge variant="outline" className="flex-shrink-0 gap-1">
            <span className="text-base leading-none">{flag}</span>
            <span className="text-xs">{country}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}

export function VendorParentHierarchy({ vendor }: VendorParentHierarchyProps) {
  const hasUltimateParent = vendor.ultimate_parent_lei || vendor.ultimate_parent_name;
  const hasDirectParent = vendor.direct_parent_lei || vendor.direct_parent_name;
  const hasAnyParent = hasUltimateParent || hasDirectParent;

  // Check if ultimate and direct parent are the same
  const sameParent = hasUltimateParent && hasDirectParent &&
    vendor.ultimate_parent_lei === vendor.direct_parent_lei;

  if (!hasAnyParent) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Corporate Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                No parent company information available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This entity may be independently owned or data is not yet enriched
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Corporate Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Ultimate Parent (if different from direct) */}
        {hasUltimateParent && !sameParent && (
          <>
            <HierarchyNode
              name={vendor.ultimate_parent_name}
              lei={vendor.ultimate_parent_lei}
              country={vendor.ultimate_parent_country}
              level="ultimate"
            />
            <div className="flex justify-center py-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </>
        )}

        {/* Direct Parent (or combined if same as ultimate) */}
        {hasDirectParent && (
          <>
            <HierarchyNode
              name={sameParent ? vendor.ultimate_parent_name : vendor.direct_parent_name}
              lei={sameParent ? vendor.ultimate_parent_lei : vendor.direct_parent_lei}
              country={sameParent ? vendor.ultimate_parent_country : vendor.direct_parent_country}
              level={sameParent ? 'ultimate' : 'direct'}
            />
            <div className="flex justify-center py-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </>
        )}

        {/* Only direct parent exists (no ultimate) */}
        {hasDirectParent && !hasUltimateParent && (
          <>
            <HierarchyNode
              name={vendor.direct_parent_name}
              lei={vendor.direct_parent_lei}
              country={vendor.direct_parent_country}
              level="direct"
            />
            <div className="flex justify-center py-1">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </>
        )}

        {/* Current Entity */}
        <HierarchyNode
          name={vendor.name}
          lei={vendor.lei}
          country={vendor.jurisdiction}
          level="current"
          isCurrent
        />
      </CardContent>
    </Card>
  );
}
