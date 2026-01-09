'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  AlertTriangle,
  Network,
  FlaskConical,
  BarChart3,
  Layers,
  Settings,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
  collapsible?: boolean;
}

interface SidebarNavProps {
  /** Number of completed onboarding steps (0-4) */
  onboardingProgress?: number;
  /** Show advanced features or hide them */
  showAdvanced?: boolean;
}

// ============================================================================
// Navigation Configuration
// ============================================================================

const CORE_NAV: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Register of Information', href: '/roi', icon: BookOpen },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
];

const ADVANCED_NAV: NavItem[] = [
  { name: 'Concentration Risk', href: '/concentration', icon: Network },
  { name: 'Resilience Testing', href: '/testing', icon: FlaskConical },
  { name: 'Compliance Trends', href: '/compliance/trends', icon: BarChart3 },
  { name: 'Frameworks', href: '/frameworks', icon: Layers },
];

const SETTINGS_NAV: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

// ============================================================================
// Components
// ============================================================================

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'nav-item',
        isActive && 'active'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1 text-sm">{item.name}</span>
      {item.badge && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function CollapsibleGroup({
  title,
  items,
  defaultOpen = true,
  collapsible = true,
  currentPath,
}: {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
  collapsible?: boolean;
  currentPath: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasActiveItem = items.some(item => currentPath.startsWith(item.href));

  // Auto-open if an item in this group is active
  const effectiveOpen = isOpen || hasActiveItem;

  if (!collapsible) {
    return (
      <div className="space-y-1">
        <div className="px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={currentPath.startsWith(item.href)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            effectiveOpen ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>
      <div
        className={cn(
          'space-y-1 overflow-hidden transition-all duration-200',
          effectiveOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={currentPath.startsWith(item.href)}
          />
        ))}
      </div>
    </div>
  );
}

function OnboardingProgress({ completed, total }: { completed: number; total: number }) {
  if (completed >= total) return null;

  return (
    <div className="px-3 py-3 mx-3 mb-2 rounded-lg bg-primary/5 border border-primary/10">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="font-medium text-primary">Setup Progress</span>
        <span className="text-muted-foreground">{completed}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(completed / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SidebarNav({ onboardingProgress = 0, showAdvanced = true }: SidebarNavProps) {
  const pathname = usePathname();
  const isNewUser = onboardingProgress < 2;

  return (
    <nav className="flex-1 p-4 space-y-4">
      {/* Onboarding Progress (only for new users) */}
      {isNewUser && (
        <OnboardingProgress completed={onboardingProgress} total={4} />
      )}

      {/* Core Navigation - Always visible */}
      <CollapsibleGroup
        title="Core"
        items={CORE_NAV}
        defaultOpen={true}
        collapsible={false}
        currentPath={pathname}
      />

      {/* Advanced Navigation - Collapsible, closed by default for new users */}
      {showAdvanced && (
        <CollapsibleGroup
          title="Advanced"
          items={ADVANCED_NAV}
          defaultOpen={!isNewUser}
          collapsible={true}
          currentPath={pathname}
        />
      )}

      {/* Settings */}
      <div className="pt-2 border-t border-sidebar-border">
        {SETTINGS_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </div>
    </nav>
  );
}
