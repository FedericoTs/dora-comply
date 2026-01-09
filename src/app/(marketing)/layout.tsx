import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/nav';

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
