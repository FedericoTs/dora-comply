import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance command center',
};

/**
 * ULTRA-MINIMAL DASHBOARD FOR DEBUGGING
 *
 * This version has NO database calls, NO complex components.
 * If this fails, the issue is in the route or layout.
 * If this works, we can add back functionality piece by piece.
 */
export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Debug mode - minimal dashboard
        </p>
      </div>

      <div className="p-6 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="font-semibold text-amber-800 dark:text-amber-200">
          DEBUG: Ultra-Minimal Dashboard
        </p>
        <p className="text-amber-700 dark:text-amber-300 text-sm mt-2">
          This is a stripped-down version with no database calls.
          If you see this, the dashboard route works!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">DORA Score</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Third Parties</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Risk Exposure</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground">Days to Deadline</p>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">Next steps:</p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>1. If this page loads, the route works</li>
          <li>2. We can then add back database queries one by one</li>
          <li>3. Each query will be wrapped in try-catch</li>
        </ul>
      </div>
    </div>
  );
}
