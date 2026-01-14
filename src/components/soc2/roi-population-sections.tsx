'use client';

/**
 * RoI Population Section Components
 *
 * Templates, Vendor, Services, and Subcontractors sections.
 */

import { useRouter } from 'next/navigation';
import {
  Database,
  Building2,
  Server,
  Network,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  RoiTemplatePreview,
  RoiServicePreview,
  RoiSubcontractorPreview,
} from '@/lib/roi/roi-population-types';

// Confidence Badge Component
interface ConfidenceBadgeProps {
  confidence: number;
  size?: 'sm' | 'md';
}

export function ConfidenceBadge({ confidence, size = 'md' }: ConfidenceBadgeProps) {
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

// Templates Section
interface RoiTemplatesSectionProps {
  templates: RoiTemplatePreview[];
}

export function RoiTemplatesSection({ templates }: RoiTemplatesSectionProps) {
  if (templates.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-5 w-5" />
          ESA Templates to Populate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((template) => (
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
  );
}

// Vendor Section
interface RoiVendorSectionProps {
  vendor: {
    id: string;
    name: string;
    willUpdate: boolean;
    auditInfo?: string;
  };
}

export function RoiVendorSection({ vendor }: RoiVendorSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            ICT Service Provider (B_05.01)
          </CardTitle>
          <Badge variant="outline" className="border-success text-success">
            <LinkIcon className="h-3 w-3 mr-1" />
            Linked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{vendor.name}</p>
                <Badge variant="secondary" className="text-xs">
                  Will Update
                </Badge>
              </div>
              {vendor.auditInfo && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">SOC2 audit info to add:</span>{' '}
                  {vendor.auditInfo}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/vendors/${vendor.id}`)}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          The vendor&apos;s SOC2 audit metadata will be updated with information extracted from this
          report.
        </p>
      </CardContent>
    </Card>
  );
}

// Services Section
interface RoiServicesSectionProps {
  services: RoiServicePreview[];
  createServices: boolean;
  onCreateServicesChange: (checked: boolean) => void;
}

export function RoiServicesSection({
  services,
  createServices,
  onCreateServicesChange,
}: RoiServicesSectionProps) {
  if (services.length === 0) return null;

  return (
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
              onCheckedChange={(checked) => onCreateServicesChange(!!checked)}
            />
            <label htmlFor="create-services" className="text-sm">
              Include services
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service, idx) => (
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
  );
}

// Subcontractors Section
interface RoiSubcontractorsSectionProps {
  subcontractors: RoiSubcontractorPreview[];
  selectedSubcontractors: string[];
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function RoiSubcontractorsSection({
  subcontractors,
  selectedSubcontractors,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: RoiSubcontractorsSectionProps) {
  if (subcontractors.length === 0) return null;

  const allSelected = selectedSubcontractors.length === subcontractors.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-5 w-5" />
            Fourth-Party Providers (B_05.02)
            <Badge variant="secondary">
              {selectedSubcontractors.length}/{subcontractors.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={allSelected ? onDeselectAll : onSelectAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        <CardDescription>
          DORA Article 28 requires tracking of the entire ICT supply chain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {subcontractors.map((sub, idx) => {
            const isSelected = selectedSubcontractors.includes(sub.name);
            return (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-lg border cursor-pointer transition-colors',
                  isSelected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                )}
                onClick={() => onToggle(sub.name)}
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
                        className={
                          sub.inclusionMethod === 'Carve-out' ? 'border-warning text-warning' : ''
                        }
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
  );
}
