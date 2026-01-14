/**
 * Classification Icon Display Component
 *
 * Renders the appropriate icon based on incident classification
 */

import { AlertTriangle, Shield, Info } from 'lucide-react';

interface ClassificationIconDisplayProps {
  classification: string;
  className?: string;
}

export function ClassificationIconDisplay({
  classification,
  className,
}: ClassificationIconDisplayProps) {
  switch (classification) {
    case 'major':
      return <AlertTriangle className={className} />;
    case 'significant':
      return <Shield className={className} />;
    default:
      return <Info className={className} />;
  }
}
