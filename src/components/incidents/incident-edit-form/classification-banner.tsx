'use client';

/**
 * Incident Classification Banner Component
 *
 * Preview banner showing current classification and override status.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClassificationBadge } from '../threshold-indicator';
import type { ClassificationResult, IncidentClassification, UpdateIncidentInput } from '@/lib/incidents/types';

interface ClassificationBannerProps {
  classificationResult: ClassificationResult;
  formData: Partial<UpdateIncidentInput>;
  hasChanges: boolean;
}

export function ClassificationBanner({
  classificationResult,
  formData,
  hasChanges,
}: ClassificationBannerProps) {
  return (
    <Card
      className={cn(
        'border-2',
        classificationResult.calculated === 'major' && 'border-destructive/50 bg-destructive/5',
        classificationResult.calculated === 'significant' && 'border-warning/50 bg-warning/5',
        classificationResult.calculated === 'minor' && 'border-border'
      )}
    >
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
  );
}
