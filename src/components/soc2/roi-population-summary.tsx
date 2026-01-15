'use client';

/**
 * RoI Population Summary Component
 *
 * Summary card with stats and action button.
 */

import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  Info,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RoiPopulationSummaryProps {
  vendorWillUpdate: boolean;
  servicesCount: number;
  subcontractorsCount: number;
  createServices: boolean;
  selectedSubcontractorsCount: number;
  populating: boolean;
  canSubmit: boolean;
  error: string | null;
  onPopulate: () => void;
}

export function RoiPopulationSummary({
  vendorWillUpdate,
  servicesCount,
  createServices,
  selectedSubcontractorsCount,
  populating,
  canSubmit,
  error,
  onPopulate,
}: RoiPopulationSummaryProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Summary: What Will Be Created
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{vendorWillUpdate ? 1 : 0}</div>
            <div className="text-xs text-muted-foreground">Vendor Updated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-info">
              {createServices ? servicesCount : 0}
            </div>
            <div className="text-xs text-muted-foreground">ICT Services</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{selectedSubcontractorsCount}</div>
            <div className="text-xs text-muted-foreground">4th Parties</div>
          </div>
        </div>

        <Separator />

        {/* Action Area */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Ready to populate your RoI?</p>
            <p className="text-sm text-muted-foreground">
              One click saves hours of manual data entry
            </p>
          </div>
          <Button
            size="lg"
            onClick={onPopulate}
            disabled={populating || !canSubmit}
            className="min-w-[200px]"
          >
            {populating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Populating RoI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Populate RoI Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Disabled state explanation */}
        {!canSubmit && (
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Info className="h-4 w-4" />
              <p className="text-sm">Enable services or select subcontractors to populate RoI</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
