/**
 * Article 26 Card Component
 *
 * Displays DORA Article 26 requirements for TLPT
 */

import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Article26Card() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Article 26 Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>TLPT every 3 years for significant entities</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Use recognized frameworks (TIBER-EU)</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Independent TI and RT providers</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Cover critical functions and live systems</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <span>Report to competent authorities</span>
        </div>
      </CardContent>
    </Card>
  );
}
