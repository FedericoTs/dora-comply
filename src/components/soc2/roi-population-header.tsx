'use client';

/**
 * RoI Population Header Component
 *
 * Hero section with value proposition and progress steps.
 */

import { Sparkles, ChevronRight, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RoiPopulationHeaderProps {
  overallConfidence: number;
}

export function RoiPopulationHeader({ overallConfidence }: RoiPopulationHeaderProps) {
  return (
    <>
      {/* Value Proposition Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                One-Click RoI Population
                <Badge variant="secondary" className="text-xs">
                  AI-Powered
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Skip hours of manual data entry. We&apos;ve extracted vendor, service, and
                subcontractor data from this SOC2 report. Review below and click one button to
                populate your DORA Register of Information.
              </p>
              {/* 3-step indicator */}
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    1
                  </div>
                  <span className="text-muted-foreground">Review extracted data</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    2
                  </div>
                  <span className="text-muted-foreground">Select what to include</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                    3
                  </div>
                  <span className="text-muted-foreground">Populate RoI</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{overallConfidence}%</div>
              <div className="text-xs text-muted-foreground">AI Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DORA Context Banner */}
      <Card className="bg-info/5 border-info/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-info flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">DORA Article 28 Compliance:</strong> Financial
              entities must maintain a Register of Information (RoI) documenting all ICT third-party
              providers and their supply chains.
              <strong className="text-info"> First submission deadline: April 30, 2026.</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
