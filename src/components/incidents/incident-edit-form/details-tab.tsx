'use client';

/**
 * Incident Details Tab Component
 *
 * Context, root cause, remediation, and vendor association.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import type { UpdateIncidentInput } from '@/lib/incidents/types';

interface DetailsTabProps {
  formData: Partial<UpdateIncidentInput>;
  vendors: Array<{ id: string; name: string }>;
  onUpdate: (updates: Partial<UpdateIncidentInput>) => void;
}

export function DetailsTab({ formData, vendors, onUpdate }: DetailsTabProps) {
  return (
    <TabsContent value="details" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Context, root cause, and remediation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_id">Related Vendor</Label>
            <Select
              value={formData.vendor_id || '_none'}
              onValueChange={(value) =>
                onUpdate({
                  vendor_id: value === '_none' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="root_cause">Root Cause Analysis</Label>
            <Textarea
              id="root_cause"
              value={formData.root_cause || ''}
              onChange={(e) => onUpdate({ root_cause: e.target.value || undefined })}
              placeholder="Describe the root cause of this incident..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remediation_actions">Remediation Actions</Label>
            <Textarea
              id="remediation_actions"
              value={formData.remediation_actions || ''}
              onChange={(e) => onUpdate({ remediation_actions: e.target.value || undefined })}
              placeholder="Describe actions taken to resolve and prevent recurrence..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
