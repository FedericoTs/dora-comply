'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Menu,
  Shield,
  LogOut,
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  AlertTriangle,
  Settings,
  Network,
  FlaskConical,
  BarChart3,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Navigation Configuration (matches sidebar-nav.tsx)
// ============================================================================

const CORE_NAV = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Register of Information', href: '/roi', icon: BookOpen },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
];

const ADVANCED_NAV = [
  { name: 'Concentration Risk', href: '/concentration', icon: Network },
  { name: 'Resilience Testing', href: '/testing', icon: FlaskConical },
  { name: 'Compliance Trends', href: '/compliance/trends', icon: BarChart3 },
  { name: 'Frameworks', href: '/frameworks', icon: Layers },
];

const SETTINGS_NAV = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

// ============================================================================
// Types
// ============================================================================

interface MobileSidebarProps {
  user: {
    fullName?: string | null;
    email?: string | null;
  } | null;
  logoutAction: () => Promise<void>;
}

// ============================================================================
// Component
// ============================================================================

export function MobileSidebar({ user, logoutAction }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Auto-open advanced if any item is active
  const hasActiveAdvanced = ADVANCED_NAV.some(item => isActive(item.href));

  const NavLink = ({ item, onClick }: { item: typeof CORE_NAV[0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="flex-1">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-11 w-11"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="h-16 px-6 flex flex-row items-center border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <SheetTitle className="font-semibold text-lg tracking-tight">DORA Comply</SheetTitle>
            </Link>
          </SheetHeader>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Core Navigation */}
            <div className="space-y-1">
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Core
                </span>
              </div>
              {CORE_NAV.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setOpen(false)} />
              ))}
            </div>

            {/* Advanced Navigation - Collapsible */}
            <div className="space-y-1">
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>Advanced</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    (advancedOpen || hasActiveAdvanced) ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </button>
              <div
                className={cn(
                  'space-y-1 overflow-hidden transition-all duration-200',
                  (advancedOpen || hasActiveAdvanced) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                {ADVANCED_NAV.map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setOpen(false)} />
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="pt-2 border-t border-border">
              {SETTINGS_NAV.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setOpen(false)} />
              ))}
            </div>
          </nav>

          {/* User */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.fullName?.split(' ').map(w => w[0]).join('') || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="icon" className="h-11 w-11" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
