import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    name: 'Documents',
    value: '0',
    description: 'Uploaded files',
    icon: FileCheck,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    name: 'Open Incidents',
    value: '0',
    description: 'Requiring action',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    name: 'Compliance Score',
    value: '—',
    description: 'Overall status',
    icon: TrendingUp,
    color: 'text-primary',
    bg: 'bg-accent',
  },
];

const setupSteps = [
  { step: 1, title: 'Add your first ICT third-party provider', href: '/vendors/new', completed: false },
  { step: 2, title: 'Upload vendor contracts and certifications', href: '/documents', completed: false },
  { step: 3, title: 'Generate your Register of Information', href: '/roi', completed: false },
  { step: 4, title: 'Set up incident reporting workflows', href: '/incidents', completed: false },
];

const timeline = [
  {
    date: 'January 17, 2025',
    title: 'DORA enters into force',
    status: 'completed',
    icon: CheckCircle2,
  },
  {
    date: 'April 30, 2025',
    title: 'First RoI submission deadline',
    status: 'upcoming',
    icon: Calendar,
  },
  {
    date: 'Ongoing',
    title: 'Incident reporting within 4 hours',
    status: 'ongoing',
    icon: Clock,
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8 stagger">
      {/* Welcome section */}
      <div>
        <h1>
          Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s an overview of your DORA compliance status.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="stat-card card-elevated">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label mt-1">{stat.name}</div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-premium p-6">
          <div className="mb-6">
            <h3>Get Started</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Complete these steps to set up your DORA compliance program
            </p>
          </div>
          <ul className="space-y-4">
            {setupSteps.map((item) => (
              <li key={item.step}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className={`
                    h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
                    ${item.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
                    }
                  `}>
                    {item.completed ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.title}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-premium p-6">
          <div className="mb-6">
            <h3>DORA Compliance Timeline</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Key dates and deadlines for your compliance journey
            </p>
          </div>
          <div className="space-y-4">
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4">
                  <div className={`
                    mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                    ${item.status === 'completed'
                      ? 'bg-success/10 text-success'
                      : item.status === 'upcoming'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.date}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.title}
                    </p>
                  </div>
                  {item.status === 'completed' && (
                    <span className="badge badge-success">Complete</span>
                  )}
                  {item.status === 'upcoming' && (
                    <span className="badge badge-primary">Upcoming</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/settings/compliance">
                View full compliance calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
