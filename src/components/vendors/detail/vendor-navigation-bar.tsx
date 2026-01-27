'use client';

import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Shield,
  Users,
  Activity,
  FileText,
  ScrollText,
  Newspaper,
} from 'lucide-react';

export type VendorNavSection =
  | 'overview'
  | 'compliance'
  | 'contacts'
  | 'contracts'
  | 'documents'
  | 'monitoring'
  | 'intelligence';

interface NavItem {
  id: VendorNavSection;
  label: string;
  icon: React.ElementType;
}

interface VendorNavigationBarProps {
  activeSection: VendorNavSection;
  onSectionChange: (section: VendorNavSection) => void;
}

// Simplified flat navigation - 7 core tabs
const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'intelligence', label: 'Intelligence', icon: Newspaper },
];

export function VendorNavigationBar({
  activeSection,
  onSectionChange,
}: VendorNavigationBarProps) {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-10">
      <div className="flex items-center gap-1 p-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
