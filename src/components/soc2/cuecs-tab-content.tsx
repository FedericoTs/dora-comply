/**
 * CUECs Tab Content Component
 *
 * Displays Complementary User Entity Controls from SOC 2 reports.
 */

import { Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ParsedCUEC } from '@/lib/soc2/soc2-types';

interface CuecsTabContentProps {
  cuecs: ParsedCUEC[];
}

export function CuecsTabContent({ cuecs }: CuecsTabContentProps) {
  if (cuecs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No CUECs Identified</p>
          <p className="text-sm text-muted-foreground">
            No complementary user entity controls were found in this report
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-warning/5 border-warning/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium text-warning">Customer Responsibilities</p>
              <p className="text-sm text-muted-foreground mt-1">
                These controls must be implemented by your organization to ensure the service
                provider&apos;s controls operate effectively. Track implementation status to
                maintain compliance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complementary User Entity Controls</CardTitle>
          <CardDescription>Controls that must be implemented by your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Customer Responsibility</TableHead>
                <TableHead className="w-32">Related Control</TableHead>
                <TableHead className="w-32">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuecs.map((cuec, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">
                    {cuec.id || `CUEC-${idx + 1}`}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{cuec.customerResponsibility}</p>
                    {cuec.description !== cuec.customerResponsibility && (
                      <p className="text-xs text-muted-foreground mt-1">{cuec.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {cuec.relatedControl && (
                      <Badge variant="outline" className="font-mono">
                        {cuec.relatedControl}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {cuec.category && (
                      <Badge variant="secondary" className="capitalize">
                        {cuec.category.replace('_', ' ')}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
