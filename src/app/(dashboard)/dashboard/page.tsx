import { Metadata } from 'next';
import {
  Building2,
  FileCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance dashboard',
};

const stats = [
  {
    name: 'ICT Providers',
    value: '0',
    description: 'Third-party vendors',
    icon: Building2,
    trend: null,
  },
  {
    name: 'Documents',
    value: '0',
    description: 'Uploaded files',
    icon: FileCheck,
    trend: null,
  },
  {
    name: 'Open Incidents',
    value: '0',
    description: 'Requiring action',
    icon: AlertTriangle,
    trend: null,
  },
  {
    name: 'Compliance Score',
    value: '—',
    description: 'Overall status',
    icon: TrendingUp,
    trend: null,
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your DORA compliance status.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Complete these steps to set up your DORA compliance program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center text-xs">
                  1
                </div>
                <span className="text-sm">Add your first ICT third-party provider</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center text-xs">
                  2
                </div>
                <span className="text-sm">Upload vendor contracts and certifications</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center text-xs">
                  3
                </div>
                <span className="text-sm">Generate your Register of Information</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full border-2 border-muted flex items-center justify-center text-xs">
                  4
                </div>
                <span className="text-sm">Set up incident reporting workflows</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DORA Compliance Timeline</CardTitle>
            <CardDescription>
              Key dates and deadlines for your compliance journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">January 17, 2025</p>
                  <p className="text-xs text-muted-foreground">
                    DORA enters into force
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">April 30, 2025</p>
                  <p className="text-xs text-muted-foreground">
                    First RoI submission deadline
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 mt-2 rounded-full bg-muted" />
                <div>
                  <p className="text-sm font-medium">Ongoing</p>
                  <p className="text-xs text-muted-foreground">
                    Incident reporting within 4 hours
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
