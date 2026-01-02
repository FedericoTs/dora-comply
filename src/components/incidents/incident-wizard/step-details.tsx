'use client';

import { FileText, Building2, Search, Wrench } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WizardData } from './index';

interface StepDetailsProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
  vendors: Array<{ id: string; name: string }>;
}

export function StepDetails({ data, updateData, errors, vendors }: StepDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-medium">
          Incident Title *
        </Label>
        <Input
          id="title"
          placeholder="Brief, descriptive title of the incident"
          className={cn(errors.title && 'border-destructive')}
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Use a clear, concise title that summarizes the incident
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="description" className="text-base font-medium">
            Description
          </Label>
        </div>
        <Textarea
          id="description"
          placeholder="Detailed description of what happened..."
          rows={4}
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value || undefined })}
        />
        <p className="text-xs text-muted-foreground">
          Provide context and details about the incident circumstances
        </p>
      </div>

      {/* Linked Vendor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="vendor" className="text-base font-medium">
            Related Vendor
          </Label>
        </div>
        <Select
          value={data.vendor_id || 'none'}
          onValueChange={(value) =>
            updateData({ vendor_id: value === 'none' ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a vendor (if applicable)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No vendor involved</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Link this incident to a third-party vendor if applicable
        </p>
      </div>

      {/* Root Cause */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="root_cause" className="text-base font-medium">
            Initial Root Cause Assessment
          </Label>
        </div>
        <Textarea
          id="root_cause"
          placeholder="What do you believe caused this incident? (preliminary assessment)"
          rows={3}
          value={data.root_cause || ''}
          onChange={(e) => updateData({ root_cause: e.target.value || undefined })}
        />
        <p className="text-xs text-muted-foreground">
          This can be updated as more information becomes available
        </p>
      </div>

      {/* Remediation Actions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="remediation_actions" className="text-base font-medium">
            Remediation Actions
          </Label>
        </div>
        <Textarea
          id="remediation_actions"
          placeholder="What actions are being taken to address this incident?"
          rows={3}
          value={data.remediation_actions || ''}
          onChange={(e) => updateData({ remediation_actions: e.target.value || undefined })}
        />
        <p className="text-xs text-muted-foreground">
          Document immediate response and planned corrective actions
        </p>
      </div>

      {/* Tips */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="font-medium text-sm mb-2">Documentation Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Be specific about what systems, services, and data were affected</li>
          <li>• Record timestamps for key events in the incident timeline</li>
          <li>• Document any communications with vendors or authorities</li>
          <li>• Keep track of team members involved in the response</li>
        </ul>
      </div>
    </div>
  );
}
