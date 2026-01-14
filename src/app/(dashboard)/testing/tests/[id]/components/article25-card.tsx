/**
 * Article 25 Card Component
 *
 * Displays DORA Article 25 requirements for test types
 */

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTestTypeLabel } from '@/lib/testing/types';
import type { Article25CardProps } from './types';

const requirements: Record<string, string> = {
  vulnerability_assessment: 'Identify security vulnerabilities in systems and networks',
  penetration_test: 'Test defenses using simulated attacks',
  scenario_based_test: 'Test response to specific threat scenarios',
  compatibility_test: 'Verify system compatibility and interoperability',
  performance_test: 'Assess system performance under load',
  end_to_end_test: 'Test complete business processes',
  source_code_review: 'Analyze code for security flaws',
  network_security_assessment: 'Evaluate network security controls',
  gap_analysis: 'Identify gaps against requirements/standards',
  physical_security_review: 'Review physical security measures',
};

export function Article25Card({ testType }: Article25CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Article 25 Requirement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{getTestTypeLabel(testType)}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {requirements[testType] || 'Digital operational resilience testing requirement'}
        </p>
        <p className="text-xs text-muted-foreground border-t pt-3">
          Financial entities must test ICT systems, risk management, and business continuity
          using appropriate testing approaches based on their risk profile.
        </p>
      </CardContent>
    </Card>
  );
}
