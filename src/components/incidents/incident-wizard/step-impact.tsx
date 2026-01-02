'use client';

import { useState } from 'react';
import { Plus, X, Globe, Users, DollarSign, Database, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WizardData } from './index';
import type { ImpactLevel } from '@/lib/incidents/types';

interface StepImpactProps {
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
  'South America',
  'Asia Pacific',
  'Middle East',
  'Africa',
  'Global',
];

const IMPACT_LEVELS: Array<{ value: ImpactLevel; label: string; description: string }> = [
  { value: 'low', label: 'Low', description: 'Minimal reputational damage' },
  { value: 'medium', label: 'Medium', description: 'Moderate public attention' },
  { value: 'high', label: 'High', description: 'Significant media coverage' },
];

export function StepImpact({
  data,
  updateData,
  errors,
  services,
  criticalFunctions,
}: StepImpactProps) {
  const [customRegion, setCustomRegion] = useState('');

  const toggleService = (serviceId: string) => {
    const current = data.services_affected;
    const updated = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    updateData({ services_affected: updated });
  };

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

  const addCustomRegion = () => {
    if (customRegion.trim() && !data.geographic_spread.includes(customRegion.trim())) {
      updateData({ geographic_spread: [...data.geographic_spread, customRegion.trim()] });
      setCustomRegion('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Services Affected */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">Services Affected</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select ICT services impacted by this incident
          </p>
        </div>

        {services.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Label
                key={service.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50"
              >
                <Checkbox
                  checked={data.services_affected.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                />
                <span className="text-sm">{service.name}</span>
              </Label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No ICT services defined. You can add services in the Services module.
          </p>
        )}
      </div>

      {/* Critical Functions Affected */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">Critical Functions Affected</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select critical or important functions impacted
          </p>
        </div>

        {criticalFunctions.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="text-sm text-muted-foreground italic">
            No critical functions defined. You can add them in the Functions module.
          </p>
        )}
      </div>

      {/* Client Impact */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">Client Impact</Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clients_count">Clients Affected (Count)</Label>
            <Input
              id="clients_count"
              type="number"
              min="0"
              placeholder="Number of clients"
              value={data.clients_affected_count ?? ''}
              onChange={(e) =>
                updateData({
                  clients_affected_count: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clients_percentage">Clients Affected (%)</Label>
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
          </div>
        </div>
      </div>

      {/* Transaction Impact */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base font-medium">Transaction Impact</Label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transactions_count">Transactions Affected</Label>
            <Input
              id="transactions_count"
              type="number"
              min="0"
              placeholder="Number of transactions"
              value={data.transactions_affected_count ?? ''}
              onChange={(e) =>
                updateData({
                  transactions_affected_count: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transactions_value">Value Affected (€)</Label>
            <Input
              id="transactions_value"
              type="number"
              min="0"
              step="0.01"
              placeholder="Total value in EUR"
              value={data.transactions_value_affected ?? ''}
              onChange={(e) =>
                updateData({
                  transactions_value_affected: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="economic_impact">Estimated Economic Impact (€)</Label>
          <Input
            id="economic_impact"
            type="number"
            min="0"
            step="0.01"
            placeholder="Total financial impact"
            value={data.economic_impact ?? ''}
            onChange={(e) =>
              updateData({
                economic_impact: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Data Breach */}
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">Data Breach</Label>
              <p className="text-sm text-muted-foreground">
                Was personal or sensitive data compromised?
              </p>
            </div>
          </div>
          <Switch
            checked={data.data_breach}
            onCheckedChange={(checked) => updateData({ data_breach: checked })}
          />
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
            <p className="text-xs text-muted-foreground">
              <AlertCircle className="inline h-3 w-3 mr-1" />
              Data breaches may require notification to supervisory authorities
            </p>
          </div>
        )}
      </div>

      {/* Geographic Spread */}
      <div className="space-y-4">
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

        <div className="flex gap-2">
          <Input
            placeholder="Add custom region..."
            value={customRegion}
            onChange={(e) => setCustomRegion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomRegion()}
          />
          <Button variant="outline" size="icon" onClick={addCustomRegion}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {data.geographic_spread.filter((r) => !GEOGRAPHIC_REGIONS.includes(r)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.geographic_spread
              .filter((r) => !GEOGRAPHIC_REGIONS.includes(r))
              .map((region) => (
                <Badge key={region} variant="secondary" className="gap-1">
                  {region}
                  <button onClick={() => toggleRegion(region)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
          </div>
        )}
      </div>

      {/* Reputational Impact */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Reputational Impact</Label>
        <Select
          value={data.reputational_impact || ''}
          onValueChange={(value) =>
            updateData({ reputational_impact: value as ImpactLevel || undefined })
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
    </div>
  );
}
