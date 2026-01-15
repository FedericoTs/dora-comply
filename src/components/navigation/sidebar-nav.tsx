'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
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
  Circle,
  Clock,
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
}: SidebarNavProps) {
  const pathname = usePathname();
  const completed = onboardingSteps?.filter(s => s.done).length ?? onboardingProgress;
  const isNewUser = completed < 2;

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
