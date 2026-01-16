'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  FileText,
  AlertTriangle,
  Network,
  FlaskConical,
  BarChart3,
  Layers,
  Settings,
  CheckCircle2,
  Circle,
  Clock,
  Shield,
  AlertCircle,
  Database,
  PieChart,
  ClipboardCheck,
  AlertOctagon,
  FileCheck,
  ClipboardList,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFramework } from '@/lib/context/framework-context';
import type { FrameworkCode, FrameworkModule } from '@/lib/licensing/types';
import { FRAMEWORK_DISPLAY_NAMES, FRAMEWORK_COLORS } from '@/lib/licensing/types';

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  /** If set, this nav item requires module access */
  module?: FrameworkModule;
}

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  time: string;
}

interface SidebarNavProps {
  /** Onboarding steps with completion status */
  onboardingSteps?: OnboardingStep[];
  /** Number of completed onboarding steps (0-4) */
  onboardingProgress?: number;
  /** Show advanced features or hide them */
  showAdvanced?: boolean;
  /** Use framework-based navigation (Phase 2) */
  useFrameworkNav?: boolean;
  /** Badge counts for navigation items */
  badges?: {
    thirdParties?: number;
    documents?: number;
    incidents?: number;
  };
}

// ============================================================================
// New Navigation Configuration (UI/UX Redesign)
// ============================================================================

// Home - Single unified dashboard
const HOME_NAV: NavItem = {
  name: 'Home',
  href: '/dashboard',
  icon: Home,
};

// Manage section - Day-to-day operations
const MANAGE_NAV: NavItem[] = [
  { name: 'Third Parties', href: '/vendors', icon: Building2 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
];

// Compliance section - Regulatory requirements
const COMPLIANCE_NAV: NavItem[] = [
  { name: 'Register of Information', href: '/roi', icon: Database },
  { name: 'Risk Register', href: '/risks', icon: ClipboardList },
  { name: 'Resilience Testing', href: '/testing', icon: FlaskConical },
];

// Insights section - Analytics (collapsed by default)
const INSIGHTS_NAV: NavItem[] = [
  { name: 'Compliance Trends', href: '/compliance/trends', icon: BarChart3 },
  { name: 'Concentration Risk', href: '/concentration', icon: Network },
  { name: 'Framework Coverage', href: '/frameworks', icon: Layers },
];

// Framework-specific navigation (Phase 2)
const FRAMEWORK_NAV: Record<FrameworkCode, NavItem[]> = {
  nis2: [
    { name: 'NIS2 Overview', href: '/nis2', icon: Shield },
    { name: 'Risk Register', href: '/nis2/risk-register', icon: ClipboardList },
    { name: 'Risk Heat Map', href: '/nis2/heat-map', icon: PieChart },
    { name: 'Gap Analysis', href: '/nis2/gaps', icon: AlertTriangle },
  ],
  dora: [
    { name: 'DORA Overview', href: '/dora', icon: Shield },
    { name: 'Register of Information', href: '/roi', icon: Database, module: 'roi' },
    { name: 'ICT Incidents', href: '/incidents', icon: AlertCircle, module: 'incidents' },
    { name: 'Resilience Testing', href: '/testing', icon: FlaskConical, module: 'testing' },
    { name: 'Concentration Risk', href: '/concentration', icon: PieChart, module: 'tprm' },
  ],
  gdpr: [
    { name: 'GDPR Overview', href: '/gdpr', icon: Shield },
    { name: 'DPIA Tool', href: '/gdpr/dpia', icon: ClipboardCheck, module: 'dpia' },
    { name: 'Breach Log', href: '/gdpr/breaches', icon: AlertOctagon, module: 'breach' },
  ],
  iso27001: [
    { name: 'ISMS Overview', href: '/iso27001', icon: Shield },
    { name: 'Statement of Applicability', href: '/iso27001/soa', icon: FileCheck, module: 'soa' },
    { name: 'Audit Tracker', href: '/iso27001/audits', icon: ClipboardList, module: 'audit' },
  ],
};

const SETTINGS_NAV: NavItem = {
  name: 'Settings',
  href: '/settings',
  icon: Settings,
};

// ============================================================================
// Components
// ============================================================================

function NavLink({
  item,
  isActive,
  isLocked = false,
}: {
  item: NavItem;
  isActive: boolean;
  isLocked?: boolean;
}) {
  const Icon = item.icon;

  if (isLocked) {
    return (
      <div
        className={cn(
          'nav-item opacity-50 cursor-not-allowed',
          'flex items-center gap-2'
        )}
        title={`Upgrade to unlock ${item.name}`}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1 text-sm">{item.name}</span>
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }

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
      {item.badge !== undefined && Number(item.badge) > 0 && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary min-w-[20px] text-center">
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
  frameworkCode,
  checkModuleAccess,
}: {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
  collapsible?: boolean;
  currentPath: string;
  frameworkCode?: FrameworkCode;
  checkModuleAccess?: (framework: FrameworkCode, module: FrameworkModule) => boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasActiveItem = items.some(item => currentPath.startsWith(item.href));

  // Auto-open if an item in this group is active
  const effectiveOpen = isOpen || hasActiveItem;

  // Get framework color if applicable
  const frameworkColor = frameworkCode ? FRAMEWORK_COLORS[frameworkCode] : undefined;

  if (!collapsible) {
    return (
      <div className="space-y-1">
        <div className="px-3 py-2 flex items-center gap-2">
          {frameworkColor && (
            <span className={cn('w-2 h-2 rounded-full', frameworkColor)} />
          )}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        {items.map((item) => {
          const isLocked = item.module && frameworkCode && checkModuleAccess
            ? !checkModuleAccess(frameworkCode, item.module)
            : false;

          return (
            <NavLink
              key={item.href}
              item={item}
              isActive={currentPath.startsWith(item.href)}
              isLocked={isLocked}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          {frameworkColor && (
            <span className={cn('w-2 h-2 rounded-full', frameworkColor)} />
          )}
          {title}
        </span>
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
        {items.map((item) => {
          const isLocked = item.module && frameworkCode && checkModuleAccess
            ? !checkModuleAccess(frameworkCode, item.module)
            : false;

          return (
            <NavLink
              key={item.href}
              item={item}
              isActive={currentPath.startsWith(item.href)}
              isLocked={isLocked}
            />
          );
        })}
      </div>
    </div>
  );
}

function OnboardingProgress({
  steps,
  completed,
  total
}: {
  steps?: OnboardingStep[];
  completed: number;
  total: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (completed >= total) return null;

  return (
    <div className="mx-3 mb-2 rounded-lg bg-primary/5 border border-primary/10 overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-3 flex items-center justify-between hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary">Setup Progress</span>
          <span className="text-xs text-muted-foreground">{completed}/{total}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      {/* Progress Bar */}
      <div className="px-3 pb-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Expandable Steps List */}
      {isExpanded && steps && steps.length > 0 && (
        <div className="px-2 pb-2 space-y-1">
          {steps.map((step, index) => {
            const isNext = !step.done && steps.slice(0, index).every(s => s.done);

            return (
              <Link
                key={step.id}
                href={step.href}
                className={cn(
                  'group flex items-start gap-2 px-2 py-2 rounded-md transition-colors',
                  step.done
                    ? 'opacity-60 hover:opacity-80'
                    : isNext
                      ? 'bg-primary/10 hover:bg-primary/15'
                      : 'hover:bg-muted/50'
                )}
              >
                {/* Status Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : isNext ? (
                    <Circle className="h-4 w-4 text-primary fill-primary/20" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'text-xs font-medium truncate',
                      step.done ? 'line-through text-muted-foreground' : '',
                      isNext ? 'text-primary' : ''
                    )}>
                      {step.label}
                    </span>
                    {!step.done && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {step.time}
                      </span>
                    )}
                  </div>
                  {isNext && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Arrow for next step */}
                {isNext && (
                  <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SidebarNav({
  onboardingSteps,
  onboardingProgress = 0,
  showAdvanced = true,
  useFrameworkNav = false,
  badges,
}: SidebarNavProps) {
  const pathname = usePathname();
  const completed = onboardingSteps?.filter(s => s.done).length ?? onboardingProgress;
  const isNewUser = completed < 2;

  // Framework nav component renders separately to avoid conditional hook
  if (useFrameworkNav) {
    return (
      <FrameworkSidebarNav
        onboardingSteps={onboardingSteps}
        isNewUser={isNewUser}
        completed={completed}
        pathname={pathname}
        badges={badges}
      />
    );
  }

  // New unified navigation (default)
  return (
    <UnifiedSidebarNav
      onboardingSteps={onboardingSteps}
      isNewUser={isNewUser}
      completed={completed}
      pathname={pathname}
      showAdvanced={showAdvanced}
      badges={badges}
    />
  );
}

// ============================================================================
// Unified Sidebar (New UI/UX Design)
// ============================================================================

function UnifiedSidebarNav({
  onboardingSteps,
  isNewUser,
  completed,
  pathname,
  showAdvanced = true,
  badges,
}: {
  onboardingSteps?: OnboardingStep[];
  isNewUser: boolean;
  completed: number;
  pathname: string;
  showAdvanced?: boolean;
  badges?: SidebarNavProps['badges'];
}) {
  // Apply badges to nav items
  const manageNavWithBadges = MANAGE_NAV.map(item => {
    if (item.href === '/vendors' && badges?.thirdParties) {
      return { ...item, badge: badges.thirdParties };
    }
    if (item.href === '/documents' && badges?.documents) {
      return { ...item, badge: badges.documents };
    }
    if (item.href === '/incidents' && badges?.incidents) {
      return { ...item, badge: badges.incidents };
    }
    return item;
  });

  return (
    <nav className="flex-1 p-4 space-y-4">
      {/* Onboarding Progress (only for new users) */}
      {isNewUser && (
        <OnboardingProgress
          steps={onboardingSteps}
          completed={completed}
          total={onboardingSteps?.length ?? 4}
        />
      )}

      {/* Home - Single item, no group */}
      <div className="space-y-1">
        <NavLink
          item={HOME_NAV}
          isActive={pathname === '/dashboard' || pathname === '/'}
        />
      </div>

      {/* Manage Section */}
      <CollapsibleGroup
        title="Manage"
        items={manageNavWithBadges}
        defaultOpen={true}
        collapsible={false}
        currentPath={pathname}
      />

      {/* Compliance Section */}
      <CollapsibleGroup
        title="Compliance"
        items={COMPLIANCE_NAV}
        defaultOpen={true}
        collapsible={false}
        currentPath={pathname}
      />

      {/* Insights Section - Collapsed by default for users < 10 vendors */}
      {showAdvanced && (
        <CollapsibleGroup
          title="Insights"
          items={INSIGHTS_NAV}
          defaultOpen={!isNewUser}
          collapsible={true}
          currentPath={pathname}
        />
      )}

      {/* Settings */}
      <div className="pt-2 border-t border-sidebar-border">
        <NavLink
          item={SETTINGS_NAV}
          isActive={pathname.startsWith('/settings')}
        />
      </div>
    </nav>
  );
}

// ============================================================================
// Framework-Aware Sidebar (uses FrameworkProvider)
// ============================================================================

function FrameworkSidebarNav({
  onboardingSteps,
  isNewUser,
  completed,
  pathname,
  badges,
}: {
  onboardingSteps?: OnboardingStep[];
  isNewUser: boolean;
  completed: number;
  pathname: string;
  badges?: SidebarNavProps['badges'];
}) {
  const { enabledFrameworks, hasModuleAccess } = useFramework();

  // Apply badges to manage nav
  const manageNavWithBadges = MANAGE_NAV.map(item => {
    if (item.href === '/vendors' && badges?.thirdParties) {
      return { ...item, badge: badges.thirdParties };
    }
    if (item.href === '/documents' && badges?.documents) {
      return { ...item, badge: badges.documents };
    }
    if (item.href === '/incidents' && badges?.incidents) {
      return { ...item, badge: badges.incidents };
    }
    return item;
  });

  return (
    <nav className="flex-1 p-4 space-y-4">
      {/* Onboarding Progress (only for new users) */}
      {isNewUser && (
        <OnboardingProgress
          steps={onboardingSteps}
          completed={completed}
          total={onboardingSteps?.length ?? 4}
        />
      )}

      {/* Home */}
      <div className="space-y-1">
        <NavLink
          item={HOME_NAV}
          isActive={pathname === '/dashboard' || pathname === '/'}
        />
      </div>

      {/* Manage Section */}
      <CollapsibleGroup
        title="Manage"
        items={manageNavWithBadges}
        defaultOpen={true}
        collapsible={false}
        currentPath={pathname}
      />

      {/* Framework-specific sections */}
      {enabledFrameworks.map((fw) => (
        <CollapsibleGroup
          key={fw}
          title={FRAMEWORK_DISPLAY_NAMES[fw]}
          items={FRAMEWORK_NAV[fw] || []}
          defaultOpen={true}
          collapsible={true}
          currentPath={pathname}
          frameworkCode={fw}
          checkModuleAccess={hasModuleAccess}
        />
      ))}

      {/* Insights Section */}
      <CollapsibleGroup
        title="Insights"
        items={INSIGHTS_NAV}
        defaultOpen={!isNewUser}
        collapsible={true}
        currentPath={pathname}
      />

      {/* Settings */}
      <div className="pt-2 border-t border-sidebar-border">
        <NavLink
          item={SETTINGS_NAV}
          isActive={pathname.startsWith('/settings')}
        />
      </div>
    </nav>
  );
}
