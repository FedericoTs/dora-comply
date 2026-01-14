'use client';

/**
 * Incident Basic Info Tab Component
 *
 * Core incident details: title, type, dates, description.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TabsContent } from '@/components/ui/tabs';
import type { UpdateIncidentInput, IncidentType } from '@/lib/incidents/types';
import { INCIDENT_TYPE_OPTIONS, formatDateTimeLocal } from '@/lib/incidents/form-constants';

interface BasicInfoTabProps {
  formData: Partial<UpdateIncidentInput>;
  onUpdate: (updates: Partial<UpdateIncidentInput>) => void;
}

export function BasicInfoTab({ formData, onUpdate }: BasicInfoTabProps) {
  return (
    <TabsContent value="basic" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core incident details and timing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Incident title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incident_type">Incident Type</Label>
            <Select
              value={formData.incident_type}
              onValueChange={(value) => onUpdate({ incident_type: value as IncidentType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="detection_datetime">Detection Time</Label>
              <Input
                id="detection_datetime"
                type="datetime-local"
                value={formatDateTimeLocal(formData.detection_datetime)}
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdate({
                      detection_datetime: new Date(e.target.value).toISOString(),
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occurrence_datetime">Occurrence Time</Label>
              <Input
                id="occurrence_datetime"
                type="datetime-local"
                value={formatDateTimeLocal(formData.occurrence_datetime)}
                onChange={(e) => {
                  onUpdate({
                    occurrence_datetime: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : undefined,
                  });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value || undefined })}
              placeholder="Describe the incident..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
