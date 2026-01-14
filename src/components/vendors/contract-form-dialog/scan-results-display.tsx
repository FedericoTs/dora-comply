'use client';

import { Badge } from '@/components/ui/badge';
import type { ScanResult } from './types';

interface ScanResultsDisplayProps {
  scanResult: ScanResult;
}

export function ScanResultsDisplay({ scanResult }: ScanResultsDisplayProps) {
  return (
    <div className="mt-3 pt-3 border-t text-xs space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Document Type:</span>
        <Badge variant="secondary" className="text-xs">
          {scanResult.documentType.replace(/_/g, ' ')}
        </Badge>
      </div>
      {scanResult.isIctContract && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">ICT Contract:</span>
          <Badge variant="outline" className="text-xs text-success border-success">
            Yes - DORA Applicable
          </Badge>
        </div>
      )}
      {scanResult.likelyCriticalFunction && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Critical Function:</span>
          <Badge variant="outline" className="text-xs text-warning border-warning">
            Likely Critical
          </Badge>
        </div>
      )}
      {scanResult.keyServicesMentioned.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {scanResult.keyServicesMentioned.slice(0, 3).map((service) => (
            <Badge key={service} variant="outline" className="text-xs">
              {service}
            </Badge>
          ))}
          {scanResult.keyServicesMentioned.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{scanResult.keyServicesMentioned.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
