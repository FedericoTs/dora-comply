import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import { checkAuthStatus, logout } from '@/lib/auth';
import { FrameworkProvider } from '@/lib/context';
import type { OrganizationLicensing } from '@/lib/licensing/types';

// MINIMAL LAYOUT FOR DEBUGGING - stripped down to isolate React error #310
// Components temporarily disabled:
// - GlobalSearch (uses cmdk)
// - NotificationDropdown
// - CopilotChat
// - ProductTour
// - FrameworkSelector/Dropdown
// - NavigationProviders (uses useSearchParams)
// - SidebarNav with useFrameworkNav

// Default licensing with STATIC dates
const STATIC_DATE = "2026-01-01T00:00:00.000Z";

const DEFAULT_LICENSING: OrganizationLicensing = {
  license_tier: "professional",
  licensed_frameworks: ["nis2", "dora"],
  trial_ends_at: null,
  billing_status: "active",
  entitlements: {
    nis2: {
      id: "default-nis2",
      organization_id: "",
      framework: "nis2",
      enabled: true,
      activated_at: STATIC_DATE,
      expires_at: null,
      modules_enabled: { dashboard: true, scoring: true, gaps: true, reports: true },
      created_at: STATIC_DATE,
      updated_at: STATIC_DATE,
    },
    dora: {
      id: "default-dora",
      organization_id: "",
      framework: "dora",
      enabled: true,
      activated_at: STATIC_DATE,
      expires_at: null,
      modules_enabled: { dashboard: true, scoring: true, gaps: true, roi: true, incidents: true, testing: true, tprm: true, reports: true },
      created_at: STATIC_DATE,
      updated_at: STATIC_DATE,
    },
    gdpr: {
      id: "default-gdpr",
      organization_id: "",
      framework: "gdpr",
      enabled: false,
      activated_at: STATIC_DATE,
      expires_at: null,
      modules_enabled: { dashboard: false, scoring: false, gaps: false, reports: false },
      created_at: STATIC_DATE,
      updated_at: STATIC_DATE,
    },
    iso27001: {
      id: "default-iso27001",
      organization_id: "",
      framework: "iso27001",
      enabled: false,
      activated_at: STATIC_DATE,
      expires_at: null,
      modules_enabled: { dashboard: false, scoring: false, gaps: false, reports: false },
      created_at: STATIC_DATE,
      updated_at: STATIC_DATE,
    },
  },
};

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

  // Use default licensing to avoid any database issues
  const licensing = DEFAULT_LICENSING;

  return (
    <FrameworkProvider initialLicensing={licensing}>
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen">
          {/* MINIMAL Sidebar - no complex components */}
          <aside className="hidden lg:flex w-64 border-r border-border bg-sidebar flex-col sticky top-0 h-screen overflow-y-auto">
            {/* Logo */}
            <div className="h-16 px-6 flex items-center border-b border-sidebar-border">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg tracking-tight">DORA Comply</span>
              </Link>
            </div>

            {/* MINIMAL Navigation - just static links */}
            <nav className="flex-1 p-4 space-y-2">
              <Link href="/dashboard" className="nav-item">Dashboard</Link>
              <Link href="/vendors" className="nav-item">Third Parties</Link>
              <Link href="/documents" className="nav-item">Documents</Link>
              <Link href="/incidents" className="nav-item">Incidents</Link>
              <Link href="/roi" className="nav-item">Register of Information</Link>
              <Link href="/settings" className="nav-item">Settings</Link>
            </nav>

            {/* User - minimal */}
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

          {/* Main Content - MINIMAL header */}
          <main className="flex-1 overflow-auto">
            {/* MINIMAL Top Bar - no GlobalSearch, no FrameworkSelector, no NotificationDropdown */}
            <header className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-border bg-background sticky top-0 z-10">
              <div className="flex items-center gap-3">
                {/* Mobile logo only */}
                <Link href="/dashboard" className="flex lg:hidden items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-base tracking-tight">DORA Comply</span>
                </Link>
                {/* DEBUG indicator */}
                <span className="hidden sm:inline text-xs text-amber-500 font-mono">
                  [DEBUG MODE - Minimal Layout]
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {user?.email}
              </div>
            </header>

            {/* Page Content - NO NavigationProviders wrapper */}
            <div className="p-4 lg:p-8">
              {children}
            </div>
          </main>

          {/* NO CopilotChat */}
          {/* NO ProductTour */}
        </div>
      </div>
    </FrameworkProvider>
  );
}
