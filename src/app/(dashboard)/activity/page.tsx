import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  Settings,
  Inbox,
  Shield,
  Download,
  Filter,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getAuditTrail,
  getAuditSummary,
  formatActivityTitle,
  formatRelativeTime,
  mapActivityType,
  type ActivityLogEntry,
  type AuditEntityType,
} from '@/lib/activity/queries';

export const metadata: Metadata = {
  title: 'Activity Log | DORA Comply',
  description: 'View all recent activity in your organization',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    entityType?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const entityType = params.entityType as AuditEntityType | undefined;
  const search = params.search;
  const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
  const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

  // Fetch data with filters
  const [auditResult, summary] = await Promise.all([
    getAuditTrail(
      { entityType, search, dateFrom, dateTo },
      page,
      25
    ),
    getAuditSummary(30),
  ]);

  const { entries: activities, totalCount, pageCount, currentPage } = auditResult;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Activity Log</h1>
            <p className="text-muted-foreground text-sm">
              {totalCount} events in the last 30 days
            </p>
          </div>
        </div>
        <a
          href={`/api/activity/export?${new URLSearchParams({
            ...(entityType && { entityType }),
            ...(search && { search }),
            ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
            ...(dateTo && { dateTo: dateTo.toISOString() }),
          }).toString()}`}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total Events"
          value={summary.totalEvents}
          icon={FileText}
        />
        <SummaryCard
          label="Security Events"
          value={summary.securityEvents}
          icon={Shield}
          color="text-primary"
        />
        <SummaryCard
          label="Compliance Events"
          value={summary.complianceEvents}
          icon={BookOpen}
          color="text-success"
        />
        <SummaryCard
          label="High Priority"
          value={summary.recentHighPriority.length}
          icon={AlertTriangle}
          color="text-warning"
        />
      </div>

      {/* Filters */}
      <Suspense fallback={<FiltersSkeleton />}>
        <ActivityFilters
          currentEntityType={entityType}
          currentSearch={search}
          currentDateFrom={dateFrom?.toISOString().split('T')[0]}
          currentDateTo={dateTo?.toISOString().split('T')[0]}
        />
      </Suspense>

      {/* Activity List */}
      <div className="card-premium divide-y divide-border">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No activity found</h3>
            <p className="text-sm text-muted-foreground">
              {search || entityType
                ? 'Try adjusting your filters'
                : 'Start by adding vendors, uploading documents, or creating incidents'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pageCount}
          baseUrl="/activity"
          searchParams={{
            ...(entityType && { entityType }),
            ...(search && { search }),
            ...(dateFrom && { dateFrom: dateFrom.toISOString().split('T')[0] }),
            ...(dateTo && { dateTo: dateTo.toISOString().split('T')[0] }),
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function SummaryCard({
  label,
  value,
  icon: Icon,
  color = 'text-muted-foreground',
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  color?: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityFilters({
  currentEntityType,
  currentSearch,
  currentDateFrom,
  currentDateTo,
}: {
  currentEntityType?: string;
  currentSearch?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}) {
  const entityTypes = [
    { value: '', label: 'All Types' },
    { value: 'vendor', label: 'Vendors' },
    { value: 'document', label: 'Documents' },
    { value: 'incident', label: 'Incidents' },
    { value: 'auth', label: 'Security' },
    { value: 'roi', label: 'RoI' },
    { value: 'testing', label: 'Testing' },
    { value: 'compliance', label: 'Compliance' },
  ];

  return (
    <form method="GET" className="card-elevated p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="Search activities..."
            defaultValue={currentSearch}
            className="input-premium pl-9 w-full"
          />
        </div>

        {/* Entity Type */}
        <select
          name="entityType"
          defaultValue={currentEntityType || ''}
          className="input-premium w-full"
        >
          {entityTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Date From */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            name="dateFrom"
            defaultValue={currentDateFrom}
            className="input-premium pl-9 w-full"
          />
        </div>

        {/* Date To */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              name="dateTo"
              defaultValue={currentDateTo}
              className="input-premium pl-9 w-full"
            />
          </div>
          <button type="submit" className="btn-primary px-4">
            Apply
          </button>
        </div>
      </div>
    </form>
  );
}

function FiltersSkeleton() {
  return (
    <div className="card-elevated p-4 mb-6 animate-pulse">
      <div className="h-10 bg-muted rounded" />
    </div>
  );
}

function ActivityRow({ activity }: { activity: ActivityLogEntry }) {
  const type = mapActivityType(activity.action);
  const title = formatActivityTitle(activity.action, activity.entity_type);
  const time = formatRelativeTime(activity.created_at);

  const iconConfig = {
    success: { icon: CheckCircle2, class: 'text-success bg-success/10' },
    warning: { icon: AlertCircle, class: 'text-warning bg-warning/10' },
    info: { icon: FileText, class: 'text-info bg-info/10' },
    security: { icon: Shield, class: 'text-primary bg-primary/10' },
  };

  const entityIconMap: Record<string, typeof Building2> = {
    vendor: Building2,
    incident: AlertTriangle,
    document: FileText,
    roi: BookOpen,
    testing: FlaskConical,
    user: Settings,
    auth: Shield,
    compliance: BookOpen,
    organization: Building2,
    contract: FileText,
  };

  const EntityIcon = entityIconMap[activity.entity_type] || FileText;
  const StatusIcon = iconConfig[type].icon;
  const iconClass = iconConfig[type].class;

  // Build link based on entity type
  const getEntityLink = (): string | null => {
    if (!activity.entity_id) return null;

    switch (activity.entity_type) {
      case 'vendor':
        return `/vendors/${activity.entity_id}`;
      case 'incident':
        return `/incidents/${activity.entity_id}`;
      case 'document':
        return `/documents/${activity.entity_id}`;
      default:
        return null;
    }
  };

  const entityLink = getEntityLink();

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
      {/* Icon */}
      <div className={`p-2.5 rounded-xl ${iconClass}`}>
        <StatusIcon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{title}</p>
            {activity.entity_name && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <EntityIcon className="h-3.5 w-3.5" />
                {entityLink ? (
                  <Link
                    href={entityLink}
                    className="hover:text-primary hover:underline"
                  >
                    {activity.entity_name}
                  </Link>
                ) : (
                  activity.entity_name
                )}
              </p>
            )}
            {activity.user_email && (
              <p className="text-xs text-muted-foreground mt-1">
                by {activity.user_email}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {time}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(activity.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Additional details if present */}
        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            {Object.entries(activity.details)
              .filter(([key]) => !['user_email', 'timestamp'].includes(key))
              .slice(0, 3)
              .map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span>{String(value)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string>;
}) {
  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...searchParams, page: page.toString() });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 && (
          <Link
            href={buildUrl(currentPage - 1)}
            className="btn-secondary p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        {currentPage < totalPages && (
          <Link
            href={buildUrl(currentPage + 1)}
            className="btn-secondary p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
