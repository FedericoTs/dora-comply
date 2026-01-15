import { Metadata } from 'next';
import { Suspense } from 'react';
import { FileText, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getDocuments, getDocumentStats } from '@/lib/documents/queries';
import { DocumentsClient } from './documents-client';

export const metadata: Metadata = {
  title: 'Documents | DORA Comply',
  description: 'Manage compliance documents, certificates, and audit reports',
};

async function DocumentStats() {
  const stats = await getDocumentStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="card-elevated">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-info/10 p-2">
            <FileText className="h-5 w-5 text-info" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.by_type.soc2 + stats.by_type.iso27001}</p>
            <p className="text-xs text-muted-foreground">Certifications</p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-warning/10 p-2">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.expiring_soon}</p>
            <p className="text-xs text-muted-foreground">Expiring Soon</p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-error/10 p-2">
            <AlertTriangle className="h-5 w-5 text-error" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="card-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-12 rounded bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function DocumentsPage() {
  // Initial data fetch for SSR
  const initialData = await getDocuments({
    pagination: { page: 1, limit: 20 },
    sort: { field: 'created_at', direction: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage compliance documents, certificates, and audit reports
          </p>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DocumentStats />
      </Suspense>

      {/* Documents List */}
      <DocumentsClient initialData={initialData} />
    </div>
  );
}
