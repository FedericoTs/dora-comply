'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Shield,
  FileText,
  Activity,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { updateIncidentAction } from '@/lib/incidents/actions';
import { calculateClassification } from '@/lib/incidents/validation';
import { ClassificationCalculator } from './classification-calculator';
import { ClassificationBadge } from './threshold-indicator';
import type { Incident, UpdateIncidentInput, IncidentClassification, IncidentType, ImpactLevel } from '@/lib/incidents/types';
import { getIncidentTypeLabel, getStatusLabel } from '@/lib/incidents/types';
import { toast } from 'sonner';

const INCIDENT_TYPES: Array<{ value: IncidentType; label: string }> = [
  { value: 'cyber_attack', label: 'Cyber Attack' },
  { value: 'system_failure', label: 'System Failure' },
  { value: 'human_error', label: 'Human Error' },
  { value: 'third_party_failure', label: 'Third-Party Failure' },
  { value: 'natural_disaster', label: 'Natural Disaster' },
  { value: 'other', label: 'Other' },
];

const IMPACT_LEVELS: Array<{ value: ImpactLevel; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface IncidentEditFormProps {
  incident: Incident;
  vendors: Array<{ id: string; name: string }>;
}

export function IncidentEditForm({ incident, vendors }: IncidentEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // Form state - convert null values to undefined for type compatibility
  const [formData, setFormData] = useState<Partial<UpdateIncidentInput>>({
    title: incident.title,
    description: incident.description ?? undefined,
    incident_type: incident.incident_type,
    detection_datetime: incident.detection_datetime,
    occurrence_datetime: incident.occurrence_datetime ?? undefined,
    services_affected: incident.services_affected || [],
    critical_functions_affected: incident.critical_functions_affected || [],
    clients_affected_count: incident.clients_affected_count ?? undefined,
    clients_affected_percentage: incident.clients_affected_percentage ?? undefined,
    transactions_affected_count: incident.transactions_affected_count ?? undefined,
    transactions_value_affected: incident.transactions_value_affected ?? undefined,
    data_breach: incident.data_breach || false,
    data_records_affected: incident.data_records_affected ?? undefined,
    geographic_spread: incident.geographic_spread || [],
    economic_impact: incident.economic_impact ?? undefined,
    reputational_impact: incident.reputational_impact ?? undefined,
    classification: incident.classification,
    classification_override: incident.classification_override || false,
    classification_override_justification: incident.classification_override_justification ?? undefined,
    vendor_id: incident.vendor_id ?? undefined,
    root_cause: incident.root_cause ?? undefined,
    remediation_actions: incident.remediation_actions ?? undefined,
    status: incident.status,
  });

  // Calculate classification based on current impact data
  const impactData = useMemo(() => ({
    clients_affected_percentage: formData.clients_affected_percentage,
    transactions_value_affected: formData.transactions_value_affected,
    critical_functions_affected: formData.critical_functions_affected,
    data_breach: formData.data_breach,
    data_records_affected: formData.data_records_affected,
  }), [
    formData.clients_affected_percentage,
    formData.transactions_value_affected,
    formData.critical_functions_affected,
    formData.data_breach,
    formData.data_records_affected,
  ]);

  const classificationResult = useMemo(
    () => calculateClassification(impactData, formData.detection_datetime),
    [impactData, formData.detection_datetime]
  );

  // Update form data
  const updateFormData = useCallback((updates: Partial<UpdateIncidentInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Handle classification change
  const handleClassificationChange = useCallback((classification: IncidentClassification) => {
    updateFormData({ classification });
  }, [updateFormData]);

  // Handle override change
  const handleOverrideChange = useCallback((isOverride: boolean) => {
    if (!isOverride) {
      updateFormData({
        classification_override: false,
        classification: classificationResult.calculated,
        classification_override_justification: undefined,
      });
    } else {
      updateFormData({
        classification_override: true,
      });
    }
  }, [updateFormData, classificationResult.calculated]);

  // Handle justification change
  const handleJustificationChange = useCallback((justification: string) => {
    updateFormData({
      classification_override_justification: justification || undefined,
    });
  }, [updateFormData]);

  // Format datetime for input
  const formatDateTimeLocal = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    } catch {
      return isoString.slice(0, 16);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare data for update
      const updateData: UpdateIncidentInput = {
        ...formData,
        // If not overriding, use calculated classification
        classification: formData.classification_override
          ? formData.classification
          : classificationResult.calculated,
        classification_calculated: classificationResult.calculated,
      };

      const result = await updateIncidentAction(incident.id, updateData);

      if (result.success) {
        toast.success('Incident updated successfully');
        setHasChanges(false);
        router.push(`/incidents/${incident.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update incident');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Classification Preview Banner */}
      <Card className={cn(
        'border-2',
        classificationResult.calculated === 'major' && 'border-destructive/50 bg-destructive/5',
        classificationResult.calculated === 'significant' && 'border-warning/50 bg-warning/5',
        classificationResult.calculated === 'minor' && 'border-border'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClassificationBadge classification={classificationResult.calculated} size="md" />
              <div>
                <p className="text-sm font-medium">
                  {formData.classification_override
                    ? `Override: ${formData.classification?.charAt(0).toUpperCase()}${formData.classification?.slice(1)}`
                    : 'Auto-calculated Classification'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {classificationResult.triggeredThresholds.length > 0
                    ? `${classificationResult.triggeredThresholds.length} DORA threshold(s) triggered`
                    : 'No thresholds triggered'}
                </p>
              </div>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="border-warning text-warning">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full h-auto p-1">
          <TabsTrigger value="basic" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex-1 gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Impact</span>
          </TabsTrigger>
          <TabsTrigger value="classification" className="flex-1 gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Classification</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex-1 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Status</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
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
                  onChange={(e) => updateFormData({ title: e.target.value })}
                  placeholder="Incident title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="incident_type">Incident Type</Label>
                <Select
                  value={formData.incident_type}
                  onValueChange={(value) => updateFormData({ incident_type: value as IncidentType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((type) => (
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
                        updateFormData({
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
                      updateFormData({
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
                  onChange={(e) => updateFormData({ description: e.target.value || undefined })}
                  placeholder="Describe the incident..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impact Assessment</CardTitle>
              <CardDescription>
                Business impact metrics that determine DORA classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Impact */}
              <div className="space-y-4">
                <h4 className="font-medium">Client Impact</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clients_affected_percentage">
                      Clients Affected (%)
                      {(formData.clients_affected_percentage ?? 0) >= 10 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Triggers Major
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="clients_affected_percentage"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={formData.clients_affected_percentage ?? ''}
                      onChange={(e) => updateFormData({
                        clients_affected_percentage: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })}
                      placeholder="e.g., 5.5"
                    />
                    <p className="text-xs text-muted-foreground">
                      DORA threshold: 10% for Major
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clients_affected_count">Clients Affected (Count)</Label>
                    <Input
                      id="clients_affected_count"
                      type="number"
                      min={0}
                      value={formData.clients_affected_count ?? ''}
                      onChange={(e) => updateFormData({
                        clients_affected_count: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })}
                      placeholder="Number of clients"
                    />
                  </div>
                </div>
              </div>

              {/* Transaction Impact */}
              <div className="space-y-4">
                <h4 className="font-medium">Transaction Impact</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="transactions_value_affected">
                      Transaction Value Affected
                      {(formData.transactions_value_affected ?? 0) >= 1000000 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Triggers Major
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="transactions_value_affected"
                      type="number"
                      min={0}
                      value={formData.transactions_value_affected ?? ''}
                      onChange={(e) => updateFormData({
                        transactions_value_affected: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })}
                      placeholder="Value in EUR"
                    />
                    <p className="text-xs text-muted-foreground">
                      DORA threshold: 1,000,000 for Major
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transactions_affected_count">Transactions Count</Label>
                    <Input
                      id="transactions_affected_count"
                      type="number"
                      min={0}
                      value={formData.transactions_affected_count ?? ''}
                      onChange={(e) => updateFormData({
                        transactions_affected_count: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })}
                      placeholder="Number of transactions"
                    />
                  </div>
                </div>
              </div>

              {/* Data Breach */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Breach</h4>
                    <p className="text-sm text-muted-foreground">
                      Was there unauthorized access to data?
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.data_breach && (
                      <Badge variant="destructive" className="text-xs">
                        Triggers Major
                      </Badge>
                    )}
                    <Switch
                      checked={formData.data_breach ?? false}
                      onCheckedChange={(checked) => updateFormData({
                        data_breach: checked,
                        data_records_affected: checked ? formData.data_records_affected : undefined,
                      })}
                    />
                  </div>
                </div>
                {formData.data_breach && (
                  <div className="space-y-2 pl-4 border-l-2 border-destructive/30">
                    <Label htmlFor="data_records_affected">Records Affected</Label>
                    <Input
                      id="data_records_affected"
                      type="number"
                      min={0}
                      value={formData.data_records_affected ?? ''}
                      onChange={(e) => updateFormData({
                        data_records_affected: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })}
                      placeholder="Number of records"
                    />
                  </div>
                )}
              </div>

              {/* Economic Impact */}
              <div className="space-y-2">
                <Label htmlFor="economic_impact">Economic Impact (EUR)</Label>
                <Input
                  id="economic_impact"
                  type="number"
                  min={0}
                  value={formData.economic_impact ?? ''}
                  onChange={(e) => updateFormData({
                    economic_impact: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })}
                  placeholder="Total estimated cost"
                />
              </div>

              {/* Reputational Impact */}
              <div className="space-y-2">
                <Label htmlFor="reputational_impact">Reputational Impact</Label>
                <Select
                  value={formData.reputational_impact || ''}
                  onValueChange={(value) => updateFormData({
                    reputational_impact: value as ImpactLevel || undefined,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {IMPACT_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classification Tab */}
        <TabsContent value="classification" className="space-y-4">
          <ClassificationCalculator
            impactData={impactData}
            detectionDateTime={formData.detection_datetime}
            selectedClassification={formData.classification || classificationResult.calculated}
            isOverride={formData.classification_override || false}
            overrideJustification={formData.classification_override_justification || ''}
            onClassificationChange={handleClassificationChange}
            onOverrideChange={handleOverrideChange}
            onJustificationChange={handleJustificationChange}
          />
        </TabsContent>

        {/* Details Tab */}
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
                  value={formData.vendor_id || ''}
                  onValueChange={(value) => updateFormData({
                    vendor_id: value || undefined,
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
                  onChange={(e) => updateFormData({ root_cause: e.target.value || undefined })}
                  placeholder="Describe the root cause of this incident..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remediation_actions">Remediation Actions</Label>
                <Textarea
                  id="remediation_actions"
                  value={formData.remediation_actions || ''}
                  onChange={(e) => updateFormData({ remediation_actions: e.target.value || undefined })}
                  placeholder="Describe actions taken to resolve and prevent recurrence..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Status</CardTitle>
              <CardDescription>Current status and lifecycle management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Status</Label>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-base py-1 px-3">
                    {getStatusLabel(incident.status)}
                  </Badge>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Status Changes</AlertTitle>
                <AlertDescription>
                  Status changes should be made through the incident timeline to maintain
                  proper audit trail. Use the incident detail page to change status.
                </AlertDescription>
              </Alert>

              {/* Show current dates */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(incident.created_at).toLocaleString('en-GB')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(incident.updated_at).toLocaleString('en-GB')}</span>
                </div>
                {incident.recovery_datetime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recovered</span>
                    <span>{new Date(incident.recovery_datetime).toLocaleString('en-GB')}</span>
                  </div>
                )}
                {incident.resolution_datetime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resolved</span>
                    <span>{new Date(incident.resolution_datetime).toLocaleString('en-GB')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => router.push(`/incidents/${incident.id}`)}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !hasChanges}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
