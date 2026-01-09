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

const settingsSections = [
  {
    title: 'Organization',
    description: 'Company details, LEI, and jurisdiction settings',
    href: '/settings/organization',
    icon: Building2,
  },
  {
    title: 'Team Members',
    description: 'Manage users, roles, and permissions',
    href: '/settings/team',
    icon: Users,
  },
  {
    title: 'Notifications',
    description: 'Email preferences and alert settings',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Security',
    description: 'MFA, sessions, and audit log',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'API & Integrations',
    description: 'API keys, webhooks, and third-party integrations',
    href: '/settings/integrations',
    icon: Key,
  },
  {
    title: 'Appearance',
    description: 'Theme, locale, and display preferences',
    href: '/settings/appearance',
    icon: Palette,
  },
];

function SettingsCard({ section }: { section: typeof settingsSections[number] }) {
  const Icon = section.icon;

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
    <div className="grid gap-4 md:grid-cols-2">
      {settingsSections.map((section) => (
        <SettingsCard key={section.href} section={section} />
      ))}
    </div>
  );
}
