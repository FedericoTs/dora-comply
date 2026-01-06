'use client';

/**
 * Template Status Tabs
 *
 * Filterable template grid with status-based tabs and inline editing
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Clock, FileText, Edit, ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DataEntrySheet } from './data-entry-sheet';
import type { TemplateWithStatus, TemplateFilterStatus } from '@/lib/roi/types';

interface TemplateStatusTabsProps {
  templates: TemplateWithStatus[];
  enableInlineEdit?: boolean;
}

const statusConfig: Record<TemplateFilterStatus, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  all: { label: 'All', icon: FileText },
  needs_attention: { label: 'Needs Attention', icon: AlertCircle },
  in_progress: { label: 'In Progress', icon: Clock },
  complete: { label: 'Complete', icon: CheckCircle2 },
};

const groupLabels: Record<TemplateWithStatus['group'], string> = {
  entity: 'Entity Information',
  contracts: 'Contracts',
  links: 'Relationships',
  providers: 'ICT Providers',
  functions: 'Critical Functions',
  exit: 'Exit Planning',
};

interface TemplateCardProps {
  template: TemplateWithStatus;
  onQuickEdit?: (template: TemplateWithStatus) => void;
  enableInlineEdit?: boolean;
}

function TemplateCard({ template, onQuickEdit, enableInlineEdit }: TemplateCardProps) {
  const isComplete = template.completeness === 100;
  const needsAttention = template.status === 'needs_attention';

  const handleClick = () => {
    if (enableInlineEdit && onQuickEdit) {
      onQuickEdit(template);
    }
  };

  const cardContent = (
    <Card className={cn(
      'transition-all hover:shadow-md hover:border-primary/50 cursor-pointer h-full group',
      needsAttention && 'border-amber-300 dark:border-amber-700',
      isComplete && 'border-emerald-300 dark:border-emerald-700'
    )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <Badge variant="outline" className="text-xs mb-1">
                {template.templateId}
              </Badge>
              <h4 className="font-medium text-sm line-clamp-1">
                {template.name}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              {enableInlineEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/roi/${template.templateId}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : needsAttention ? (
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              ) : enableInlineEdit ? (
                <Edit className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {template.rowCount} {template.rowCount === 1 ? 'record' : 'records'}
              </span>
              <span className={cn(
                'font-medium',
                isComplete && 'text-emerald-600',
                needsAttention && 'text-amber-600'
              )}>
                {template.completeness}%
              </span>
            </div>
            <Progress
              value={template.completeness}
              className={cn(
                'h-1.5',
                isComplete && '[&>div]:bg-emerald-500',
                needsAttention && '[&>div]:bg-amber-500'
              )}
            />
          </div>

          {template.errorCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>{template.errorCount} field{template.errorCount > 1 ? 's' : ''} need{template.errorCount === 1 ? 's' : ''} attention</span>
            </div>
          )}
        </CardContent>
      </Card>
  );

  if (enableInlineEdit) {
    return (
      <div onClick={handleClick} className="h-full">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={`/roi/${template.templateId}`} className="h-full">
      {cardContent}
    </Link>
  );
}

export function TemplateStatusTabs({ templates, enableInlineEdit = true }: TemplateStatusTabsProps) {
  const [activeTab, setActiveTab] = useState<TemplateFilterStatus>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithStatus | null>(null);

  const handleQuickEdit = useCallback((template: TemplateWithStatus) => {
    setSelectedTemplate(template);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setSelectedTemplate(null);
  }, []);

  const counts = {
    all: templates.length,
    needs_attention: templates.filter(t => t.status === 'needs_attention').length,
    in_progress: templates.filter(t => t.status === 'in_progress').length,
    complete: templates.filter(t => t.status === 'complete').length,
  };

  const filteredTemplates = activeTab === 'all'
    ? templates
    : templates.filter(t => t.status === activeTab);

  // Group templates
  const groupedTemplates = filteredTemplates.reduce((acc, t) => {
    if (!acc[t.group]) acc[t.group] = [];
    acc[t.group].push(t);
    return acc;
  }, {} as Record<string, TemplateWithStatus[]>);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateFilterStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          {(Object.keys(statusConfig) as TemplateFilterStatus[]).map((status) => {
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={status}
                value={status}
                className="flex items-center gap-1.5 text-xs"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{config.label}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'ml-1 h-5 px-1.5 text-xs',
                    status === 'needs_attention' && counts.needs_attention > 0 && 'bg-amber-100 text-amber-700',
                    status === 'complete' && 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {counts[status]}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {Object.entries(groupedTemplates).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No templates in this category</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTemplates).map(([group, groupTemplates]) => (
                <div key={group}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {groupLabels[group as TemplateWithStatus['group']]}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groupTemplates.map(template => (
                      <TemplateCard
                        key={template.templateId}
                        template={template}
                        onQuickEdit={handleQuickEdit}
                        enableInlineEdit={enableInlineEdit}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Data Entry Sheet */}
      <DataEntrySheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        template={selectedTemplate}
      />
    </div>
  );
}
