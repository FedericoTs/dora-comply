'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Camera,
  Clock,
  FileText,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  MaturitySnapshot,
  SnapshotType,
  SnapshotChange,
} from '@/lib/compliance/maturity-history-types';

interface SnapshotHistoryProps {
  snapshots: MaturitySnapshot[];
}

const SNAPSHOT_TYPE_ICONS: Record<SnapshotType, React.ReactNode> = {
  scheduled: <Clock className="h-4 w-4" />,
  manual: <Camera className="h-4 w-4" />,
  soc2_upload: <FileText className="h-4 w-4" />,
  assessment: <CheckCircle className="h-4 w-4" />,
  remediation: <Activity className="h-4 w-4" />,
  baseline: <AlertTriangle className="h-4 w-4" />,
};

const SNAPSHOT_TYPE_LABELS: Record<SnapshotType, string> = {
  scheduled: 'Scheduled',
  manual: 'Manual',
  soc2_upload: 'SOC 2 Upload',
  assessment: 'Assessment',
  remediation: 'Remediation',
  baseline: 'Baseline',
};

const MATURITY_COLORS: Record<number, string> = {
  0: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  3: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function ChangeIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-600">
        <TrendingUp className="h-3 w-3" />
        +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-3 w-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-3 w-3" />
      0
    </span>
  );
}

export function SnapshotHistory({ snapshots }: SnapshotHistoryProps) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<MaturitySnapshot | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Camera className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No snapshots recorded</p>
        <p className="text-sm mt-1">
          Take your first snapshot to start tracking compliance history
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[100px] text-center">Maturity</TableHead>
              <TableHead className="w-[100px] text-center">Readiness</TableHead>
              <TableHead className="w-[80px] text-center">Change</TableHead>
              <TableHead className="w-[100px] text-center">Critical Gaps</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.map((snapshot, index) => {
              const change = snapshot.change_from_previous as SnapshotChange | null;
              const isFirst = index === 0;

              return (
                <TableRow
                  key={snapshot.id}
                  className={isFirst ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                >
                  <TableCell className="font-medium">
                    {new Date(snapshot.snapshot_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {SNAPSHOT_TYPE_ICONS[snapshot.snapshot_type]}
                      <span className="text-sm">
                        {SNAPSHOT_TYPE_LABELS[snapshot.snapshot_type]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={MATURITY_COLORS[snapshot.overall_maturity_level]}>
                      L{snapshot.overall_maturity_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">
                      {snapshot.overall_readiness_percent.toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {change ? (
                      <ChangeIndicator change={change.overall_change} />
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {snapshot.critical_gaps_count > 0 ? (
                      <Badge variant="destructive" className="font-mono">
                        {snapshot.critical_gaps_count}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-mono">
                        0
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                      {snapshot.notes || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSnapshot(snapshot)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Snapshot Detail Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Snapshot Details
              {selectedSnapshot && (
                <Badge className={MATURITY_COLORS[selectedSnapshot.overall_maturity_level]}>
                  L{selectedSnapshot.overall_maturity_level}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedSnapshot &&
                new Date(selectedSnapshot.snapshot_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedSnapshot && (
            <div className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    L{selectedSnapshot.overall_maturity_level}
                  </div>
                  <div className="text-xs text-muted-foreground">Overall Level</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {selectedSnapshot.overall_readiness_percent.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Readiness</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {selectedSnapshot.requirements_met}/{selectedSnapshot.total_requirements}
                  </div>
                  <div className="text-xs text-muted-foreground">Requirements Met</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedSnapshot.critical_gaps_count}
                  </div>
                  <div className="text-xs text-muted-foreground">Critical Gaps</div>
                </div>
              </div>

              {/* Pillar Breakdown */}
              <div>
                <h4 className="text-sm font-medium mb-3">Pillar Breakdown</h4>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'ICT Risk', level: selectedSnapshot.pillar_ict_risk_mgmt },
                    { label: 'Incidents', level: selectedSnapshot.pillar_incident_reporting },
                    { label: 'Resilience', level: selectedSnapshot.pillar_resilience_testing },
                    { label: '3rd Party', level: selectedSnapshot.pillar_third_party_risk },
                    { label: 'Info Share', level: selectedSnapshot.pillar_info_sharing },
                  ].map((pillar) => (
                    <div
                      key={pillar.label}
                      className="text-center p-2 border rounded-lg"
                    >
                      <div className="font-bold">L{pillar.level}</div>
                      <div className="text-xs text-muted-foreground">{pillar.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gap Summary */}
              <div>
                <h4 className="text-sm font-medium mb-3">Gap Summary</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 border rounded-lg border-red-200 bg-red-50 dark:bg-red-900/10">
                    <div className="font-bold text-red-600">{selectedSnapshot.critical_gaps_count}</div>
                    <div className="text-xs text-muted-foreground">Critical</div>
                  </div>
                  <div className="text-center p-2 border rounded-lg border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                    <div className="font-bold text-orange-600">{selectedSnapshot.high_gaps_count}</div>
                    <div className="text-xs text-muted-foreground">High</div>
                  </div>
                  <div className="text-center p-2 border rounded-lg border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                    <div className="font-bold text-amber-600">{selectedSnapshot.medium_gaps_count}</div>
                    <div className="text-xs text-muted-foreground">Medium</div>
                  </div>
                  <div className="text-center p-2 border rounded-lg border-gray-200 bg-gray-50 dark:bg-gray-900/10">
                    <div className="font-bold text-gray-600">{selectedSnapshot.low_gaps_count}</div>
                    <div className="text-xs text-muted-foreground">Low</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedSnapshot.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedSnapshot.notes}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                <span>Type: {SNAPSHOT_TYPE_LABELS[selectedSnapshot.snapshot_type]}</span>
                <span>ID: {selectedSnapshot.id.slice(0, 8)}...</span>
                <span>
                  Created: {new Date(selectedSnapshot.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
