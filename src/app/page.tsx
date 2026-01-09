import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  FileSearch,
  FileText,
  AlertTriangle,
  Building2,
  Network,
  BarChart3,
  Clock,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  ChevronRight,
  CheckCircle2,
  FileCheck,
  GitBranch,
  ShieldCheck,
  Server,
  Layers,
  Users,
  Scale,
  Workflow,
  Eye,
  Target,
  Landmark,
  CircuitBoard,
  LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'DORA Comply | Enterprise DORA Compliance Platform',
  description:
    'The enterprise platform for DORA compliance. Automated Register of Information generation, intelligent document analysis, and complete ICT third-party risk management for EU financial institutions.',
  keywords: [
    'DORA compliance',
    'DORA regulation',
    'Digital Operational Resilience Act',
    'Register of Information',
    'RoI generation',
    'Third-party risk management',
    'Fourth-party risk',
    'TPRM',
    'EU financial regulation',
    'ICT risk management',
    'SOC 2 analysis',
    'ISO 27001',
    'Vendor risk assessment',
    'Compliance automation',
    'Financial services compliance',
    'ESA templates',
    'NIS2',
    'GDPR',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_EU',
    url: 'https://doracomply.eu',
    siteName: 'DORA Comply',
    title: 'DORA Comply | Enterprise DORA Compliance Platform',
    description:
      'The enterprise platform for DORA compliance. Trusted by EU financial institutions.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DORA Comply - Enterprise DORA Compliance Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DORA Comply | Enterprise DORA Compliance',
    description:
      'The enterprise platform for DORA compliance. Trusted by EU financial institutions.',
    images: ['/twitter-card.png'],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <MarketingNav />
      <HeroSection />
      <RegulatorSection />
      <PlatformOverview />
      <FourthPartySection />
      <CapabilitiesSection />
      <RoISection />
      <MetricsSection />
      <ComplianceSection />
      <EnterpriseSection />
      <Footer />
    </div>
  );
}

// ============================================================================
// Navigation
// ============================================================================

const navigation = [
  { name: 'Platform', href: '#platform' },
  { name: 'Capabilities', href: '#capabilities' },
  { name: 'Compliance', href: '#compliance' },
];

function MarketingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[17px] tracking-tight text-slate-900">
                DORA Comply
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Enterprise Platform
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[15px] font-medium text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-11 text-[15px] font-medium shadow-lg shadow-emerald-600/25">
                Request Access
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

// ============================================================================
// Hero Section
// ============================================================================

function HeroSection() {
  return (
    <section className="relative pt-[72px] overflow-hidden">
      {/* Refined background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/50 to-[#FAFAFA]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[600px] bg-gradient-to-b from-slate-100/60 to-transparent rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-24 lg:pt-32 pb-20">
        <div className="max-w-4xl">
          {/* Deadline Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-10">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-sm font-semibold text-slate-900">RoI Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">April 30, 2026</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-[52px] lg:text-[64px] font-semibold leading-[1.08] tracking-[-0.02em] text-slate-900 mb-8">
            The definitive platform for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400">
              DORA compliance
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl lg:text-[22px] leading-relaxed text-slate-600 max-w-2xl mb-12">
            Complete visibility into your ICT third-party ecosystem. From document intelligence
            to fourth-party mapping, we handle the complexity so you can focus on what matters.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-16">
            <Link href="/contact">
              <Button size="lg" className="h-14 px-8 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/25 group">
                Schedule a Demo
                <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#platform">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-slate-300 text-slate-700 hover:bg-slate-50">
                Explore Platform
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
              <span>EU Data Residency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
              <span>SOC 2 Type II</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              </div>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute -inset-4 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-slate-200 text-sm text-slate-500">
                  <Lock className="h-3 w-3" />
                  <span>app.doracomply.eu</span>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 lg:p-8 bg-slate-50 min-h-[420px]">
              <div className="grid grid-cols-12 gap-6">
                {/* Left sidebar metrics */}
                <div className="col-span-3 space-y-4">
                  <MetricCard title="RoI Readiness" value="94%" trend="+6%" positive />
                  <MetricCard title="Vendors Mapped" value="312" trend="+24" positive />
                  <MetricCard title="4th Parties" value="89" trend="Tracked" />
                  <MetricCard title="Open Issues" value="7" trend="-3" positive />
                </div>

                {/* Main content area */}
                <div className="col-span-6 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">Supply Chain Visibility</h3>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Live</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Cloud Infrastructure', depth: 'Direct', risk: 'Low' },
                        { name: 'Payment Processing', depth: '2 layers', risk: 'Medium' },
                        { name: 'Data Analytics', depth: '3 layers', risk: 'Low' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                              <Network className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900">{item.name}</div>
                              <div className="text-xs text-slate-500">{item.depth}</div>
                            </div>
                          </div>
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            item.risk === 'Low' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}>{item.risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="col-span-3 space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-semibold text-slate-900 mb-4">Framework Coverage</h3>
                    <div className="space-y-3">
                      {[
                        { name: 'DORA', pct: 94 },
                        { name: 'NIS2', pct: 87 },
                        { name: 'GDPR', pct: 98 },
                        { name: 'ISO 27001', pct: 91 },
                      ].map((fw, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600">{fw.name}</span>
                            <span className="font-medium text-slate-900">{fw.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all"
                              style={{ width: `${fw.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ title, value, trend, positive }: { title: string; value: string; trend: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-sm text-slate-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className={cn(
        "text-xs font-medium mt-1",
        positive ? "text-emerald-600" : "text-slate-500"
      )}>{trend}</div>
    </div>
  );
}

// ============================================================================
// Regulator Section (replaces fake logos)
// ============================================================================

function RegulatorSection() {
  return (
    <section className="py-16 bg-white border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 mb-8">
          Aligned with regulatory frameworks from European supervisory authorities
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
          {[
            { abbr: 'EBA', name: 'European Banking Authority' },
            { abbr: 'EIOPA', name: 'Insurance & Pensions Authority' },
            { abbr: 'ESMA', name: 'Securities & Markets Authority' },
            { abbr: 'ECB', name: 'European Central Bank' },
          ].map((reg) => (
            <div key={reg.abbr} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                <Landmark className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">{reg.abbr}</div>
                <div className="text-xs text-slate-500">{reg.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Platform Overview
// ============================================================================

function PlatformOverview() {
  return (
    <section id="platform" className="py-24 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            The Platform
          </p>
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 mb-6">
            Complete operational resilience infrastructure
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Purpose-built for the complexity of modern financial services.
            One unified platform covering the full scope of DORA requirements.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {[
            {
              icon: FileSearch,
              title: 'Intelligent Document Analysis',
              description: 'Advanced extraction from SOC 2, ISO 27001, and penetration test reports. Automatic control mapping and exception identification.',
              metrics: ['Sub-60 second processing', '47+ control types identified', 'CUEC detection'],
            },
            {
              icon: FileText,
              title: 'Register of Information',
              description: 'All 15 ESA-mandated templates with intelligent auto-population. Built-in validation and one-click xBRL-CSV export.',
              metrics: ['15 ESA templates', 'Real-time validation', 'Regulatory-ready export'],
            },
            {
              icon: AlertTriangle,
              title: 'Incident Management',
              description: 'DORA Article 19 compliant workflow with automated classification and deadline tracking across all reporting milestones.',
              metrics: ['4-hour initial notification', '72-hour intermediate', '30-day final report'],
            },
            {
              icon: Network,
              title: 'Cross-Framework Mapping',
              description: 'Unified view of compliance across DORA, NIS2, GDPR, and ISO 27001. Identify overlaps and gaps automatically.',
              metrics: ['4 frameworks mapped', 'Control inheritance', 'Gap analysis'],
            },
            {
              icon: Building2,
              title: 'Vendor Lifecycle',
              description: 'Complete third-party governance from onboarding through exit. Risk scoring, contract management, and continuous monitoring.',
              metrics: ['Criticality assessment', 'Contract tracking', 'Exit planning'],
            },
            {
              icon: BarChart3,
              title: 'Executive Reporting',
              description: 'Board-ready dashboards and reports. Real-time risk posture, concentration analysis, and trend visualization.',
              metrics: ['Board presentations', 'Regulatory submissions', 'Audit packages'],
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="group relative p-8 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="space-y-2">
                  {feature.metrics.map((metric, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-slate-500">
                      <div className="w-1 h-1 rounded-full bg-slate-400" />
                      {metric}
                    </div>
                  ))}
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
// Fourth Party Section (Key Differentiator)
// ============================================================================

function FourthPartySection() {
  return (
    <section className="py-24 bg-emerald-950 text-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-8">
              <CircuitBoard className="h-4 w-4" />
              <span className="text-sm font-medium">Deep Supply Chain Visibility</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight mb-6">
              See beyond your direct vendors
            </h2>

            <p className="text-xl text-slate-300 leading-relaxed mb-8">
              DORA requires visibility into subcontracting chains. Our platform automatically
              maps fourth-party relationships, identifying concentration risks before they become
              regulatory findings.
            </p>

            <div className="space-y-6 mb-10">
              {[
                {
                  icon: LinkIcon,
                  title: 'Automatic Chain Detection',
                  description: 'Extract subcontractor information from SOC 2 reports and contracts',
                },
                {
                  icon: Eye,
                  title: 'Concentration Monitoring',
                  description: 'Identify when multiple vendors depend on the same critical provider',
                },
                {
                  icon: Target,
                  title: 'Risk Propagation',
                  description: 'Understand how fourth-party issues cascade to your operations',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{item.title}</div>
                      <div className="text-sm text-emerald-200/60">{item.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/contact">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                See Fourth-Party Mapping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Visual representation */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-transparent to-emerald-950 z-10 pointer-events-none" />
            <div className="relative rounded-2xl bg-emerald-900/50 border border-emerald-800/50 p-8">
              <div className="space-y-4">
                {/* Your organization */}
                <div className="flex justify-center">
                  <div className="px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold shadow-lg">
                    Your Organization
                  </div>
                </div>

                {/* Direct vendors */}
                <div className="flex justify-center gap-4 py-4">
                  <div className="w-px h-8 bg-emerald-700/50" />
                </div>
                <div className="flex justify-center gap-6">
                  {['Cloud Provider', 'Payment Processor', 'Data Analytics'].map((vendor, i) => (
                    <div key={i} className="px-4 py-2 rounded-lg bg-emerald-800/50 text-sm font-medium text-white border border-emerald-700/50">
                      {vendor}
                    </div>
                  ))}
                </div>

                {/* Fourth parties */}
                <div className="flex justify-center gap-4 py-4">
                  <div className="w-px h-8 bg-emerald-700/50" />
                  <div className="w-px h-8 bg-emerald-700/50" />
                  <div className="w-px h-8 bg-emerald-700/50" />
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {['CDN Services', 'DNS Provider', 'Auth Service', 'Storage', 'Monitoring', 'Card Networks', 'Fraud Detection', 'ML Platform', 'Data Lake', 'API Gateway'].map((sub, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-2 py-1.5 rounded text-xs text-center",
                        i === 3 || i === 6 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-800/30 text-emerald-200/70 border border-emerald-700/30"
                      )}
                    >
                      {sub}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-emerald-800/50 flex items-center justify-between">
                  <div className="text-sm text-emerald-200/70">
                    <span className="text-amber-400 font-medium">2 concentration risks</span> detected across chains
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-emerald-800/50 text-emerald-200">Live monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Capabilities Section
// ============================================================================

function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Document Intelligence
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">
              From document to decision in seconds
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              Upload a SOC 2 or ISO 27001 report and receive structured, actionable insights.
              Our analysis engine identifies controls, exceptions, subservice organizations,
              and DORA gaps—automatically.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                'Audit opinion extraction',
                'Control result mapping',
                'Exception identification',
                'Subservice org detection',
                'CUEC requirements',
                'DORA gap analysis',
              ].map((cap, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-sm text-slate-700">{cap}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-8 p-6 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-center">
                <div className="text-3xl font-semibold text-slate-900">&lt;60s</div>
                <div className="text-sm text-slate-500">Average processing</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl font-semibold text-slate-900">98%</div>
                <div className="text-sm text-slate-500">Extraction accuracy</div>
              </div>
              <div className="w-px bg-slate-200" />
              <div className="text-center">
                <div className="text-3xl font-semibold text-slate-900">40h</div>
                <div className="text-sm text-slate-500">Saved per assessment</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-6 bg-white">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileSearch className="h-8 w-8 text-slate-600" />
                </div>
                <div className="font-medium text-slate-900 mb-1">Upload compliance document</div>
                <div className="text-sm text-slate-500">SOC 2, ISO 27001, or pen test reports</div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 mb-4">
                <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">Analyzing document...</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div className="bg-emerald-600 h-1.5 rounded-full w-[72%] transition-all" />
                  </div>
                </div>
                <span className="text-sm text-slate-500">72%</span>
              </div>

              <div className="space-y-2">
                {[
                  { icon: CheckCircle2, label: 'Opinion: Unqualified', color: 'text-emerald-600' },
                  { icon: Layers, label: '47 controls extracted', color: 'text-slate-900' },
                  { icon: AlertTriangle, label: '2 exceptions identified', color: 'text-amber-600' },
                  { icon: Network, label: '3 subservice orgs mapped', color: 'text-blue-600' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
                      <Icon className={cn("h-4 w-4", item.color)} />
                      <span className="text-sm font-medium text-slate-900">{item.label}</span>
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
// RoI Section
// ============================================================================

function RoISection() {
  const templates = [
    'B_01.01 — Entity Identification',
    'B_02.01 — ICT Third-Party Providers',
    'B_03.01 — Contractual Arrangements',
    'B_04.01 — ICT Services',
    'B_05.01 — Critical Functions',
    'B_06.01 — Subcontracting Chains',
  ];

  return (
    <section className="py-24 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="space-y-3">
              {templates.map((template, i) => (
                <div
                  key={i}
                  className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                  style={{ marginLeft: `${i * 12}px` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{template}</div>
                      <div className="text-sm text-slate-500">Auto-populated from vendor data</div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                      Ready
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">
              + 9 additional ESA templates included
            </p>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              DORA Article 28
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">
              Register of Information, ready for submission
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              All 15 ESA-mandated templates automatically populated from your vendor data.
              Built-in validation ensures regulatory compliance before you export.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: Sparkles, text: 'Intelligent auto-population from parsed documents' },
                { icon: CheckCircle2, text: 'Real-time validation against ESA business rules' },
                { icon: FileCheck, text: 'One-click xBRL-CSV regulatory export' },
                { icon: GitBranch, text: 'Complete version history and audit trail' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <span className="text-slate-700">{item.text}</span>
                  </div>
                );
              })}
            </div>

            <Link href="/contact">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                See RoI Generation
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
// Metrics Section
// ============================================================================

function MetricsSection() {
  return (
    <section className="py-20 bg-emerald-950 text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          {[
            { value: '<60s', label: 'Document processing time' },
            { value: '15', label: 'ESA templates supported' },
            { value: '4', label: 'Compliance frameworks' },
            { value: 'EU', label: 'Data residency guarantee' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl lg:text-5xl font-semibold mb-2">{stat.value}</div>
              <div className="text-emerald-200/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Compliance Section
// ============================================================================

function ComplianceSection() {
  return (
    <section id="compliance" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Security & Compliance
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">
            Enterprise-grade security, built for financial services
          </h2>
          <p className="text-lg text-slate-600">
            Your compliance data requires the highest standards of protection.
            We exceed them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Globe, title: 'EU Data Residency', description: 'All data stored in Frankfurt. Zero cross-border transfers.' },
            { icon: ShieldCheck, title: 'SOC 2 Type II', description: 'Independently audited controls for security and availability.' },
            { icon: Lock, title: 'ISO 27001', description: 'Certified information security management system.' },
            { icon: Server, title: 'GDPR Compliant', description: 'Full privacy protection with DPA available.' },
          ].map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div key={i} className="text-center p-8 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Icon className="h-7 w-7 text-slate-700" />
                </div>
                <div className="font-semibold text-slate-900 mb-2">{badge.title}</div>
                <div className="text-sm text-slate-500">{badge.description}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-8 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Regulatory-ready architecture</div>
                <div className="text-sm text-slate-500">Built for supervisory examination and audit requirements</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {['DORA', 'NIS2', 'GDPR', 'MaRisk', 'BAIT'].map((reg) => (
                <span key={reg} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700">
                  {reg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Enterprise Section
// ============================================================================

function EnterpriseSection() {
  return (
    <section className="py-24 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-10 lg:p-12">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Enterprise
                </p>
                <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 mb-6">
                  Purpose-built for financial institutions
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                  We work exclusively with regulated financial entities. Our implementation
                  teams understand your compliance requirements, your timelines, and your stakeholders.
                </p>

                <div className="space-y-4">
                  {[
                    { icon: Users, text: 'Dedicated implementation team' },
                    { icon: Workflow, text: 'Custom workflow configuration' },
                    { icon: Shield, text: 'Security review and DPA' },
                    { icon: Clock, text: 'Priority support SLA' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-slate-600" />
                        </div>
                        <span className="text-slate-700">{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-emerald-950 p-10 lg:p-12 text-white">
                <h3 className="text-2xl font-semibold mb-4">Request access</h3>
                <p className="text-emerald-100/70 mb-8">
                  Schedule a consultation with our team to discuss your compliance requirements
                  and see the platform in action.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Personalized platform demonstration</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>DORA readiness assessment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Implementation roadmap</span>
                  </div>
                </div>

                <Link href="/contact">
                  <Button size="lg" className="w-full h-12 bg-white text-slate-900 hover:bg-slate-100 font-semibold">
                    Schedule Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <p className="text-center text-xs text-emerald-200/50 mt-4">
                  Response within one business day
                </p>
              </div>
            </div>
          </div>
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
      title: 'Platform',
      links: [
        { label: 'Document Intelligence', href: '#capabilities' },
        { label: 'Register of Information', href: '#platform' },
        { label: 'Fourth-Party Mapping', href: '#platform' },
        { label: 'Incident Management', href: '#platform' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'DORA Overview', href: '/guides/dora' },
        { label: 'API Reference', href: '/docs/api' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Security', href: '#compliance' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/gdpr' },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Shield className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg text-slate-900">DORA Comply</span>
            </Link>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">
              The enterprise platform for DORA compliance. Trusted by EU financial institutions.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600">
                <Globe className="h-3 w-3" />
                EU Data Residency
              </div>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold text-slate-900 mb-4">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} DORA Comply. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/gdpr" className="hover:text-slate-900 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
