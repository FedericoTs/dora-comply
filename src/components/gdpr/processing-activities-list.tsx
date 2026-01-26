'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
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
import type { ProcessingActivity, ActivityStatus } from '@/lib/gdpr/types';
import { LAWFUL_BASIS_LABELS, ACTIVITY_STATUS_LABELS } from '@/lib/gdpr/types';
import { CreateProcessingActivityDialog } from './create-processing-activity-dialog';

interface ProcessingActivitiesListProps {
  organizationId: string;
}

const STATUS_COLORS: Record<ActivityStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  under_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  terminated: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function ProcessingActivitiesList({ organizationId }: ProcessingActivitiesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(searchParams.get('action') === 'new');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/data-protection/processing-activities?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [organizationId, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this processing activity?')) return;

    try {
      const res = await fetch(`/api/data-protection/processing-activities/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchActivities();
      }
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Processing Activities</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start documenting your processing activities to comply with GDPR Article 30.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onDelete={() => handleDelete(activity.id)}
              onEdit={() => router.push(`/data-protection/processing-activities/${activity.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateProcessingActivityDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open && searchParams.get('action') === 'new') {
            router.replace('/data-protection/processing-activities');
          }
        }}
        onSuccess={() => {
          fetchActivities();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

function ActivityCard({
  activity,
  onDelete,
  onEdit,
}: {
  activity: ProcessingActivity;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <Card className="card-elevated hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium truncate">{activity.name}</h3>
                {activity.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {activity.description}
                  </p>
                )}
              </div>
              <Badge className={cn('text-xs', STATUS_COLORS[activity.status])}>
                {ACTIVITY_STATUS_LABELS[activity.status]}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {LAWFUL_BASIS_LABELS[activity.lawful_basis]?.split(' ')[0] || activity.lawful_basis}
              </span>

              {activity.involves_special_category && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Special Category
                </span>
              )}

              {activity.involves_international_transfer && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Globe className="h-3 w-3" />
                  Int&apos;l Transfer
                </span>
              )}

              {activity.requires_dpia && (
                <span className="flex items-center gap-1 text-purple-600">
                  <FileText className="h-3 w-3" />
                  DPIA Required
                </span>
              )}

              {activity.department && (
                <span>{activity.department}</span>
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
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
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
