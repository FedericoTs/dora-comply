'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowRight,
  Lock,
  CheckCircle2,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FadeInUp,
  ScaleIn,
  BlurIn,
  MagneticButton,
  AnimatedCounter,
} from '@/components/marketing/animations';

function DashboardMetric({
  title,
  value,
  suffix = '',
  trend,
  positive,
}: {
  title: string;
  value: number;
  suffix?: string;
  trend: string;
  positive?: boolean;
}) {
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

export function HeroSection() {
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
