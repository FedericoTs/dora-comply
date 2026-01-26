'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Bell,
  CheckCircle2,
  Trash2,
  Eye,
  Building2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BreachWithDetails, BreachStatus, BreachSeverity } from '@/lib/gdpr/types';
import { BREACH_STATUS_LABELS, BREACH_SEVERITY_LABELS } from '@/lib/gdpr/types';
import { CreateBreachDialog } from './create-breach-dialog';

interface BreachesListProps {
  organizationId: string;
}

const STATUS_COLORS: Record<BreachStatus, string> = {
  detected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  investigating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  contained: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  notified_authority: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  notified_subjects: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const SEVERITY_COLORS: Record<BreachSeverity, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export function BreachesList({ organizationId }: BreachesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [breaches, setBreaches] = useState<BreachWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('action') === 'new');

  const fetchBreaches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (severityFilter !== 'all') params.set('severity', severityFilter);

      const res = await fetch(`/api/data-protection/breaches?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBreaches(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreaches();
  }, [organizationId, search, statusFilter, severityFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this breach record?')) return;

    try {
      const res = await fetch(`/api/data-protection/breaches/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBreaches();
      }
    } catch (error) {
      console.error('Failed to delete breach:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search breaches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(BREACH_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {Object.entries(BREACH_SEVERITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Breach
        </Button>
      </div>

      {/* Breaches List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-lg" />
          ))}
        </div>
      ) : breaches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
            <h3 className="text-lg font-medium mb-2">No Data Breaches Recorded</h3>
            <p className="text-sm text-muted-foreground mb-4">
              When a personal data breach occurs, log it here to track notifications and remediation.
            </p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Report Breach
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {breaches.map((breach) => (
            <BreachCard
              key={breach.id}
              breach={breach}
              onDelete={() => handleDelete(breach.id)}
              onView={() => router.push(`/data-protection/breaches/${breach.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateBreachDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open && searchParams.get('action') === 'new') {
            router.replace('/data-protection/breaches');
          }
        }}
        onSuccess={() => {
          fetchBreaches();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function BreachCard({
  breach,
  onDelete,
  onView,
}: {
  breach: BreachWithDetails;
  onDelete: () => void;
  onView: () => void;
}) {
  const isOpen = breach.status !== 'closed';

  return (
    <Card className={cn(
      'card-elevated hover:shadow-md transition-shadow',
      breach.severity === 'critical' && 'border-red-200 dark:border-red-800'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            breach.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          )}>
            <AlertTriangle className={cn(
              'h-5 w-5',
              breach.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
            )} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{breach.reference_number}</span>
                  <Badge className={cn('text-xs', SEVERITY_COLORS[breach.severity])}>
                    {BREACH_SEVERITY_LABELS[breach.severity]}
                  </Badge>
                </div>
                <h3 className="font-medium mt-1">{breach.title}</h3>
                {breach.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {breach.description}
                  </p>
                )}
              </div>
              <Badge className={cn('text-xs', STATUS_COLORS[breach.status])}>
                {BREACH_STATUS_LABELS[breach.status]}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Detected: {new Date(breach.detected_at).toLocaleDateString()}
              </span>

              {breach.estimated_records_affected && (
                <span>~{breach.estimated_records_affected.toLocaleString()} records</span>
              )}

              {breach.notify_authority && (
                <span className={cn(
                  'flex items-center gap-1',
                  breach.authority_notified_at ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  <Bell className="h-3 w-3" />
                  {breach.authority_notified_at ? 'Authority notified' : 'Authority notification required'}
                </span>
              )}

              {breach.vendor && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {breach.vendor.name}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
