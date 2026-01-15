'use client';

import { useState, useMemo, useEffect } from 'react';
import { Globe, Users, DollarSign, Database, Shield, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { WizardData } from './index';
import type { ImpactLevel, IncidentClassification } from '@/lib/incidents/types';
import { calculateClassification, CLASSIFICATION_THRESHOLDS } from '@/lib/incidents/validation';
import { ClassificationBadge } from '../threshold-indicator';

interface StepImpactClassificationProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  errors: Record<string, string[]>;
  services: Array<{ id: string; name: string }>;
  criticalFunctions: Array<{ id: string; name: string }>;
}

const GEOGRAPHIC_REGIONS = [
  'EU - Western Europe',
  'EU - Eastern Europe',
  'EU - Northern Europe',
  'EU - Southern Europe',
  'Non-EU Europe',
  'North America',
  'Asia Pacific',
  'Global',
];

const IMPACT_LEVELS: Array<{ value: ImpactLevel; label: string; description: string }> = [
  { value: 'low', label: 'Low', description: 'Minimal reputational damage' },
  { value: 'medium', label: 'Medium', description: 'Moderate public attention' },
  { value: 'high', label: 'High', description: 'Significant media coverage' },
];

export function StepImpactClassification({
  data,
  updateData,
  errors,
  services,
  criticalFunctions,
}: StepImpactClassificationProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate classification in real-time
  const classificationResult = useMemo(() => {
    return calculateClassification({
      clients_affected_percentage: data.clients_affected_percentage,
      transactions_value_affected: data.transactions_value_affected,
      critical_functions_affected: data.critical_functions_affected,
      data_breach: data.data_breach,
      data_records_affected: data.data_records_affected,
    }, data.detection_datetime);
  }, [
    data.clients_affected_percentage,
    data.transactions_value_affected,
    data.critical_functions_affected,
    data.data_breach,
    data.data_records_affected,
    data.detection_datetime,
  ]);

  // Auto-set classification when not overriding
  const isOverride = data.classification_override ?? false;

  useEffect(() => {
    if (!isOverride) {
      updateData({
        classification: classificationResult.calculated,
        classification_calculated: classificationResult.calculated,
      });
    }
  }, [isOverride, classificationResult.calculated, updateData]);

  const toggleCriticalFunction = (functionId: string) => {
    const current = data.critical_functions_affected;
    const updated = current.includes(functionId)
      ? current.filter((id) => id !== functionId)
      : [...current, functionId];
    updateData({ critical_functions_affected: updated });
  };

  const toggleRegion = (region: string) => {
    const current = data.geographic_spread;
    const updated = current.includes(region)
      ? current.filter((r) => r !== region)
      : [...current, region];
    updateData({ geographic_spread: updated });
  };

  const handleOverrideChange = (override: boolean) => {
    if (!override) {
      updateData({
        classification_override: false,
        classification: classificationResult.calculated,
        classification_override_justification: undefined,
      });
    } else {
      updateData({
        classification_override: true,
        classification_calculated: classificationResult.calculated,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Classification Banner */}
      <Card className={cn(
        'border-2 transition-colors',
        classificationResult.calculated === 'major' && 'border-destructive/50 bg-destructive/5',
        classificationResult.calculated === 'significant' && 'border-warning/50 bg-warning/5',
        classificationResult.calculated === 'minor' && 'border-muted'
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={cn(
                'h-5 w-5',
                classificationResult.calculated === 'major' && 'text-destructive',
                classificationResult.calculated === 'significant' && 'text-warning',
                classificationResult.calculated === 'minor' && 'text-muted-foreground'
              )} />
              <div>
                <p className="text-sm font-medium">DORA Classification</p>
                <p className="text-xs text-muted-foreground">
                  Auto-calculated from impact data
                </p>
              </div>
            </div>
            <ClassificationBadge classification={classificationResult.calculated} size="md" />
          </div>
          {classificationResult.triggeredThresholds.length > 0 && (
            <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
              {classificationResult.triggeredThresholds.map((t) => (
                <Badge
                  key={t.key}
                  variant={t.classification === 'major' ? 'destructive' : 'secondary'}
                  className="gap-1 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {t.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Functions */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <Label className="text-base font-medium">Critical Functions Affected</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select any critical/important functions impacted
            </p>
          </div>
          {data.critical_functions_affected.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Triggers Major
            </Badge>
          )}
        </div>

        {criticalFunctions.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {criticalFunctions.map((fn) => (
              <Label
                key={fn.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50"
              >
                <Checkbox
                  checked={data.critical_functions_affected.includes(fn.id)}
                  onCheckedChange={() => toggleCriticalFunction(fn.id)}
                />
                <span className="text-sm">{fn.name}</span>
              </Label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg">
            No critical functions defined in your organization.
          </p>
        )}
      </div>

      {/* Client & Transaction Impact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="clients_percentage" className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Clients Affected (%)
            </Label>
            {(data.clients_affected_percentage ?? 0) >= CLASSIFICATION_THRESHOLDS.major.clients_affected_percentage && (
              <Badge variant="destructive" className="text-xs">Major</Badge>
            )}
          </div>
          <Input
            id="clients_percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="Percentage of client base"
            value={data.clients_affected_percentage ?? ''}
            onChange={(e) =>
              updateData({
                clients_affected_percentage: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Major: {'>'}={CLASSIFICATION_THRESHOLDS.major.clients_affected_percentage}%
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="transactions_value" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Transaction Value (EUR)
            </Label>
            {(data.transactions_value_affected ?? 0) >= CLASSIFICATION_THRESHOLDS.major.transactions_value_affected && (
              <Badge variant="destructive" className="text-xs">Major</Badge>
            )}
          </div>
          <Input
            id="transactions_value"
            type="number"
            min="0"
            placeholder="Total value affected"
            value={data.transactions_value_affected ?? ''}
            onChange={(e) =>
              updateData({
                transactions_value_affected: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Major: {'>'}=EUR 1M
          </p>
        </div>
      </div>

      {/* Data Breach */}
      <div className={cn(
        'space-y-3 p-4 rounded-lg border',
        data.data_breach ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/30'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className={cn(
              'h-4 w-4',
              data.data_breach ? 'text-destructive' : 'text-muted-foreground'
            )} />
            <div>
              <Label className="text-base font-medium">Data Breach</Label>
              <p className="text-sm text-muted-foreground">
                Was personal or sensitive data compromised?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data.data_breach && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Triggers Major
              </Badge>
            )}
            <Switch
              checked={data.data_breach}
              onCheckedChange={(checked) => updateData({ data_breach: checked })}
            />
          </div>
        </div>

        {data.data_breach && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="data_records">Records Affected</Label>
            <Input
              id="data_records"
              type="number"
              min="0"
              placeholder="Number of data records"
              value={data.data_records_affected ?? ''}
              onChange={(e) =>
                updateData({
                  data_records_affected: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
        )}
      </div>

      {/* Advanced Section (Collapsible) */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between">
            <span>Additional Impact Details</span>
            <Badge variant="outline">{showAdvanced ? 'Hide' : 'Show'}</Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-4">
          {/* Services Affected */}
          {services.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Services Affected</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map((service) => (
                  <Label
                    key={service.id}
                    className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={data.services_affected.includes(service.id)}
                      onCheckedChange={() => {
                        const updated = data.services_affected.includes(service.id)
                          ? data.services_affected.filter((id) => id !== service.id)
                          : [...data.services_affected, service.id];
                        updateData({ services_affected: updated });
                      }}
                    />
                    <span className="text-sm">{service.name}</span>
                  </Label>
                ))}
              </div>
            </div>
          )}

          {/* Geographic Spread */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Geographic Spread</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {GEOGRAPHIC_REGIONS.map((region) => (
                <Badge
                  key={region}
                  variant={data.geographic_spread.includes(region) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleRegion(region)}
                >
                  {region}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reputational Impact */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Reputational Impact</Label>
            <Select
              value={data.reputational_impact || 'none'}
              onValueChange={(value) =>
                updateData({ reputational_impact: value === 'none' ? undefined : value as ImpactLevel })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select impact level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not applicable</SelectItem>
                {IMPACT_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Economic Impact */}
          <div className="space-y-2">
            <Label htmlFor="economic_impact">Estimated Economic Impact (EUR)</Label>
            <Input
              id="economic_impact"
              type="number"
              min="0"
              placeholder="Total financial impact"
              value={data.economic_impact ?? ''}
              onChange={(e) =>
                updateData({
                  economic_impact: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Classification Override */}
      <Card className="border-dashed">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Override Classification</CardTitle>
            </div>
            <Switch
              checked={isOverride}
              onCheckedChange={handleOverrideChange}
            />
          </div>
        </CardHeader>
        {isOverride && (
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Select a different classification and provide justification.
            </p>
            <Select
              value={data.classification}
              onValueChange={(value) => updateData({ classification: value as IncidentClassification })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="significant">Significant</SelectItem>
                <SelectItem value="major">Major</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Provide detailed justification for overriding the calculated classification (min 50 characters)..."
              rows={3}
              value={data.classification_override_justification || ''}
              className={cn(errors.classification_override_justification && 'border-destructive')}
              onChange={(e) => updateData({ classification_override_justification: e.target.value || undefined })}
            />
            {errors.classification_override_justification && (
              <p className="text-sm text-destructive">{errors.classification_override_justification[0]}</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
