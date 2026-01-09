/**
 * Settings Page
 *
 * Hub page for all settings sections
 */

import Link from 'next/link';
import { Building2, Bell, Shield, Users, Palette, Key, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Settings | DORA Comply',
  description: 'Application and organization settings',
};

const settingsSections = [
  {
    title: 'Organization',
    description: 'Company details, LEI, and jurisdiction settings',
    href: '/settings/organization',
    icon: Building2,
    status: 'active' as const,
  },
  {
    title: 'Team Members',
    description: 'Manage users, roles, and permissions',
    href: '/settings/team',
    icon: Users,
    status: 'active' as const,
  },
  {
    title: 'Notifications',
    description: 'Email preferences and alert settings',
    href: '/settings/notifications',
    icon: Bell,
    status: 'coming_soon' as const,
  },
  {
    title: 'Security',
    description: 'MFA, sessions, and audit log',
    href: '/settings/security',
    icon: Shield,
    status: 'active' as const,
  },
  {
    title: 'API & Integrations',
    description: 'API keys, webhooks, and third-party integrations',
    href: '/settings/integrations',
    icon: Key,
    status: 'coming_soon' as const,
  },
  {
    title: 'Appearance',
    description: 'Theme, locale, and display preferences',
    href: '/settings/appearance',
    icon: Palette,
    status: 'coming_soon' as const,
  },
];

function SettingsCard({ section }: { section: typeof settingsSections[number] }) {
  const Icon = section.icon;
  const isComingSoon = section.status === 'coming_soon';

  const cardContent = (
    <Card className={cn(
      'transition-all h-full',
      isComingSoon
        ? 'border-dashed opacity-60'
        : 'hover:border-primary/50 hover:shadow-md'
    )}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isComingSoon ? 'bg-muted' : 'bg-primary/10'
            )}>
              <Icon className={cn(
                'h-5 w-5',
                isComingSoon ? 'text-muted-foreground' : 'text-primary'
              )} />
            </div>
            <div>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </div>
          </div>
          {!isComingSoon && (
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </CardHeader>
      {isComingSoon && (
        <CardContent className="pt-0">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Coming soon
          </span>
        </CardContent>
      )}
    </Card>
  );

  if (isComingSoon) {
    return (
      <div className="block cursor-not-allowed">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={section.href} className="block group">
      {cardContent}
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {settingsSections.map((section) => (
        <SettingsCard key={section.href} section={section} />
      ))}
    </div>
  );
}
