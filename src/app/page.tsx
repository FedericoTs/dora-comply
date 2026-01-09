'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  ArrowUpRight,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  GlowCard,
  MagneticButton,
  BlurIn,
  AnimatedCounter,
} from '@/components/marketing/animations';

// ============================================================================
// Landing Page Component
// ============================================================================

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      <MarketingNav />
      <HeroSection />
      <TrustBar />
      <PlatformSection />
      <FourthPartySection />
      <BentoFeatures />
      <MetricsSection />
      <SecuritySection />
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
  { name: 'Features', href: '#features' },
  { name: 'Security', href: '#security' },
];

function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || mobileMenuOpen
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/25"
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-semibold text-base sm:text-[17px] tracking-tight text-slate-900">
                DORA Comply
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Enterprise Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-[15px] font-medium text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <MagneticButton>
              <Link href="/contact">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-[15px] font-medium shadow-lg shadow-emerald-600/25 transition-all hover:shadow-xl hover:shadow-emerald-600/30">
                  Request Access
                </Button>
              </Link>
            </MagneticButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? 'auto' : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="sm:hidden overflow-hidden bg-white border-t border-slate-200/60"
      >
        <div className="px-4 py-4 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block px-4 py-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-200 space-y-3">
            <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full h-11">
                Sign In
              </Button>
            </Link>
            <Link href="/contact" className="block" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25">
                Request Access
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}

// ============================================================================
// Hero Section - Premium with Gradient Mesh
// ============================================================================

function HeroSection() {
  return (
    <section className="relative pt-16 sm:pt-[72px] pb-12 sm:pb-20 overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#FAFAFA]" />
        <div className="absolute top-0 left-1/4 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-emerald-200/30 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/4 right-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-emerald-300/20 rounded-full blur-[60px] sm:blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 w-[350px] sm:w-[700px] h-[350px] sm:h-[700px] bg-slate-200/40 rounded-full blur-[80px] sm:blur-[120px]" />
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-32">
        <div className="max-w-4xl">
          {/* Exclusive Badge */}
          <BlurIn delay={0.1}>
            <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl sm:rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg shadow-slate-900/5 mb-6 sm:mb-10">
              <div className="flex items-center gap-2 sm:pr-3 sm:border-r border-slate-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-sm font-semibold text-slate-900">Limited Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-xs sm:text-sm font-medium text-slate-600">RoI Deadline: April 30, 2026</span>
              </div>
            </div>
          </BlurIn>

          {/* Headline */}
          <FadeInUp delay={0.2}>
            <h1 className="text-[32px] sm:text-[44px] md:text-[56px] lg:text-[72px] xl:text-[80px] font-semibold leading-[1.1] sm:leading-[1.05] tracking-[-0.02em] sm:tracking-[-0.03em] text-slate-900 mb-6 sm:mb-8">
              The definitive platform for{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400">
                  DORA compliance
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <motion.path
                    d="M2 10C50 4 150 2 298 6"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#059669" />
                      <stop offset="1" stopColor="#14b8a6" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
          </FadeInUp>

          {/* Subheadline */}
          <FadeInUp delay={0.3}>
            <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed text-slate-600 max-w-2xl mb-8 sm:mb-12">
              Complete visibility into your ICT third-party ecosystem.
              From document intelligence to fourth-party mapping, purpose-built
              for EU financial institutions.
            </p>
          </FadeInUp>

          {/* CTAs */}
          <FadeInUp delay={0.4}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 mb-10 sm:mb-16">
              <MagneticButton>
                <Link href="/contact" className="block">
                  <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/25 group transition-all hover:shadow-2xl hover:shadow-emerald-600/30">
                    Schedule a Demo
                    <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </MagneticButton>
              <Link href="#platform" className="block">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 transition-all">
                  Explore Platform
                </Button>
              </Link>
            </div>
          </FadeInUp>

          {/* Trust Indicators */}
          <FadeInUp delay={0.5}>
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-500">
              {[
                { icon: CheckCircle2, label: 'EU Data Residency' },
                { icon: CheckCircle2, label: 'SOC 2 Type II' },
                { icon: CheckCircle2, label: 'ISO 27001 Certified' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <item.icon className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>

        {/* Dashboard Preview with 3D Effect */}
        <ScaleIn delay={0.6}>
          <div className="mt-20 relative perspective-1000">
            <motion.div
              initial={{ rotateX: 10 }}
              whileInView={{ rotateX: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              viewport={{ once: true }}
              className="relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Glow behind */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-emerald-600/10 to-teal-500/20 rounded-3xl blur-2xl" />

              {/* Browser chrome */}
              <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 bg-slate-50/80 border-b border-slate-200">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300 hover:bg-red-400 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-slate-300 hover:bg-yellow-400 transition-colors cursor-pointer" />
                    <div className="w-3 h-3 rounded-full bg-slate-300 hover:bg-green-400 transition-colors cursor-pointer" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-slate-200 text-sm text-slate-500">
                      <Lock className="h-3 w-3 text-emerald-600" />
                      <span>app.doracomply.eu</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-white min-h-[280px] sm:min-h-[420px]">
                  {/* Mobile: simplified 2x2 grid, Desktop: full 12-col layout */}
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-6">
                    {/* Metrics - 2x2 grid on mobile, sidebar on desktop */}
                    <div className="col-span-1 sm:col-span-3">
                      <DashboardMetric title="RoI Readiness" value={94} suffix="%" trend="+6%" positive />
                    </div>
                    <div className="col-span-1 sm:col-span-3 sm:hidden">
                      <DashboardMetric title="Vendors Mapped" value={312} trend="+24" positive />
                    </div>
                    <div className="hidden sm:block sm:col-span-3 space-y-4">
                      <div className="hidden">
                        <DashboardMetric title="RoI Readiness" value={94} suffix="%" trend="+6%" positive />
                      </div>
                      <DashboardMetric title="Vendors Mapped" value={312} trend="+24" positive />
                      <DashboardMetric title="4th Parties" value={89} trend="Tracked" />
                      <DashboardMetric title="Open Issues" value={7} trend="-3" positive />
                    </div>
                    <div className="col-span-2 sm:col-span-6 space-y-3 sm:space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-slate-900">Supply Chain Visibility</h3>
                          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live
                          </span>
                        </div>
                        <div className="space-y-3">
                          {[
                            { name: 'Cloud Infrastructure', depth: 'Direct', risk: 'Low' },
                            { name: 'Payment Processing', depth: '2 layers', risk: 'Medium' },
                            { name: 'Data Analytics', depth: '3 layers', risk: 'Low' },
                          ].map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.8 + i * 0.1 }}
                              viewport={{ once: true }}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                  <Network className="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-900">{item.name}</div>
                                  <div className="text-xs text-slate-500">{item.depth}</div>
                                </div>
                              </div>
                              <span className={cn(
                                'text-xs font-medium px-2 py-1 rounded-full',
                                item.risk === 'Low' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              )}>{item.risk}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Framework Coverage - hidden on mobile, shown on desktop */}
                    <div className="hidden sm:block sm:col-span-3 space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Framework Coverage</h3>
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
                                <motion.div
                                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full"
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${fw.pct}%` }}
                                  transition={{ duration: 1, delay: 1 + i * 0.1, ease: 'easeOut' }}
                                  viewport={{ once: true }}
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
            </motion.div>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
}

function DashboardMetric({ title, value, suffix = '', trend, positive }: { title: string; value: number; suffix?: string; trend: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm text-slate-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-slate-900">
        <AnimatedCounter value={value} suffix={suffix} duration={2} />
      </div>
      <div className={cn(
        'text-xs font-medium mt-1',
        positive ? 'text-emerald-600' : 'text-slate-500'
      )}>{trend}</div>
    </div>
  );
}

// ============================================================================
// Trust Bar
// ============================================================================

function TrustBar() {
  return (
    <section className="py-10 sm:py-16 bg-white border-y border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mb-6 sm:mb-10">
            Aligned with regulatory frameworks from European supervisory authorities
          </p>
        </FadeInUp>
        <StaggerContainer className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-16 gap-y-6 sm:gap-y-8">
          {[
            { abbr: 'EBA', name: 'European Banking Authority' },
            { abbr: 'EIOPA', name: 'Insurance & Pensions Authority' },
            { abbr: 'ESMA', name: 'Securities & Markets Authority' },
            { abbr: 'ECB', name: 'European Central Bank' },
          ].map((reg) => (
            <StaggerItem key={reg.abbr}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors shrink-0">
                  <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-emerald-600 transition-colors">{reg.abbr}</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{reg.name}</div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ============================================================================
// Platform Section
// ============================================================================

function PlatformSection() {
  return (
    <section id="platform" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
              The Platform
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
              Complete operational resilience infrastructure
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed">
              Purpose-built for the complexity of modern financial services.
              One unified platform covering the full scope of DORA requirements.
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: FileSearch,
              title: 'Document Intelligence',
              description: 'Advanced extraction from SOC 2, ISO 27001, and penetration test reports. Automatic control mapping and exception identification.',
              metrics: ['Sub-60 second processing', '47+ control types', 'CUEC detection'],
              color: 'emerald',
            },
            {
              icon: FileText,
              title: 'Register of Information',
              description: 'All 15 ESA-mandated templates with intelligent auto-population. Built-in validation and one-click xBRL-CSV export.',
              metrics: ['15 ESA templates', 'Real-time validation', 'Regulatory export'],
              color: 'teal',
            },
            {
              icon: AlertTriangle,
              title: 'Incident Management',
              description: 'DORA Article 19 compliant workflow with automated classification and deadline tracking across all milestones.',
              metrics: ['4h / 72h / 30d tracking', 'Auto-classification', 'Audit trail'],
              color: 'amber',
            },
            {
              icon: Network,
              title: 'Cross-Framework Mapping',
              description: 'Unified view across DORA, NIS2, GDPR, and ISO 27001. Identify overlaps and gaps automatically.',
              metrics: ['4 frameworks', 'Control inheritance', 'Gap analysis'],
              color: 'blue',
            },
            {
              icon: Building2,
              title: 'Vendor Lifecycle',
              description: 'Complete third-party governance from onboarding through exit. Risk scoring, contracts, and monitoring.',
              metrics: ['Criticality scoring', 'Contract tracking', 'Exit planning'],
              color: 'violet',
            },
            {
              icon: BarChart3,
              title: 'Executive Reporting',
              description: 'Board-ready dashboards and reports. Real-time risk posture, concentration analysis, and trends.',
              metrics: ['Board presentations', 'Regulatory reports', 'Audit packages'],
              color: 'rose',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <StaggerItem key={i}>
                <GlowCard className="h-full">
                  <div className="p-5 sm:p-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-6',
                        `bg-${feature.color}-100 text-${feature.color}-600`
                      )}
                      style={{
                        backgroundColor: feature.color === 'emerald' ? '#d1fae5' : feature.color === 'teal' ? '#ccfbf1' : feature.color === 'amber' ? '#fef3c7' : feature.color === 'blue' ? '#dbeafe' : feature.color === 'violet' ? '#ede9fe' : '#ffe4e6',
                        color: feature.color === 'emerald' ? '#059669' : feature.color === 'teal' ? '#0d9488' : feature.color === 'amber' ? '#d97706' : feature.color === 'blue' ? '#2563eb' : feature.color === 'violet' ? '#7c3aed' : '#e11d48',
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed mb-6">{feature.description}</p>
                    <div className="space-y-2">
                      {feature.metrics.map((metric, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-slate-500">
                          <div className="w-1 h-1 rounded-full bg-slate-400" />
                          {metric}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ============================================================================
// Fourth Party Section
// ============================================================================

function FourthPartySection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-emerald-950 text-white overflow-hidden relative">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <FadeInUp>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6 sm:mb-8">
                <CircuitBoard className="h-4 w-4" />
                <span className="text-sm font-medium">Deep Supply Chain Visibility</span>
              </div>
            </FadeInUp>

            <FadeInUp delay={0.1}>
              <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.02em] mb-4 sm:mb-6">
                See beyond your direct vendors
              </h2>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <p className="text-base sm:text-lg lg:text-xl text-emerald-100/70 leading-relaxed mb-8 sm:mb-10">
                DORA requires visibility into subcontracting chains. Our platform automatically
                maps fourth-party relationships, identifying concentration risks before they
                become regulatory findings.
              </p>
            </FadeInUp>

            <StaggerContainer staggerDelay={0.15} className="space-y-6 mb-10">
              {[
                { icon: LinkIcon, title: 'Automatic Chain Detection', description: 'Extract subcontractor info from SOC 2 reports and contracts' },
                { icon: Eye, title: 'Concentration Monitoring', description: 'Identify when multiple vendors depend on the same provider' },
                { icon: Target, title: 'Risk Propagation', description: 'Understand how fourth-party issues cascade to operations' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.title}>
                    <motion.div
                      whileHover={{ x: 10 }}
                      className="flex gap-4 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">{item.title}</div>
                        <div className="text-sm text-emerald-200/60">{item.description}</div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <FadeInUp delay={0.5}>
              <MagneticButton>
                <Link href="/contact">
                  <Button size="lg" className="bg-white text-emerald-950 hover:bg-emerald-50 shadow-xl">
                    See Fourth-Party Mapping
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </MagneticButton>
            </FadeInUp>
          </div>

          <ScaleIn delay={0.3}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-transparent to-emerald-950 z-10 pointer-events-none" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative rounded-2xl bg-emerald-900/50 border border-emerald-800/50 p-8"
              >
                <div className="space-y-6">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex justify-center"
                  >
                    <div className="px-6 py-3 rounded-xl bg-white text-emerald-950 font-semibold shadow-lg">
                      Your Organization
                    </div>
                  </motion.div>

                  <div className="flex justify-center">
                    <motion.div
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      viewport={{ once: true }}
                      className="w-px h-8 bg-emerald-600/50 origin-top"
                    />
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 sm:gap-6">
                    {['Cloud Provider', 'Payment Processor', 'Data Analytics'].map((vendor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-emerald-800/50 text-xs sm:text-sm font-medium text-white border border-emerald-700/50 cursor-pointer"
                      >
                        {vendor}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="w-px h-8 bg-emerald-700/50 origin-top"
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                    {['CDN', 'DNS', 'Auth', 'Storage', 'Monitor', 'Cards', 'Fraud', 'ML', 'Lake', 'API'].map((sub, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.05 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                          'px-1 sm:px-2 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs text-center cursor-pointer transition-colors',
                          i === 3 || i === 6 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-800/30 text-emerald-200/70 border border-emerald-700/30 hover:bg-emerald-800/50'
                        )}
                      >
                        {sub}
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    viewport={{ once: true }}
                    className="mt-6 pt-6 border-t border-emerald-800/50 flex items-center justify-between"
                  >
                    <div className="text-sm text-emerald-200/70">
                      <span className="text-amber-400 font-medium">2 concentration risks</span> detected
                    </div>
                    <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-emerald-800/50 text-emerald-200">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Live
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Bento Grid Features
// ============================================================================

function BentoFeatures() {
  return (
    <section id="features" className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 lg:mb-20">
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
              Capabilities
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
              Built for enterprise scale
            </h2>
          </div>
        </FadeInUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Large feature - Document Intelligence */}
          <ScaleIn className="col-span-1 sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 sm:mb-6">
                  <FileSearch className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-400" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-2 sm:mb-4">Document Intelligence</h3>
                <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed mb-4 sm:mb-8">
                  Upload a SOC 2 or ISO 27001 report and receive structured, actionable insights
                  in under 60 seconds. Our analysis engine does the work.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { value: '<60s', label: 'Processing' },
                    { value: '98%', label: 'Accuracy' },
                    { value: '40h', label: 'Saved' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/5">
                      <div className="text-lg sm:text-2xl font-semibold text-emerald-400">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </ScaleIn>

          {/* RoI Templates */}
          <ScaleIn delay={0.1} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-emerald-50 border border-emerald-100 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-200 transition-colors">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">15 ESA Templates</h3>
              <p className="text-sm sm:text-base text-slate-600">All Register of Information templates, auto-populated.</p>
            </motion.div>
          </ScaleIn>

          {/* xBRL Export */}
          <ScaleIn delay={0.2} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-100 transition-colors">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">xBRL-CSV Export</h3>
              <p className="text-sm sm:text-base text-slate-600">One-click regulatory export format.</p>
            </motion.div>
          </ScaleIn>

          {/* Incident Tracking */}
          <ScaleIn delay={0.3} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-amber-50 border border-amber-100 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-amber-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-amber-200 transition-colors">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">Incident Tracking</h3>
              <p className="text-sm sm:text-base text-slate-600">4h, 72h, 30d deadline automation.</p>
            </motion.div>
          </ScaleIn>

          {/* Cross-Framework */}
          <ScaleIn delay={0.4} className="col-span-1">
            <motion.div
              whileHover={{ y: -5 }}
              className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-blue-50 border border-blue-100 group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-blue-200 transition-colors">
                <GitBranch className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-slate-900 mb-1 sm:mb-2">4 Frameworks</h3>
              <p className="text-sm sm:text-base text-slate-600">DORA, NIS2, GDPR, ISO 27001 mapped.</p>
            </motion.div>
          </ScaleIn>
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
    <section className="py-16 sm:py-24 bg-emerald-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-emerald-500 rounded-full blur-[100px] sm:blur-[200px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-16">
          {[
            { value: 60, suffix: 's', prefix: '<', label: 'Document processing' },
            { value: 15, label: 'ESA templates' },
            { value: 4, label: 'Frameworks mapped' },
            { value: 100, suffix: '%', label: 'EU data residency' },
          ].map((stat, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-5xl lg:text-6xl font-semibold mb-1 sm:mb-2">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} duration={2.5} />
                </div>
                <div className="text-xs sm:text-sm lg:text-base text-emerald-200/60">{stat.label}</div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// ============================================================================
// Security Section
// ============================================================================

function SecuritySection() {
  return (
    <section id="security" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInUp>
          <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
              Security & Compliance
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
              Enterprise-grade security
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600">
              Your compliance data requires the highest standards. We exceed them.
            </p>
          </div>
        </FadeInUp>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {[
            { icon: Globe, title: 'EU Data Residency', description: 'Frankfurt. Zero cross-border transfers.' },
            { icon: ShieldCheck, title: 'SOC 2 Type II', description: 'Independently audited controls.' },
            { icon: Lock, title: 'ISO 27001', description: 'Certified ISMS.' },
            { icon: Server, title: 'GDPR Compliant', description: 'Full privacy protection.' },
          ].map((badge, i) => {
            const Icon = badge.icon;
            return (
              <StaggerItem key={i}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="text-center p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-2 sm:mb-4"
                  >
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-600" />
                  </motion.div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900 mb-1 sm:mb-2">{badge.title}</div>
                  <div className="text-xs sm:text-sm text-slate-500">{badge.description}</div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeInUp>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-4 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-slate-900">Regulatory-ready architecture</div>
                  <div className="text-xs sm:text-sm text-slate-500">Built for supervisory examination</div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {['DORA', 'NIS2', 'GDPR', 'MaRisk', 'BAIT'].map((reg) => (
                  <motion.span
                    key={reg}
                    whileHover={{ scale: 1.05 }}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors"
                  >
                    {reg}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </FadeInUp>
      </div>
    </section>
  );
}

// ============================================================================
// Enterprise Section
// ============================================================================

function EnterpriseSection() {
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScaleIn>
          <div className="max-w-5xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-2">
                <div className="p-6 sm:p-10 lg:p-14">
                  <FadeInUp>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3 sm:mb-4">
                      Enterprise
                    </p>
                  </FadeInUp>
                  <FadeInUp delay={0.1}>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-[-0.02em] text-slate-900 mb-4 sm:mb-6">
                      Purpose-built for financial institutions
                    </h2>
                  </FadeInUp>
                  <FadeInUp delay={0.2}>
                    <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed mb-6 sm:mb-10">
                      We work exclusively with regulated financial entities. Our teams understand
                      your compliance requirements, your timelines, and your stakeholders.
                    </p>
                  </FadeInUp>

                  <StaggerContainer staggerDelay={0.1} className="space-y-3 sm:space-y-4">
                    {[
                      { icon: Users, text: 'Dedicated implementation team' },
                      { icon: Workflow, text: 'Custom workflow configuration' },
                      { icon: Shield, text: 'Security review and DPA' },
                      { icon: Zap, text: 'Priority support SLA' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <StaggerItem key={item.text}>
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-2 sm:gap-3"
                          >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                            </div>
                            <span className="text-sm sm:text-base text-slate-700">{item.text}</span>
                          </motion.div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                </div>

                <div className="bg-emerald-950 p-6 sm:p-10 lg:p-14 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-400 rounded-full blur-[100px]" />
                  </div>
                  <div className="relative">
                    <FadeInUp>
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-3 sm:mb-4">Request access</h3>
                    </FadeInUp>
                    <FadeInUp delay={0.1}>
                      <p className="text-emerald-100/70 mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg">
                        Schedule a consultation with our team to discuss your compliance
                        requirements and see the platform.
                      </p>
                    </FadeInUp>

                    <StaggerContainer staggerDelay={0.1} className="space-y-3 sm:space-y-4 mb-6 sm:mb-10">
                      {[
                        'Personalized platform demonstration',
                        'DORA readiness assessment',
                        'Implementation roadmap',
                      ].map((item) => (
                        <StaggerItem key={item}>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>

                    <FadeInUp delay={0.4}>
                      <MagneticButton>
                        <Link href="/contact">
                          <Button size="lg" className="w-full h-12 sm:h-14 bg-white text-emerald-950 hover:bg-emerald-50 font-semibold text-base sm:text-lg shadow-xl">
                            Schedule Consultation
                            <ArrowUpRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </Link>
                      </MagneticButton>
                    </FadeInUp>

                    <FadeInUp delay={0.5}>
                      <p className="text-center text-xs sm:text-sm text-emerald-200/50 mt-4 sm:mt-6">
                        Response within one business day
                      </p>
                    </FadeInUp>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </ScaleIn>
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
        { label: 'Document Intelligence', href: '#features' },
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
        { label: 'Security', href: '#security' },
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
    <footer className="bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 sm:gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-600 text-white">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-semibold text-base sm:text-lg text-slate-900">DORA Comply</span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6 max-w-xs">
              The enterprise platform for DORA compliance. Trusted by EU financial institutions.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white border border-slate-200 text-[10px] sm:text-xs text-slate-600 shadow-sm">
                <Globe className="h-3 w-3" />
                EU Data Residency
              </div>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="font-semibold text-sm sm:text-base text-slate-900 mb-2 sm:mb-4">{column.title}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-500 text-center md:text-left">
            &copy; {new Date().getFullYear()} DORA Comply. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms</Link>
            <Link href="/gdpr" className="hover:text-emerald-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
