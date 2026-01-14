/**
 * Controls Tab Content Component
 *
 * Displays SOC 2 controls grouped by TSC category.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ParsedControl } from '@/lib/soc2/soc2-types';
import { CONTROL_STATUS_CONFIG, groupControlsByCategory } from '@/lib/soc2/soc2-types';

interface ControlsTabContentProps {
  controls: ParsedControl[];
}

export function ControlsTabContent({ controls }: ControlsTabContentProps) {
  const controlsByCategory = groupControlsByCategory(controls);

  return (
    <div className="space-y-4">
      {Object.entries(controlsByCategory).map(([category, categoryControls]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{category}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {categoryControls.filter((c) => c.testResult === 'operating_effectively').length}/
                  {categoryControls.length} effective
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="w-24 text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryControls.map((control) => {
                  const statusConfig = CONTROL_STATUS_CONFIG[control.testResult];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={control.controlId}>
                      <TableCell className="font-mono text-sm font-medium">
                        {control.controlId}
                      </TableCell>
                      <TableCell>
                        <p className="line-clamp-2 text-sm">{control.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${statusConfig.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(control.confidence * 100)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
