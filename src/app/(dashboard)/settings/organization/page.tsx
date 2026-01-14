'use client';

/**
 * Organization Settings Page
 *
 * Manage organization details including LEI, jurisdiction, and entity type.
 * Features GLEIF integration for LEI auto-validation and data enrichment.
 */

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Form } from '@/components/ui/form';
import { useOrganizationSettings } from '@/hooks/use-organization-settings';
import {
  LeiSection,
  OrganizationDetailsSection,
  EntityClassificationSection,
} from '@/components/settings';

export default function OrganizationSettingsPage() {
  const {
    form,
    isLoading,
    isSaving,
    leiValidation,
    isValidatingLei,
    significanceLevel,
    entityType,
    onSubmit,
    handleLeiChange,
    handleReset,
    triggerLeiValidation,
  } = useOrganizationSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-medium">Organization Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your organization&apos;s details for DORA compliance reporting
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* LEI Section */}
          <LeiSection
            form={form}
            leiValidation={leiValidation}
            isValidatingLei={isValidatingLei}
            onLeiChange={handleLeiChange}
            onValidate={triggerLeiValidation}
          />

          {/* Organization Details */}
          <OrganizationDetailsSection form={form} />

          {/* Entity Classification Section */}
          <EntityClassificationSection
            form={form}
            significanceLevel={significanceLevel}
            entityType={entityType}
          />

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
