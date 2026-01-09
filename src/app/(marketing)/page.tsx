'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  FileSearch,
  FileText,
  AlertTriangle,
  Building2,
  GitBranch,
  BarChart3,
  Clock,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  Play,
  Star,
  Quote,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Timer,
  FileCheck,
  Network,
  ShieldCheck,
  Server,
  Layers,
  Target,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Animation Hook
// ============================================================================

function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ============================================================================
// Countdown Component
// ============================================================================

function DeadlineCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const deadline = new Date('2026-04-30T23:59:59');

    const updateCountdown = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning border border-warning/20">
        <Clock className="h-4 w-4" />
        <span className="font-semibold">{timeLeft.days}</span>
        <span className="text-warning/70">days</span>
      </div>
      <span className="text-muted-foreground text-center sm:text-left">until first RoI submission deadline</span>
    </div>
  );
}

// ============================================================================
// Floating Cards Animation
// ============================================================================

function FloatingCard({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "absolute bg-white rounded-xl shadow-xl border border-border/50 p-3 animate-float",
        className
      )}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '3s',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Hero Section
// ============================================================================

function HeroSection() {
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

// ============================================================================
// Social Proof / Logo Bar
// ============================================================================

function SocialProofBar() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-16 border-y bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className={cn(
          "text-center text-sm text-muted-foreground mb-8 transition-all duration-500",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          Trusted by compliance teams at leading EU financial institutions
        </p>

        <div className={cn(
          "flex flex-wrap items-center justify-center gap-x-12 gap-y-6 transition-all duration-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
          {['Deutsche Bank', 'ING', 'BNP Paribas', 'Rabobank', 'ABN AMRO', 'Santander'].map((company, i) => (
            <div
              key={company}
              className="text-xl font-semibold text-slate-300 hover:text-slate-500 transition-colors"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Problem Statement Section
// ============================================================================

function ProblemSection() {
  const { ref, isVisible } = useIntersectionObserver();

  const problems = [
    { value: '300+', label: 'hours spent', sublabel: 'on manual RoI creation' },
    { value: '15', label: 'ESA templates', sublabel: 'required for submission' },
    { value: '4', label: 'weeks average', sublabel: 'per vendor assessment' },
  ];

  const comparisons = [
    { before: '4+ weeks per vendor assessment', after: '60 seconds per document' },
    { before: 'Manual data entry into spreadsheets', after: 'AI-powered automatic extraction' },
    { before: 'Copy-paste between templates', after: 'Single source of truth' },
    { before: 'Export format nightmares', after: '1-click xBRL-CSV export' },
  ];

  return (
    <section id="problem" ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Problem Stats */}
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            DORA compliance shouldn&apos;t be this hard
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Financial institutions are struggling with the complexity of DORA requirements
          </p>
        </div>

        <div className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 transition-all duration-700 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          {problems.map((problem, i) => (
            <div
              key={i}
              className="text-center p-8 rounded-2xl bg-slate-50 border"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-5xl font-bold text-primary mb-2">{problem.value}</div>
              <div className="text-lg font-medium mb-1">{problem.label}</div>
              <div className="text-sm text-muted-foreground">{problem.sublabel}</div>
            </div>
          ))}
        </div>

        {/* Before/After Comparison */}
        <div className={cn(
          "max-w-4xl mx-auto transition-all duration-700 delay-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="grid md:grid-cols-2 gap-4 p-6 rounded-2xl border bg-gradient-to-r from-slate-50 to-primary/5">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-slate-500" />
                </div>
                <span className="font-semibold text-slate-600">Before DORA Comply</span>
              </div>
              <ul className="space-y-3">
                {comparisons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    {c.before}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </div>
                <span className="font-semibold text-success">With DORA Comply</span>
              </div>
              <ul className="space-y-3">
                {comparisons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    {c.after}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Features Grid Section
// ============================================================================

function FeaturesGrid() {
  const { ref, isVisible } = useIntersectionObserver();

  const features = [
    {
      icon: FileSearch,
      title: 'AI Document Parsing',
      description: 'Upload SOC 2, ISO 27001, and pen test reports. Our AI extracts controls, exceptions, and findings in under 60 seconds.',
      badge: 'Core Feature',
      color: 'primary',
    },
    {
      icon: FileText,
      title: 'Register of Information',
      description: 'All 15 ESA-mandated templates auto-populated from your vendor data. Export to xBRL-CSV with one click.',
      badge: 'DORA Art. 28',
      color: 'info',
    },
    {
      icon: AlertTriangle,
      title: 'Incident Reporting',
      description: 'DORA Article 19 compliant workflow with automated deadline tracking: 4-hour, 72-hour, and 30-day reports.',
      badge: 'DORA Art. 19',
      color: 'warning',
    },
    {
      icon: Network,
      title: 'Cross-Framework Mapping',
      description: 'Automatic mapping between DORA, NIS2, GDPR, and ISO 27001. See compliance coverage across all frameworks.',
      badge: 'Multi-Framework',
      color: 'purple',
    },
    {
      icon: Building2,
      title: 'Vendor Management',
      description: 'Complete vendor lifecycle from onboarding to exit. Track criticality, contracts, and risk scores in one place.',
      badge: 'ICT Third Parties',
      color: 'success',
    },
    {
      icon: BarChart3,
      title: 'Risk Dashboard',
      description: 'Real-time risk scoring with trend analysis. Board-ready reports and concentration risk monitoring.',
      badge: 'Analytics',
      color: 'chart-4',
    },
  ];

  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
    purple: 'bg-purple-500/10 text-purple-500',
    success: 'bg-success/10 text-success',
    'chart-4': 'bg-violet-500/10 text-violet-500',
  };

  return (
    <section id="features" ref={ref} className="py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Complete Platform</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need for DORA compliance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One platform. All requirements. Full regulatory coverage.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className={cn(
                  "group relative p-8 rounded-2xl bg-white border hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center mb-6",
                  colorMap[feature.color]
                )}>
                  <Icon className="h-7 w-7" />
                </div>
                <Badge variant="outline" className="mb-3 text-xs">
                  {feature.badge}
                </Badge>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Feature Deep Dive - AI Parsing
// ============================================================================

function AIParsingSection() {
  const { ref, isVisible } = useIntersectionObserver();

  const capabilities = [
    'Audit opinion extraction',
    'All control results mapped',
    'Exception identification',
    'Subservice organization detection',
    'CUEC requirements flagged',
    'DORA gap analysis',
  ];

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
              {capabilities.map((cap, i) => (
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
                {[
                  { icon: CheckCircle2, label: 'Opinion: Unqualified', color: 'text-success' },
                  { icon: Layers, label: '47 controls extracted', color: 'text-primary' },
                  { icon: AlertTriangle, label: '2 exceptions found', color: 'text-warning' },
                  { icon: Network, label: '3 subservice orgs detected', color: 'text-info' },
                ].map((item, i) => {
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

// ============================================================================
// Feature Deep Dive - RoI Generation
// ============================================================================

function RoISection() {
  const { ref, isVisible } = useIntersectionObserver();

  const templates = [
    'B_01.01 - Entity Identification',
    'B_02.01 - ICT Providers',
    'B_03.01 - Contracts',
    'B_04.01 - ICT Services',
    'B_05.01 - Critical Functions',
    'B_06.01 - Subcontracting',
  ];

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-slate-50/50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Visual */}
          <div className={cn(
            "relative order-2 lg:order-1 transition-all duration-700",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          )}>
            <div className="relative">
              {/* Stacked Templates */}
              <div className="space-y-3">
                {templates.map((template, i) => (
                  <div
                    key={i}
                    className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                    style={{
                      marginLeft: `${i * 8}px`,
                      opacity: 1 - (i * 0.1),
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{template}</div>
                        <div className="text-xs text-muted-foreground">Auto-populated</div>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs">Ready</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* More indicator */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                + 9 more templates included
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={cn(
            "order-1 lg:order-2 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          )}>
            <Badge variant="secondary" className="mb-4">DORA Article 28</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Register of Information in One Click
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              All 15 ESA-mandated templates automatically populated from your vendor data.
              No manual copy-paste. No format errors. Export-ready xBRL-CSV.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: Zap, text: 'Auto-populated from parsed documents' },
                { icon: CheckCircle2, text: 'Built-in validation against ESA rules' },
                { icon: FileCheck, text: 'One-click xBRL-CSV export' },
                { icon: GitBranch, text: 'Version control and audit trail' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>

            <Link href="/contact">
              <Button size="lg" className="shadow-lg shadow-primary/25">
                Generate Your RoI
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Statistics Section
// ============================================================================

function StatsSection() {
  const { ref, isVisible } = useIntersectionObserver();

  const stats = [
    { value: '45s', label: 'Average SOC 2 parsing time' },
    { value: '15', label: 'ESA templates supported' },
    { value: '98%', label: 'Customer satisfaction' },
    { value: '4', label: 'Compliance frameworks mapped' },
    { value: '1000+', label: 'Vendors assessed' },
    { value: 'EU', label: 'Data residency guaranteed' },
  ];

  return (
    <section ref={ref} className="py-24 bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "text-center transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Testimonials Section
// ============================================================================

function TestimonialsSection() {
  const { ref, isVisible } = useIntersectionObserver();

  const testimonials = [
    {
      quote: "DORA Comply reduced our vendor assessment time by 90%. What used to take weeks now takes hours. The AI parsing is remarkably accurate.",
      author: "Maria van der Berg",
      role: "Head of Third-Party Risk",
      company: "Major EU Bank",
      rating: 5,
    },
    {
      quote: "Finally, a platform that understands EU regulations. The RoI export feature alone saved us 200+ hours of manual work.",
      author: "Thomas Weber",
      role: "Chief Compliance Officer",
      company: "Insurance Group",
      rating: 5,
    },
    {
      quote: "The cross-framework mapping is invaluable. We can now see our DORA, NIS2, and ISO 27001 compliance in one view.",
      author: "Sophie Laurent",
      role: "VP of Risk Management",
      company: "Investment Firm",
      rating: 5,
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by compliance leaders
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why EU financial institutions choose DORA Comply
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className={cn(
                "relative p-8 rounded-2xl bg-slate-50 border transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-primary/20 mb-4" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-lg mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Pricing Section
// ============================================================================

function PricingSection() {
  const { ref, isVisible } = useIntersectionObserver();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      price: isAnnual ? '399' : '499',
      period: '/mo',
      description: 'Perfect for small financial entities starting their DORA journey',
      features: [
        'Up to 50 vendors',
        '100 AI document parses/month',
        '5 team members',
        'All 15 RoI templates',
        'Email support',
        'EU data residency',
      ],
      cta: 'Request Access',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: isAnnual ? '799' : '999',
      period: '/mo',
      description: 'For growing teams with complex compliance needs',
      features: [
        'Up to 250 vendors',
        '500 AI document parses/month',
        '20 team members',
        'All 15 RoI templates',
        'Priority support',
        'API access',
        'SSO integration',
        'Custom workflows',
      ],
      cta: 'Request Access',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large institutions with advanced requirements',
      features: [
        'Unlimited vendors',
        'Unlimited AI parses',
        'Unlimited team members',
        'Dedicated success manager',
        'Custom SLA',
        'On-premise option',
        'Advanced security controls',
        'Custom integrations',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" ref={ref} className="py-24 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-12 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free. Scale as you grow. No hidden fees.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white border">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !isAnnual ? "bg-primary text-white" : "text-muted-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                isAnnual ? "bg-primary text-white" : "text-muted-foreground"
              )}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={cn(
                "relative p-8 rounded-2xl border-2 transition-all duration-500",
                plan.highlighted
                  ? "bg-white border-primary shadow-xl scale-105"
                  : "bg-white border-border hover:border-primary/50",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="shadow-lg">{plan.badge}</Badge>
                </div>
              )}

              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  {plan.price === 'Custom' ? '' : '€'}{plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.description}</p>

              <div className="border-t pt-6 mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                <Button
                  className={cn(
                    "w-full",
                    plan.highlighted
                      ? "shadow-lg shadow-primary/25"
                      : "bg-slate-100 text-foreground hover:bg-slate-200"
                  )}
                  variant={plan.highlighted ? "default" : "secondary"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// Security & Trust Section
// ============================================================================

function SecuritySection() {
  const { ref, isVisible } = useIntersectionObserver();

  const badges = [
    { icon: Globe, label: 'EU Data Residency', sublabel: 'Frankfurt data center' },
    { icon: ShieldCheck, label: 'SOC 2 Type II', sublabel: 'Certified compliant' },
    { icon: Lock, label: 'ISO 27001', sublabel: 'Information security' },
    { icon: Server, label: 'GDPR Compliant', sublabel: 'Full privacy protection' },
  ];

  return (
    <section id="security" ref={ref} className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "text-center mb-16 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <Badge variant="secondary" className="mb-4">Security First</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for enterprise security
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your compliance data deserves the highest level of protection
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div
                key={i}
                className={cn(
                  "text-center p-8 rounded-2xl bg-slate-50 border transition-all duration-500 hover:shadow-lg",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="font-semibold mb-1">{badge.label}</div>
                <div className="text-sm text-muted-foreground">{badge.sublabel}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Final CTA Section
// ============================================================================

function FinalCTA() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section ref={ref} className="py-24 bg-gradient-to-br from-foreground via-foreground to-slate-800 text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <div className={cn(
          "transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to simplify your
            <br />
            <span className="text-primary">DORA compliance?</span>
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join leading EU financial institutions already using DORA Comply.
            Start your free trial today and generate your first RoI in minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="h-14 px-8 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                Request Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-600 text-white hover:bg-slate-800">
                Talk to Sales
              </Button>
            </Link>
          </div>

          <p className="text-sm text-slate-400 mt-6">
            No credit card required. 14-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Footer
// ============================================================================

function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Security', href: '#security' },
        { label: 'Roadmap', href: '/roadmap' },
        { label: 'Changelog', href: '/changelog' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/api' },
        { label: 'DORA Guide', href: '/guides/dora' },
        { label: 'Blog', href: '/blog' },
        { label: 'Webinars', href: '/webinars' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
        { label: 'Partners', href: '/partners' },
        { label: 'Press', href: '/press' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
        { label: 'Security', href: '/security' },
        { label: 'GDPR', href: '/gdpr' },
        { label: 'Cookies', href: '/cookies' },
      ],
    },
  ];

  return (
    <footer className="bg-slate-50 border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">
                DORA<span className="text-primary">Comply</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered DORA compliance for EU financial institutions.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>EU Data Residency</span>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DORA Comply. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <SocialProofBar />
      <ProblemSection />
      <FeaturesGrid />
      <AIParsingSection />
      <RoISection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <SecuritySection />
      <FinalCTA />
      <Footer />

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 65%; }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 2s ease-out forwards;
        }
      `}</style>
    </>
  );
}
