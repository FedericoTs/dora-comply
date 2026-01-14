'use client';

import {
  Search,
  Check,
  AlertCircle,
  Loader2,
  Globe,
  Info,
  ExternalLink,
} from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { OrganizationFormData, LEIValidationResult } from '@/lib/settings/organization-constants';

interface LeiSectionProps {
  form: UseFormReturn<OrganizationFormData>;
  leiValidation: LEIValidationResult | null;
  isValidatingLei: boolean;
  onLeiChange: (value: string) => void;
  onValidate: () => void;
}

export function LeiSection({
  form,
  leiValidation,
  isValidatingLei,
  onLeiChange,
  onValidate,
}: LeiSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Legal Entity Identifier (LEI)
        </CardTitle>
        <CardDescription>
          Your 20-character LEI from GLEIF. Required for DORA Register of Information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="lei"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LEI Code</FormLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="529900T8BM49AURSDO55"
                      className={cn(
                        'font-mono uppercase',
                        leiValidation?.valid && 'border-green-500 pr-10',
                        leiValidation?.error && 'border-red-500 pr-10'
                      )}
                      maxLength={20}
                      onChange={(e) => onLeiChange(e.target.value)}
                    />
                  </FormControl>
                  {isValidatingLei && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!isValidatingLei && leiValidation?.valid && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                  {!isValidatingLei && leiValidation?.error && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onValidate}
                  disabled={isValidatingLei || !form.getValues('lei')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
              <FormDescription>
                <a
                  href="https://search.gleif.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Search GLEIF Database
                  <ExternalLink className="h-3 w-3" />
                </a>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LEI Validation Result */}
        {leiValidation && (
          <div className="space-y-3">
            {leiValidation.valid && leiValidation.entity && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-200">
                  LEI Verified
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <strong>Entity:</strong> {leiValidation.entity.legalName}
                    </p>
                    <p>
                      <strong>Location:</strong>{' '}
                      {leiValidation.entity.legalAddress.city},{' '}
                      {leiValidation.entity.legalAddress.country}
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <Badge
                        variant="outline"
                        className="ml-1 text-xs bg-green-100 text-green-700 border-green-300"
                      >
                        {leiValidation.entity.registrationStatus}
                      </Badge>
                    </p>
                    {leiValidation.entity.ultimateParent && (
                      <p>
                        <strong>Ultimate Parent:</strong>{' '}
                        {leiValidation.entity.ultimateParent.legalName} (
                        {leiValidation.entity.ultimateParent.country})
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {leiValidation.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid LEI</AlertTitle>
                <AlertDescription>{leiValidation.error}</AlertDescription>
              </Alert>
            )}

            {leiValidation.warnings && leiValidation.warnings.length > 0 && (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  Warnings
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <ul className="list-disc list-inside">
                    {leiValidation.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
