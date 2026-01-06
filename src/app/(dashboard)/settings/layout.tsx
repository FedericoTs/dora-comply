'use client';

/**
 * Settings Layout
 *
 * Provides navigation sidebar for all settings pages
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Bell,
  Shield,
  Key,
  Palette,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const settingsNav = [
  {
    title: 'Organization',
    href: '/settings/organization',
    icon: Building2,
    description: 'Company details and LEI',
  },
  {
    title: 'Team',
    href: '/settings/team',
    icon: Users,
    description: 'Manage users and roles',
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email and alert preferences',
  },
  {
    title: 'Security',
    href: '/settings/security',
    icon: Shield,
    description: 'MFA and session settings',
  },
  {
    title: 'API & Integrations',
    href: '/settings/integrations',
    icon: Key,
    description: 'API keys and webhooks',
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: Palette,
    description: 'Theme and display options',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Check if we're on the main settings page
  const isMainPage = pathname === '/settings';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {!isMainPage && (
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization and application preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation - only show on sub-pages or always on larger screens */}
        <nav className={cn(
          'lg:w-64 lg:shrink-0',
          isMainPage ? 'hidden lg:block' : 'block'
        )}>
          <div className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
