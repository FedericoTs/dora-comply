'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  UserCheck,
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
import type { DSRWithDetails, DSRStatus, DSRType } from '@/lib/gdpr/types';
import { DSR_TYPE_LABELS, DSR_STATUS_LABELS } from '@/lib/gdpr/types';
import { CreateDSRDialog } from './create-dsr-dialog';

interface DSRListProps {
  organizationId: string;
}

const STATUS_COLORS: Record<DSRStatus, string> = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  identity_verification: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  extended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  refused: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function DSRList({ organizationId }: DSRListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dsrs, setDsrs] = useState<DSRWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('action') === 'new');

  const fetchDSRs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const res = await fetch(`/api/data-protection/dsr?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDsrs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch DSRs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDSRs();
  }, [organizationId, search, statusFilter, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const res = await fetch(`/api/data-protection/dsr/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDSRs();
      }
    } catch (error) {
      console.error('Failed to delete DSR:', error);
    }
  };

  const isOverdue = (dsr: DSRWithDetails) => {
    const dueDate = dsr.extended_due_date || dsr.response_due_date;
    const today = new Date().toISOString().split('T')[0];
    return ['received', 'identity_verification', 'in_progress', 'extended'].includes(dsr.status) &&
      dueDate < today;
  };

  const getDaysRemaining = (dsr: DSRWithDetails) => {
    const dueDate = new Date(dsr.extended_due_date || dsr.response_due_date);
    const today = new Date();
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
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
              {Object.entries(DSR_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(DSR_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label.split(' ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Request
        </Button>
      </div>

      {/* DSR List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      ) : dsrs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Data Subject Requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Log incoming data subject requests to track their progress and deadlines.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dsrs.map((dsr) => (
            <DSRCard
              key={dsr.id}
              dsr={dsr}
              isOverdue={isOverdue(dsr)}
              daysRemaining={getDaysRemaining(dsr)}
              onDelete={() => handleDelete(dsr.id)}
              onView={() => router.push(`/data-protection/dsr/${dsr.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateDSRDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open && searchParams.get('action') === 'new') {
            router.replace('/data-protection/dsr');
          }
        }}
        onSuccess={() => {
          fetchDSRs();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function DSRCard({
  dsr,
  isOverdue,
  daysRemaining,
  onDelete,
  onView,
}: {
  dsr: DSRWithDetails;
  isOverdue: boolean;
  daysRemaining: number;
  onDelete: () => void;
  onView: () => void;
}) {
  const isOpen = ['received', 'identity_verification', 'in_progress', 'extended'].includes(dsr.status);

  return (
    <Card className={cn(
      'card-elevated hover:shadow-md transition-shadow',
      isOverdue && 'border-red-200 dark:border-red-800'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 p-2 rounded-lg',
            isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'
          )}>
            <Users className={cn('h-5 w-5', isOverdue ? 'text-red-600' : 'text-primary')} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{dsr.reference_number}</span>
                  <Badge variant="outline" className="text-xs">
                    {DSR_TYPE_LABELS[dsr.request_type]?.split(' ')[0] || dsr.request_type}
                  </Badge>
                </div>
                {dsr.data_subject_name && (
                  <p className="text-sm font-medium mt-1">{dsr.data_subject_name}</p>
                )}
                {dsr.data_subject_email && (
                  <p className="text-xs text-muted-foreground">{dsr.data_subject_email}</p>
                )}
              </div>
              <Badge className={cn('text-xs', STATUS_COLORS[dsr.status])}>
                {DSR_STATUS_LABELS[dsr.status]}
              </Badge>
            </div>

            {/* Timeline */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Received: {new Date(dsr.received_at).toLocaleDateString()}
              </span>

              {isOpen && (
                <span className={cn(
                  'flex items-center gap-1',
                  isOverdue ? 'text-red-600' : daysRemaining <= 7 ? 'text-amber-600' : ''
                )}>
                  {isOverdue ? (
                    <>
                      <AlertTriangle className="h-3 w-3" />
                      Overdue by {Math.abs(daysRemaining)} days
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      {daysRemaining} days remaining
                    </>
                  )}
                </span>
              )}

              {dsr.identity_verified && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <UserCheck className="h-3 w-3" />
                  Verified
                </span>
              )}

              {dsr.assigned_to_user && (
                <span>Assigned: {dsr.assigned_to_user.full_name}</span>
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
