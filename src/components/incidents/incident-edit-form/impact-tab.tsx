'use client';

/**
 * Incident Impact Tab Component
 *
 * Business impact metrics that determine DORA classification.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import type { UpdateIncidentInput, ImpactLevel } from '@/lib/incidents/types';
import { IMPACT_LEVEL_OPTIONS } from '@/lib/incidents/form-constants';

interface ImpactTabProps {
  formData: Partial<UpdateIncidentInput>;
  onUpdate: (updates: Partial<UpdateIncidentInput>) => void;
}

export function ImpactTab({ formData, onUpdate }: ImpactTabProps) {
  return (
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
                  onChange={(e) =>
                    onUpdate({
                      clients_affected_percentage: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 5.5"
                />
                <p className="text-xs text-muted-foreground">DORA threshold: 10% for Major</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clients_affected_count">Clients Affected (Count)</Label>
                <Input
                  id="clients_affected_count"
                  type="number"
                  min={0}
                  value={formData.clients_affected_count ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      clients_affected_count: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
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
                  onChange={(e) =>
                    onUpdate({
                      transactions_value_affected: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
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
                  onChange={(e) =>
                    onUpdate({
                      transactions_affected_count: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
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
                  onCheckedChange={(checked) =>
                    onUpdate({
                      data_breach: checked,
                      data_records_affected: checked ? formData.data_records_affected : undefined,
                    })
                  }
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
                  onChange={(e) =>
                    onUpdate({
                      data_records_affected: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
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
              onChange={(e) =>
                onUpdate({
                  economic_impact: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Total estimated cost"
            />
          </div>

          {/* Reputational Impact */}
          <div className="space-y-2">
            <Label htmlFor="reputational_impact">Reputational Impact</Label>
            <Select
              value={formData.reputational_impact || '_none'}
              onValueChange={(value) =>
                onUpdate({
                  reputational_impact: value === '_none' ? undefined : (value as ImpactLevel),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select impact level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None</SelectItem>
                {IMPACT_LEVEL_OPTIONS.map((level) => (
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
  );
}
