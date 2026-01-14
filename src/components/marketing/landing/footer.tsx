'use client';

import Link from 'next/link';
import { Shield, Globe } from 'lucide-react';

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

export function Footer() {
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
