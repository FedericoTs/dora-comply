/**
 * TIBER Phase Progress Component
 *
 * Displays TIBER-EU phase progress for TLPT engagements
 */

import { Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TLPTComponentProps } from './types';

export function TIBERPhaseProgress({ tlpt }: TLPTComponentProps) {
  const phases = [
    {
      key: 'planning',
      name: 'Planning',
      description: 'Scope definition and preparation',
      completed: tlpt.scope_defined,
      active: tlpt.status === 'planning',
      date: tlpt.scope_definition_date,
    },
    {
      key: 'threat_intelligence',
      name: 'Threat Intelligence',
      description: 'TI provider analysis',
      completed: tlpt.ti_report_received,
      active: tlpt.status === 'threat_intelligence',
      date: tlpt.ti_end_date,
    },
    {
      key: 'red_team',
      name: 'Red Team Test',
      description: 'Active testing phase',
      completed: tlpt.rt_report_received,
      active: tlpt.status === 'red_team_test',
      date: tlpt.rt_end_date,
    },
    {
      key: 'closure',
      name: 'Closure',
      description: 'Purple team and remediation',
      completed: tlpt.status === 'completed' || tlpt.attestation_date !== null,
      active: tlpt.status === 'closure' || tlpt.status === 'remediation',
      date: tlpt.attestation_date,
    },
  ];

  const completedPhases = phases.filter((p) => p.completed).length;
  const progress = (completedPhases / phases.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TIBER-EU Progress</CardTitle>
        <CardDescription>
          {completedPhases} of {phases.length} phases complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.key}
              className={`flex items-start gap-3 ${
                phase.completed
                  ? 'text-primary'
                  : phase.active
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  phase.completed
                    ? 'bg-primary text-primary-foreground'
                    : phase.active
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {phase.completed ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{phase.name}</p>
                <p className="text-xs text-muted-foreground">{phase.description}</p>
                {phase.date && (
                  <p className="text-xs mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(phase.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
