/**
 * Settings Page
 *
 * Hub page for all settings sections
 */

import Link from 'next/link';
import { Building2, Bell, Shield, Users, Palette, Key, ChevronRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Settings | DORA Comply',
  description: 'Application and organization settings',
};

// Core settings - always visible
const coreSettings = [
  {
    title: 'Organization',
    description: 'Company details, LEI, and regulatory classification',
    href: '/settings/organization',
    icon: Building2,
  },
  {
    title: 'Team',
    description: 'Manage team members and invitations',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Integrations',
    description: 'API keys and webhooks',
    href: '/settings/integrations',
    icon: Key,
  },
];

// Additional settings - shown in a smaller section
const additionalSettings = [
  {
    title: 'Notifications',
    description: 'Email alerts',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Security',
    description: 'MFA and sessions',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Appearance',
    description: 'Theme settings',
    href: '/settings/appearance',
    icon: Palette,
  },
];

function SettingsCard({ section, compact = false }: { section: typeof coreSettings[number]; compact?: boolean }) {
  const Icon = section.icon;

  if (compact) {
    return (
      <Link href={section.href} className="block group">
        <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{section.title}</span>
            <span className="text-xs text-muted-foreground ml-2">{section.description}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </Link>
    );
  }

  return (
    <Link href={section.href} className="block group">
      <Card className="transition-all h-full hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Core Settings */}
      <div className="grid gap-4 md:grid-cols-3">
        {coreSettings.map((section) => (
          <SettingsCard key={section.href} section={section} />
        ))}
      </div>

      {/* Additional Settings */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Additional Settings</h3>
        <div className="grid gap-2 md:grid-cols-3">
          {additionalSettings.map((section) => (
            <SettingsCard key={section.href} section={section} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
