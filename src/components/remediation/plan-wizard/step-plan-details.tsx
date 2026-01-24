'use client';

/**
 * Step 1: Plan Details
 *
 * Collects basic plan information: title, description, source, framework.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  SOURCE_TYPE_INFO,
  type SourceType,
  type Framework,
} from '@/lib/remediation/types';
import type { WizardData } from './index';

interface StepPlanDetailsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
  vendors: Array<{ id: string; name: string }>;
  disableSourceType?: boolean;
}

export function StepPlanDetails({
  data,
  updateData,
  errors,
  vendors,
  disableSourceType,
}: StepPlanDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Plan Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Implement Multi-Factor Authentication"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
          className={cn(errors.title && 'border-destructive')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title[0]}</p>
        )}
        <p className="text-sm text-muted-foreground">
          A clear, actionable title describing what needs to be remediated
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the remediation objectives, scope, and any relevant background..."
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Provide context about the gap, its impact, and expected outcomes
        </p>
      </div>

      {/* Source Type and Framework */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Source Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Source <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.source_type}
            onValueChange={(value) => updateData({ source_type: value as SourceType })}
            disabled={disableSourceType}
          >
            <SelectTrigger className={cn(errors.source_type && 'border-destructive')}>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SOURCE_TYPE_INFO) as SourceType[]).map((sourceType) => (
                <SelectItem key={sourceType} value={sourceType}>
                  {SOURCE_TYPE_INFO[sourceType].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.source_type && (
            <p className="text-sm text-destructive">{errors.source_type[0]}</p>
          )}
          <p className="text-sm text-muted-foreground">
            What triggered this remediation need
          </p>
        </div>

        {/* Framework */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Framework</Label>
          <Select
            value={data.framework || 'general'}
            onValueChange={(value) =>
              updateData({ framework: value === 'general' ? undefined : value as Framework })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select framework" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="nis2">NIS2</SelectItem>
              <SelectItem value="dora">DORA</SelectItem>
              <SelectItem value="iso27001">ISO 27001</SelectItem>
              <SelectItem value="soc2">SOC 2</SelectItem>
              <SelectItem value="gdpr">GDPR</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Related compliance framework (optional)
          </p>
        </div>
      </div>

      {/* Vendor (if source is vendor-related) */}
      {(data.source_type === 'vendor_assessment' ||
        data.source_type === 'questionnaire' ||
        vendors.length > 0) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Related Vendor</Label>
          <Select
            value={data.vendor_id || 'none'}
            onValueChange={(value) =>
              updateData({ vendor_id: value === 'none' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vendor (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No vendor</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Link this plan to a specific vendor
          </p>
        </div>
      )}
    </div>
  );
}
