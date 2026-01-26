'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Plus,
  Search,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  FileText,
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
import type { DPIA, DPIAStatus, RiskLevel } from '@/lib/gdpr/types';
import { DPIA_STATUS_LABELS, RISK_LEVEL_LABELS } from '@/lib/gdpr/types';

interface DPIAListProps {
  organizationId: string;
}

const STATUS_COLORS: Record<DPIAStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  requires_consultation: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  very_high: 'bg-red-100 text-red-700',
};

export function DPIAList({ organizationId }: DPIAListProps) {
  const router = useRouter();
  const [dpias, setDPIAs] = useState<DPIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchDPIAs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/data-protection/dpias?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDPIAs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch DPIAs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDPIAs();
  }, [organizationId, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this DPIA?')) return;

    try {
      const res = await fetch(`/api/data-protection/dpias/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDPIAs();
      }
    } catch (error) {
      console.error('Failed to delete DPIA:', error);
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
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(DPIA_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button asChild>
          <Link href="/data-protection/dpias/new">
            <Plus className="h-4 w-4 mr-2" />
            New DPIA
          </Link>
        </Button>
      </div>

      {/* DPIAs List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      ) : dpias.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Impact Assessments</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a DPIA when processing is likely to result in high risk to individuals.
            </p>
            <Button asChild>
              <Link href="/data-protection/dpias/new">
                <Plus className="h-4 w-4 mr-2" />
                Create First DPIA
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {dpias.map((dpia) => (
            <DPIACard
              key={dpia.id}
              dpia={dpia}
              onDelete={() => handleDelete(dpia.id)}
              onView={() => router.push(`/data-protection/dpias/${dpia.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DPIACard({
  dpia,
  onDelete,
  onView,
}: {
  dpia: DPIA;
  onDelete: () => void;
  onView: () => void;
}) {
  const needsReview = dpia.next_review_date && new Date(dpia.next_review_date) < new Date();

  return (
    <Card className={cn(
      'card-elevated hover:shadow-md transition-shadow cursor-pointer',
      needsReview && 'border-amber-200 dark:border-amber-800'
    )} onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">{dpia.title}</h3>
                {dpia.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {dpia.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {dpia.overall_risk_level && (
                  <Badge className={cn('text-xs', RISK_COLORS[dpia.overall_risk_level])}>
                    {RISK_LEVEL_LABELS[dpia.overall_risk_level]} Risk
                  </Badge>
                )}
                <Badge className={cn('text-xs', STATUS_COLORS[dpia.status])}>
                  {DPIA_STATUS_LABELS[dpia.status]}
                </Badge>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created: {new Date(dpia.created_at).toLocaleDateString()}
              </span>

              {dpia.approved_at && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Approved: {new Date(dpia.approved_at).toLocaleDateString()}
                </span>
              )}

              {needsReview && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Review overdue
                </span>
              )}

              {dpia.dpo_consulted && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  DPO consulted
                </span>
              )}

              {dpia.processing_activity_id && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Linked activity
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
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
