import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  AlertTriangle,
  Settings,
  LogOut,
  Network,
  FlaskConical,
  BarChart3,
  Layers,
} from 'lucide-react';
import { ThemeToggleSimple } from '@/components/ui/theme-toggle';
import { NavigationProviders } from '@/components/navigation';
import { CopilotChat } from '@/components/copilot';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { checkAuthStatus, logout } from '@/lib/auth';
import { ProductTour } from '@/components/onboarding/product-tour';
import { GlobalSearch } from '@/components/search/global-search';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Concentration Risk', href: '/concentration', icon: Network },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Register of Information', href: '/roi', icon: BookOpen },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Resilience Testing', href: '/testing', icon: FlaskConical },
  { name: 'Compliance Trends', href: '/compliance/trends', icon: BarChart3 },
  { name: 'Frameworks', href: '/frameworks', icon: Layers },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, needsOnboarding, user } = await checkAuthStatus();

  if (!isAuthenticated) {
    redirect('/login');
  }

  if (needsOnboarding) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar - sticky, doesn't scroll with content */}
        <aside data-tour="sidebar" className="w-64 border-r border-border bg-sidebar flex flex-col sticky top-0 h-screen overflow-y-auto">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">DORA Comply</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-item"
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-sm">{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-6 pb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                Settings
              </span>
            </div>
            {secondaryNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="nav-item"
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.fullName?.split(' ').map(w => w[0]).join('') || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <form action={logout}>
                <button type="submit" className="icon-btn" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Top Bar */}
          <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <ThemeToggleSimple />
            </div>
          </header>

          {/* Page Content */}
          <div className="p-8">
            <NavigationProviders>
              {children}
            </NavigationProviders>
          </div>
        </main>

        {/* AI Compliance Copilot */}
        <div data-tour="copilot">
          <CopilotChat />
        </div>

        {/* Product Tour - shows on first visit */}
        <ProductTour />
      </div>
    </div>
  );
}
