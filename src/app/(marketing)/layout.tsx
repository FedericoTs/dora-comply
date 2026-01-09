import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: {
    default: 'DORA Comply | AI-Powered DORA Compliance Platform',
    template: '%s | DORA Comply',
  },
  description:
    'Automate DORA compliance with AI. Parse SOC 2 and ISO 27001 reports in seconds, generate your Register of Information automatically, and meet all regulatory deadlines. Trusted by EU financial institutions.',
  keywords: [
    'DORA compliance',
    'DORA regulation',
    'Digital Operational Resilience Act',
    'Register of Information',
    'RoI generation',
    'Third-party risk management',
    'TPRM',
    'EU financial regulation',
    'ICT risk management',
    'SOC 2 parsing',
    'ISO 27001',
    'Vendor risk assessment',
    'Compliance automation',
    'Financial services compliance',
  ],
  authors: [{ name: 'DORA Comply' }],
  creator: 'DORA Comply',
  publisher: 'DORA Comply',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://doracomply.eu'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_EU',
    url: 'https://doracomply.eu',
    siteName: 'DORA Comply',
    title: 'DORA Comply | AI-Powered DORA Compliance Platform',
    description:
      'Automate DORA compliance with AI. Generate your Register of Information in hours, not months.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DORA Comply - AI-Powered DORA Compliance Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DORA Comply | AI-Powered DORA Compliance',
    description:
      'Automate DORA compliance with AI. Generate your Register of Information in hours, not months.',
    images: ['/twitter-card.png'],
    creator: '@doracomply',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'How it Works', href: '#how-it-works' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Security', href: '#security' },
];

function MarketingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition-transform group-hover:scale-105">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              DORA<span className="text-primary">Comply</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>{children}</main>
    </div>
  );
}
