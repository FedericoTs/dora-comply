/**
 * RoI Relationships Page
 *
 * Visual diagram of template dependencies and data flow
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Info, BookOpen } from 'lucide-react';
import { fetchAllTemplateStats } from '@/lib/roi';
import { RelationshipDiagram, SimpleFlowDiagram } from '@/components/roi/relationship-diagram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TEMPLATE_NODES,
  getCompletionOrder,
} from '@/lib/roi/template-relationships';

export const metadata = {
  title: 'Template Relationships | DORA Comply',
  description: 'Visualize RoI template dependencies and optimal completion order',
};

async function RelationshipsContent() {
  const stats = await fetchAllTemplateStats();

  const completionOrder = getCompletionOrder();
  const orderedTemplates = completionOrder.map(id =>
    TEMPLATE_NODES.find(n => n.id === id)!
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/roi">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Template Relationships</h1>
          <p className="text-muted-foreground">
            Understand how RoI templates connect and feed into each other
          </p>
        </div>
      </div>

      {/* Quick Reference Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Data Flow Overview</CardTitle>
          <CardDescription>
            High-level view of template groups and their dependencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleFlowDiagram className="py-4" />
        </CardContent>
      </Card>

      {/* Interactive Diagram */}
      <RelationshipDiagram templateStats={stats} />

      {/* Completion Order */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Recommended Completion Order
          </CardTitle>
          <CardDescription>
            Complete templates in this order for optimal workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {orderedTemplates.map((template, index) => {
              const stat = stats.find(s => s.templateId === template.id);
              const isComplete = stat?.completeness === 100;

              return (
                <Link
                  key={template.id}
                  href={`/roi/${template.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{template.shortName}</p>
                    <p className="text-xs text-muted-foreground">{template.id}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isComplete ? 'text-green-600' : ''}`}>
                      {stat?.completeness || 0}%
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="flex items-start gap-4 pt-4">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Understanding the Diagram</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Solid arrows:</strong> Data flows from one template to another</li>
              <li><strong>Dashed lines:</strong> References or optional relationships</li>
              <li><strong>Click a node:</strong> Highlight its connections</li>
              <li><strong>Colors:</strong> Group templates by function (entity, contracts, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RelationshipsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-[500px]" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={<RelationshipsSkeleton />}>
      <RelationshipsContent />
    </Suspense>
  );
}
