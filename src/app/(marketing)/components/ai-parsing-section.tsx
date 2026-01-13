/**
 * AIParsingSection Component
 *
 * Feature deep dive showcasing AI document parsing capabilities.
 */

'use client';

import {
  FileSearch,
  Check,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Network,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const CAPABILITIES = [
  'Audit opinion extraction',
  'All control results mapped',
  'Exception identification',
  'Subservice organization detection',
  'CUEC requirements flagged',
  'DORA gap analysis',
];

const RESULTS_PREVIEW = [
  { icon: CheckCircle2, label: 'Opinion: Unqualified', color: 'text-success' },
  { icon: Layers, label: '47 controls extracted', color: 'text-primary' },
  { icon: AlertTriangle, label: '2 exceptions found', color: 'text-warning' },
  { icon: Network, label: '3 subservice orgs detected', color: 'text-info' },
];

export function AIParsingSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section id="how-it-works" ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className={cn(
            "transition-all duration-700",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          )}>
            <Badge variant="secondary" className="mb-4">AI-Powered</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Intelligent Document Analysis
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Upload a SOC 2 or ISO 27001 report and watch our AI extract everything you need.
              No more manual reading. No more missed findings.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {CAPABILITIES.map((cap, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <span className="text-sm">{cap}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 p-4 rounded-xl bg-slate-50 border">
              <div className="text-center min-w-[80px]">
                <div className="text-3xl sm:text-4xl font-bold text-primary">45s</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Avg. parse time</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="text-center min-w-[80px]">
                <div className="text-3xl sm:text-4xl font-bold text-primary">98%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-border" />
              <div className="text-center min-w-[80px]">
                <div className="text-3xl sm:text-4xl font-bold text-primary">40h</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Saved/vendor</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className={cn(
            "relative transition-all duration-700 delay-300",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          )}>
            <div className="relative bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-8 border">
              {/* Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-6 bg-white/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileSearch className="h-8 w-8 text-primary" />
                </div>
                <div className="font-medium mb-1">Drop SOC 2 Report</div>
                <div className="text-sm text-muted-foreground">or click to browse</div>
              </div>

              {/* Processing Indicator */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border mb-4">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Analyzing document...</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div className="bg-primary h-1.5 rounded-full animate-progress" style={{ width: '65%' }} />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>

              {/* Results Preview */}
              <div className="space-y-2">
                {RESULTS_PREVIEW.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                      <Icon className={cn("h-4 w-4", item.color)} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
