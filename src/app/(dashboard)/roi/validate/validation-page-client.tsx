'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Sparkles,
  ListChecks,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ErrorList } from './components/error-list';
import { AiSuggestions } from './components/ai-suggestions';
import { FixWizard } from './components/fix-wizard';
import type { RoiValidationResult, ValidationError } from '@/lib/roi/types';

interface ValidationPageClientProps {
  initialResult: RoiValidationResult;
}

// Helper to flatten errors from templateResults
function getAllErrors(result: RoiValidationResult): ValidationError[] {
  return Object.values(result.templateResults).flatMap((tr) => tr.errors);
}

export function ValidationPageClient({ initialResult }: ValidationPageClientProps) {
  const [result, setResult] = useState(initialResult);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('errors');
  const allErrors = getAllErrors(result);

  const handleRevalidate = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/roi/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ includeAiSuggestions: true }),
        });

        const data = await response.json();

        if (data.success) {
          setResult(data.data);
          if (data.data.isValid) {
            toast.success('Validation Passed!', {
              description: 'All templates are ready for ESA submission.',
            });
          } else {
            toast.info('Validation Complete', {
              description: `Found ${data.data.totalErrors} errors and ${data.data.totalWarnings} warnings.`,
            });
          }
        } else {
          toast.error('Validation Failed', {
            description: data.error?.message || 'An error occurred',
          });
        }
      } catch {
        toast.error('Connection Error', {
          description: 'Could not connect to validation service',
        });
      }
    });
  };

  const errorCount = result.totalErrors;
  const warningCount = result.totalWarnings;
  const isValid = result.isValid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/roi"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Register of Information
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">ESA Validation</h1>
          <p className="text-muted-foreground">
            Validate your RoI data against ESA submission requirements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRevalidate}
            disabled={isPending}
          >
            {isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-validate
          </Button>
          <Button
            asChild
            disabled={!isValid}
          >
            <Link href="/api/roi/package">
              <Download className="h-4 w-4 mr-2" />
              Export Package
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className={`rounded-lg border-2 p-4 ${
        isValid
          ? 'border-green-200 bg-green-50'
          : errorCount > 0
            ? 'border-red-200 bg-red-50'
            : 'border-yellow-200 bg-yellow-50'
      }`}>
        <div className="flex items-center gap-4">
          {isValid ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : errorCount > 0 ? (
            <AlertCircle className="h-8 w-8 text-red-600" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          )}
          <div className="flex-1">
            <h2 className={`font-medium text-lg ${
              isValid ? 'text-green-800' : errorCount > 0 ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {isValid
                ? 'All Templates Valid'
                : errorCount > 0
                  ? `${errorCount} Errors Must Be Fixed`
                  : `${warningCount} Warnings to Review`}
            </h2>
            <p className={`text-sm ${
              isValid ? 'text-green-700' : errorCount > 0 ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {isValid
                ? 'Your Register of Information is ready for ESA submission.'
                : 'Resolve the issues below before exporting your RoI package.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {errorCount} errors
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-sm px-3 py-1">
                {warningCount} warnings
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="errors" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Error List
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="wizard" className="gap-2">
            <Wand2 className="h-4 w-4" />
            Fix Wizard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              disabled
            >
              Group by Template
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              disabled
            >
              Group by Severity
            </Button>
          </div>
          <ErrorList errors={allErrors} groupBy="template" />
        </TabsContent>

        <TabsContent value="suggestions">
          <AiSuggestions errors={allErrors} />
        </TabsContent>

        <TabsContent value="wizard">
          <FixWizard
            errors={allErrors}
            onRevalidate={handleRevalidate}
            isRevalidating={isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
