'use client';

/**
 * Vendor Audit Log Viewer
 *
 * Displays a chronological log of all changes made to a vendor,
 * including field-level diffs showing old vs new values.
 */

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  History,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  User,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface AuditLogEntry {
  id: string;
  vendor_id: string;
  user_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changed_fields: string[] | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface VendorAuditLogProps {
  vendorId: string;
  vendorName?: string;
  className?: string;
}

interface AuditLogRow {
  id: string;
  vendor_id: string;
  user_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE';
  changed_fields: string[] | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  INSERT: <Plus className="h-4 w-4" />,
  UPDATE: <Pencil className="h-4 w-4" />,
  DELETE: <Trash2 className="h-4 w-4" />,
  RESTORE: <RotateCcw className="h-4 w-4" />,
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/30',
  RESTORE: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
};

const ACTION_LABELS: Record<string, string> = {
  INSERT: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  RESTORE: 'Restored',
};

// Format field names for display
function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format values for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ') || '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function VendorAuditLog({
  vendorId,
  vendorName,
  className,
}: VendorAuditLogProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchAuditLog() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('vendor_audit_log')
        .select(`
          id,
          vendor_id,
          user_id,
          action,
          changed_fields,
          old_values,
          new_values,
          created_at,
          user:users!user_id(full_name, email)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching audit log:', fetchError);
        setError('Failed to load audit log');
        setLoading(false);
        return;
      }

      // Handle the user relation which may be an array
      const processedData = ((data || []) as AuditLogRow[]).map((entry) => ({
        ...entry,
        user: Array.isArray(entry.user) ? entry.user[0] : entry.user,
      }));

      setEntries(processedData as AuditLogEntry[]);
      setLoading(false);
    }

    fetchAuditLog();
  }, [vendorId]);

  const toggleExpanded = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          {vendorName ? `Change history for ${vendorName}` : 'All changes to this vendor'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No changes recorded yet
          </p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {entries.map((entry) => (
                <Collapsible
                  key={entry.id}
                  open={expandedEntries.has(entry.id)}
                  onOpenChange={() => toggleExpanded(entry.id)}
                >
                  <div className="relative pl-12">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-3 top-2 w-4 h-4 rounded-full border-2 bg-background',
                        ACTION_COLORS[entry.action]
                      )}
                    />

                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto hover:bg-muted/50"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-lg',
                              ACTION_COLORS[entry.action]
                            )}
                          >
                            {ACTION_ICONS[entry.action]}
                          </div>

                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {ACTION_LABELS[entry.action]}
                              </span>
                              {entry.changed_fields && entry.changed_fields.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {entry.changed_fields.length} field
                                  {entry.changed_fields.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                              <User className="h-3 w-3" />
                              <span>
                                {entry.user?.full_name || entry.user?.email || 'System'}
                              </span>
                              <span>·</span>
                              <span title={format(new Date(entry.created_at), 'PPpp')}>
                                {formatDistanceToNow(new Date(entry.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>

                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              expandedEntries.has(entry.id) && 'rotate-180'
                            )}
                          />
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="ml-11 mt-2 p-3 rounded-lg bg-muted/30 border">
                        {entry.action === 'INSERT' && entry.new_values && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Initial values:
                            </p>
                            {Object.entries(entry.new_values)
                              .filter(([key]) => !['id', 'organization_id', 'created_at', 'updated_at'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2 text-sm">
                                  <span className="font-medium min-w-32">
                                    {formatFieldName(key)}:
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatValue(value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}

                        {entry.action === 'UPDATE' && entry.changed_fields && (
                          <div className="space-y-3">
                            {entry.changed_fields.map((field) => (
                              <div key={field} className="flex items-center gap-2 text-sm">
                                <span className="font-medium min-w-32">
                                  {formatFieldName(field)}:
                                </span>
                                <span className="text-red-600 line-through">
                                  {formatValue(entry.old_values?.[field])}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-emerald-600">
                                  {formatValue(entry.new_values?.[field])}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {entry.action === 'DELETE' && (
                          <p className="text-sm text-muted-foreground">
                            Vendor was deleted
                          </p>
                        )}

                        {entry.action === 'RESTORE' && (
                          <p className="text-sm text-muted-foreground">
                            Vendor was restored from deletion
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                          {format(new Date(entry.created_at), 'PPPP · pp')}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
