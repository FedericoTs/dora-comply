'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, X, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { IncidentCard } from './incident-card';
import {
  type IncidentListItem,
  type IncidentClassification,
  type IncidentStatus,
  type IncidentType,
  INCIDENT_CLASSIFICATIONS,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  getClassificationLabel,
  getStatusLabel,
  getIncidentTypeLabel,
} from '@/lib/incidents/types';

interface IncidentListProps {
  incidents: IncidentListItem[];
  loading?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'classification' | 'status';

export function IncidentList({ incidents, loading = false }: IncidentListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');
  const [classificationFilter, setClassificationFilter] = useState<IncidentClassification | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (classificationFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    return count;
  }, [statusFilter, classificationFilter, typeFilter]);

  const filteredAndSortedIncidents = useMemo(() => {
    let result = [...incidents];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (inc) =>
          inc.title.toLowerCase().includes(searchLower) ||
          inc.incident_ref.toLowerCase().includes(searchLower) ||
          inc.vendor_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (statusFilter !== 'all') {
      result = result.filter((inc) => inc.status === statusFilter);
    }
    if (classificationFilter !== 'all') {
      result = result.filter((inc) => inc.classification === classificationFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter((inc) => inc.incident_type === typeFilter);
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.detection_datetime).getTime() - new Date(a.detection_datetime).getTime();
        case 'oldest':
          return new Date(a.detection_datetime).getTime() - new Date(b.detection_datetime).getTime();
        case 'classification': {
          const order: Record<IncidentClassification, number> = { major: 0, significant: 1, minor: 2 };
          return order[a.classification] - order[b.classification];
        }
        case 'status': {
          const order: Record<IncidentStatus, number> = {
            detected: 0,
            draft: 1,
            initial_submitted: 2,
            intermediate_submitted: 3,
            final_submitted: 4,
            closed: 5,
          };
          return order[a.status] - order[b.status];
        }
        default:
          return 0;
      }
    });

    return result;
  }, [incidents, search, statusFilter, classificationFilter, typeFilter, sortBy]);

  const clearFilters = () => {
    setStatusFilter('all');
    setClassificationFilter('all');
    setTypeFilter('all');
    setSearch('');
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-lg border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as IncidentStatus | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {INCIDENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Classification</label>
                  <Select
                    value={classificationFilter}
                    onValueChange={(v) => setClassificationFilter(v as IncidentClassification | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All classifications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classifications</SelectItem>
                      {INCIDENT_CLASSIFICATIONS.map((classification) => (
                        <SelectItem key={classification} value={classification}>
                          {getClassificationLabel(classification)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Incident Type</label>
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => setTypeFilter(v as IncidentType | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {INCIDENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getIncidentTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="classification">By severity</SelectItem>
            <SelectItem value="status">By status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {getStatusLabel(statusFilter)}
              <button
                onClick={() => setStatusFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {classificationFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Classification: {getClassificationLabel(classificationFilter)}
              <button
                onClick={() => setClassificationFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {getIncidentTypeLabel(typeFilter)}
              <button
                onClick={() => setTypeFilter('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedIncidents.length} of {incidents.length} incidents
      </p>

      {/* Incidents Grid */}
      {filteredAndSortedIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg">No incidents found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || activeFiltersCount > 0
              ? 'Try adjusting your search or filters'
              : 'No incidents have been reported yet'}
          </p>
          {(search || activeFiltersCount > 0) && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedIncidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
}
