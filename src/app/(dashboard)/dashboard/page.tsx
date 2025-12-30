import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Zap,
  Plus,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.fullName?.split(' ')[0] || '';

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 animate-in">
        <div>
          <h1 className="mb-1">Good morning{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your compliance program today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <Link href="/vendors/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add vendor
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8 stagger">
        <StatCard
          label="Total Vendors"
          value="0"
          change="+0"
          trend="up"
          period="vs last month"
        />
        <StatCard
          label="RoI Readiness"
          value="0%"
          change="+0%"
          trend="up"
          period="vs last week"
        />
        <StatCard
          label="Critical Risks"
          value="0"
          change="0"
          trend="down"
          period="from yesterday"
        />
        <StatCard
          label="Days to Deadline"
          value="121"
          subtitle="April 30, 2025"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 card-premium p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3>Recent Activity</h3>
            <button className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-0">
            <ActivityItem
              title="Welcome to DORA Comply!"
              description="Get started by adding your first vendor"
              time="Just now"
              type="info"
            />
            <ActivityItem
              title="Complete your organization setup"
              description="Add more details to your profile"
              time="Today"
              type="info"
            />
          </div>
          {/* Empty state */}
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Add vendors to see activity here</p>
          </div>
        </div>

        {/* Deadline Card */}
        <div className="card-premium p-6 animate-slide-up">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">RoI Submission</span>
          </div>
          <div className="mb-6">
            <div className="text-5xl font-semibold tracking-tight mb-1">121</div>
            <div className="text-muted-foreground">days remaining</div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '0%' }} />
            </div>
          </div>
          <div className="p-4 rounded-lg bg-accent">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Get started</p>
                <p className="text-xs text-muted-foreground">
                  Add your first vendor to begin tracking progress.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vendors by Risk */}
        <div className="card-premium p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3>Vendors by Risk</h3>
            <button className="icon-btn">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <RiskRow label="Critical" count={0} total={1} color="bg-error" />
            <RiskRow label="High" count={0} total={1} color="bg-warning" />
            <RiskRow label="Medium" count={0} total={1} color="bg-chart-5" />
            <RiskRow label="Low" count={0} total={1} color="bg-success" />
          </div>
        </div>

        {/* Getting Started */}
        <div className="col-span-2 card-premium p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3>Getting Started</h3>
            <span className="badge badge-default">4 steps</span>
          </div>
          <div className="space-y-4">
            <StepItem
              step={1}
              title="Add your first ICT third-party provider"
              href="/vendors/new"
              completed={false}
            />
            <StepItem
              step={2}
              title="Upload vendor contracts and certifications"
              href="/documents"
              completed={false}
            />
            <StepItem
              step={3}
              title="Generate your Register of Information"
              href="/roi"
              completed={false}
            />
            <StepItem
              step={4}
              title="Set up incident reporting workflows"
              href="/incidents"
              completed={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================
   COMPONENTS
   ============================================ */

function StatCard({
  label,
  value,
  change,
  trend,
  period,
  subtitle,
}: {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  period?: string;
  subtitle?: string;
}) {
  return (
    <div className="stat-card">
      <p className="stat-label mb-2">{label}</p>
      <p className="stat-value">{value}</p>
      {change && (
        <div className="flex items-center gap-1.5 mt-2">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-success" />
          )}
          <span className="text-sm text-success font-medium">{change}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
      )}
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}

function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}) {
  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    info: FileText,
  };
  const colors = {
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
  };
  const Icon = icons[type];

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className={colors[type]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-sm text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}

function RiskRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StepItem({
  step,
  title,
  href,
  completed,
}: {
  step: number;
  title: string;
  href: string;
  completed: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div
        className={`
          h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
          ${completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
          }
        `}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <span className="flex-1 text-sm font-medium">{title}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
