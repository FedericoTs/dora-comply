/**
 * Questionnaire Templates Page
 *
 * Manage NIS2 questionnaire templates
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, FileText, Settings, MoreHorizontal, Copy, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTemplates } from '@/lib/nis2-questionnaire/queries';
import { CreateTemplateDialog } from '@/components/questionnaires/company/create-template-dialog';

export const metadata = {
  title: 'Questionnaire Templates | NIS2 Comply',
  description: 'Manage NIS2 vendor questionnaire templates',
};

async function TemplatesList() {
  const templates = await getTemplates();

  if (!templates || templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No Templates Yet</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Create your first questionnaire template. We&apos;ll pre-populate it with NIS2 Article
            21 security questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <CreateTemplateDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create First Template
            </Button>
          </CreateTemplateDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="relative">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {template.name}
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description || 'No description'}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/questionnaires/templates/${template.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Template
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {template.nis2_categories?.slice(0, 3).map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat.replace('_', ' ')}
                  </Badge>
                ))}
                {(template.nis2_categories?.length || 0) > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{(template.nis2_categories?.length || 0) - 3} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>~{template.estimated_completion_minutes} min</span>
                <span>Used {template.times_used} times</span>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/questionnaires/templates/${template.id}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure Questions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplatesListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Questionnaire Templates</h1>
          <p className="text-muted-foreground">
            Create and manage NIS2 security questionnaire templates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/questionnaires">Back to Questionnaires</Link>
          </Button>
          <CreateTemplateDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </CreateTemplateDialog>
        </div>
      </div>

      {/* Templates List */}
      <Suspense fallback={<TemplatesListSkeleton />}>
        <TemplatesList />
      </Suspense>
    </div>
  );
}
