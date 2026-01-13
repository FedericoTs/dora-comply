/**
 * HeroSection Component
 *
 * Main hero section with headline, CTAs, and product preview.
 */

'use client';

import Link from 'next/link';
import {
  Check,
  ArrowRight,
  Lock,
  ChevronRight,
  Play,
  Sparkles,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { DeadlineCountdown } from './deadline-countdown';
import { FloatingCard } from './floating-card';

export function HeroSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="relative min-h-screen pt-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-white to-white" />

      {/* Animated Orbs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-info/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-[0.02]" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Urgency Badge */}
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-warning/10 border border-primary/20 mb-8 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium">DORA Regulation is Now in Effect</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Main Headline */}
          <h1 className={cn(
            "text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">
              DORA Compliance,
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              Powered by AI
            </span>
          </h1>

          {/* Subheadline */}
          <p className={cn(
            "text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            Stop drowning in spreadsheets. Generate your{' '}
            <span className="text-foreground font-medium">Register of Information</span>{' '}
            in hours, not months. All 15 ESA templates, automated.
          </p>

          {/* Countdown */}
          <div className={cn(
            "flex justify-center mb-10 transition-all duration-700 delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <DeadlineCountdown />
          </div>

          {/* CTAs */}
          <div className={cn(
            "flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 transition-all duration-700 delay-400",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 group">
                Request Access
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg group">
                <Play className="mr-2 h-5 w-5 text-primary" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Trust Signals */}
          <div className={cn(
            "flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground transition-all duration-700 delay-500",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>EU data residency</span>
            </div>
          </div>
        </div>

        {/* Product Screenshot with Floating Elements */}
        <div className={cn(
          "relative mt-16 max-w-5xl mx-auto transition-all duration-1000 delay-600",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          {/* Browser Frame */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-100 to-slate-50 p-1 shadow-2xl">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-t-xl border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 rounded-lg text-sm text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  app.doracomply.eu
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="bg-slate-50 rounded-b-xl p-3 sm:p-6 min-h-[300px] sm:min-h-[400px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Stats Row - 2x2 on mobile, 4 cols on desktop */}
                <div className="col-span-1 sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-white rounded-xl p-3 sm:p-4 border shadow-sm">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">RoI Readiness</div>
                    <div className="text-xl sm:text-2xl font-bold text-success">94%</div>
                    <div className="w-full bg-success/20 rounded-full h-1.5 mt-2 hidden sm:block">
                      <div className="bg-success h-1.5 rounded-full" style={{ width: '94%' }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border shadow-sm">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Vendors</div>
                    <div className="text-xl sm:text-2xl font-bold">147</div>
                    <div className="text-xs text-success items-center gap-1 mt-1 hidden sm:flex">
                      <TrendingUp className="h-3 w-3" /> +12 this week
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border shadow-sm">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Documents</div>
                    <div className="text-xl sm:text-2xl font-bold">312</div>
                    <div className="text-xs text-muted-foreground mt-1 hidden sm:block">Avg. 45s per doc</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border shadow-sm">
                    <div className="text-xs sm:text-sm text-muted-foreground mb-1">Issues</div>
                    <div className="text-xl sm:text-2xl font-bold text-warning">3</div>
                    <div className="text-xs text-warning mt-1 hidden sm:block">Action required</div>
                  </div>
                </div>

                {/* Content Area - Hidden on mobile for cleaner look */}
                <div className="hidden sm:block sm:col-span-2 bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Recent Assessments</span>
                    <Badge variant="secondary">Live</Badge>
                  </div>
                  <div className="space-y-2">
                    {['AWS CloudFront', 'Salesforce', 'Microsoft Azure'].map((vendor, i) => (
                      <div key={vendor} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="text-sm">{vendor}</span>
                        <Badge variant={i === 0 ? 'default' : 'secondary'} className="text-xs">
                          {i === 0 ? 'Parsing...' : 'Complete'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden sm:block bg-white rounded-xl p-4 border shadow-sm">
                  <div className="font-medium mb-3">Compliance Score</div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle
                          cx="48" cy="48" r="40" fill="none" stroke="#059669" strokeWidth="8"
                          strokeDasharray={`${0.87 * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">87%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Cards */}
          <FloatingCard className="left-[-60px] top-32 hidden lg:flex items-center gap-2" delay={0}>
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Check className="h-4 w-4 text-success" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">SOC 2 Report</div>
              <div className="text-sm font-medium">Parsed in 42s</div>
            </div>
          </FloatingCard>

          <FloatingCard className="right-[-40px] top-48 hidden lg:flex items-center gap-2" delay={0.5}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">AI Analysis</div>
              <div className="text-sm font-medium">47 controls extracted</div>
            </div>
          </FloatingCard>

          <FloatingCard className="left-[-30px] bottom-24 hidden lg:flex items-center gap-2" delay={1}>
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-info" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">RoI Template</div>
              <div className="text-sm font-medium">B_02.01 auto-filled</div>
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}
