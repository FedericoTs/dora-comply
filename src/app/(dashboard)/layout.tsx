import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import { ThemeToggleSimple } from '@/components/ui/theme-toggle';
import { NavigationProviders, MobileSidebar, SidebarNav } from '@/components/navigation';
import { CopilotChat } from '@/components/copilot';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { checkAuthStatus, logout } from '@/lib/auth';
import { ProductTour } from '@/components/onboarding/product-tour';
import { GlobalSearch } from '@/components/search/global-search';
import { getOnboardingProgress } from '@/lib/onboarding/progress';

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

  // Fetch onboarding progress for sidebar
  const onboardingProgress = await getOnboardingProgress();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar - sticky, hidden on mobile */}
        <aside data-tour="sidebar" className="hidden lg:flex w-64 border-r border-border bg-sidebar flex-col sticky top-0 h-screen overflow-y-auto">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg tracking-tight">DORA Comply</span>
            </Link>
          </div>

          {/* Navigation - Grouped with collapsible sections */}
          <SidebarNav onboardingSteps={onboardingProgress.steps} />

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
          <header className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-border bg-background sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <MobileSidebar user={user} logoutAction={logout} />
              {/* Logo on mobile - visible when sidebar is hidden */}
              <Link href="/dashboard" className="flex lg:hidden items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-base tracking-tight">DORA Comply</span>
              </Link>
              <div className="hidden sm:block">
                <GlobalSearch />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <ThemeToggleSimple />
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-8">
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
