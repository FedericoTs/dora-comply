'use client';

/**
 * Document Version History
 *
 * Displays version history for a document, allowing users to view
 * previous versions and restore them if needed.
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GitBranch,
  FileText,
  Download,
  RotateCcw,
  MoreVertical,
  Clock,
  User,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DocumentVersion {
  id: string;
  filename: string;
  version: number;
  is_latest: boolean;
  storage_path: string;
  file_size: number | null;
  created_at: string;
  created_by: string | null;
  user?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  documentName?: string;
  className?: string;
  onVersionRestore?: (versionId: string) => void;
}

interface DocumentVersionRow {
  id: string;
  filename: string;
  version: number;
  is_latest: boolean;
  storage_path: string;
  file_size: number | null;
  created_at: string;
  created_by: string | null;
  user: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentVersionHistory({
  documentId,
  documentName,
  className,
  onVersionRestore,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<DocumentVersion | null>(null);

  useEffect(() => {
    async function fetchVersions() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // First get the document to find its parent or itself
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('id, parent_document_id')
        .eq('id', documentId)
        .single();

      if (docError) {
        console.error('Error fetching document:', docError);
        setError('Failed to load document');
        setLoading(false);
        return;
      }

      // Get the root document ID (either parent or self)
      const rootId = doc.parent_document_id || doc.id;

      // Fetch all versions (parent + children)
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select(`
          id,
          filename,
          version,
          is_latest,
          storage_path,
          file_size,
          created_at,
          created_by,
          user:users!created_by(full_name, email)
        `)
        .or(`id.eq.${rootId},parent_document_id.eq.${rootId}`)
        .order('version', { ascending: false });

      if (fetchError) {
        console.error('Error fetching versions:', fetchError);
        setError('Failed to load version history');
        setLoading(false);
        return;
      }

      // Process data to handle user relation
      const processedData = ((data || []) as DocumentVersionRow[]).map((v) => ({
        ...v,
        user: Array.isArray(v.user) ? v.user[0] : v.user,
      }));

      setVersions(processedData as DocumentVersion[]);
      setLoading(false);
    }

    fetchVersions();
  }, [documentId]);

  const handleDownload = async (version: DocumentVersion) => {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from('documents')
      .download(version.storage_path);

    if (error) {
      toast.error('Failed to download file');
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v${version.version}_${version.filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (version: DocumentVersion) => {
    setRestoring(version.id);
    setConfirmRestore(null);

    try {
      const supabase = createClient();

      // Call the restore function
      const { error } = await supabase.rpc('create_document_version', {
        p_document_id: documentId,
        p_new_storage_path: version.storage_path,
        p_new_filename: version.filename,
      });

      if (error) {
        throw error;
      }

      toast.success('Version restored', {
        description: `Restored to version ${version.version}`,
      });

      // Refresh the version list
      onVersionRestore?.(version.id);

      // Reload versions
      window.location.reload();
    } catch (err) {
      console.error('Error restoring version:', err);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
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
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Version History
          </CardTitle>
          <CardDescription>
            {documentName
              ? `${versions.length} version${versions.length !== 1 ? 's' : ''} of ${documentName}`
              : `${versions.length} version${versions.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No version history available
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    version.is_latest
                      ? 'bg-primary/5 border-primary/30'
                      : 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg',
                      version.is_latest
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.version}</span>
                      {version.is_latest && (
                        <Badge className="bg-primary/10 text-primary border-primary/30">
                          <Check className="h-3 w-3 mr-1" />
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>·</span>
                      <span>{formatFileSize(version.file_size)}</span>
                      {version.user && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.user.full_name || version.user.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(version)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {!version.is_latest && (
                        <DropdownMenuItem
                          onClick={() => setConfirmRestore(version)}
                          className="text-amber-600"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore this version
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Restore Previous Version?
            </DialogTitle>
            <DialogDescription>
              This will create a new version based on version {confirmRestore?.version}.
              The current version will be preserved in the history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium">
                Restoring to: Version {confirmRestore?.version}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Created{' '}
                {confirmRestore &&
                  format(new Date(confirmRestore.created_at), 'PPP · p')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmRestore && handleRestore(confirmRestore)}
              disabled={restoring === confirmRestore?.id}
            >
              {restoring === confirmRestore?.id ? (
                <>Restoring...</>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
