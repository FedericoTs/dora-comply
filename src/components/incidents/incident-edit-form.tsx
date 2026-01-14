'use client';

/**
 * Incident Edit Form
 *
 * Main form component for editing incident details.
 * Uses extracted tab components for better maintainability.
 */

import {
  FileText,
  Activity,
  Shield,
  Settings,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIncidentEditForm } from '@/hooks/use-incident-edit-form';
import { ClassificationCalculator } from './classification-calculator';
import {
  BasicInfoTab,
  ImpactTab,
  DetailsTab,
  StatusTab,
  ClassificationBanner,
} from './incident-edit-form/index';
import type { Incident } from '@/lib/incidents/types';

interface IncidentEditFormProps {
  incident: Incident;
  vendors: Array<{ id: string; name: string }>;
}

export function IncidentEditForm({ incident, vendors }: IncidentEditFormProps) {
  const {
    formData,
    activeTab,
    hasChanges,
    isSubmitting,
    impactData,
    classificationResult,
    setActiveTab,
    updateFormData,
    handleClassificationChange,
    handleOverrideChange,
    handleJustificationChange,
    handleSubmit,
    handleCancel,
  } = useIncidentEditForm({ incident });

  return (
    <div className="space-y-6">
      {/* Classification Preview Banner */}
      <ClassificationBanner
        classificationResult={classificationResult}
        formData={formData}
        hasChanges={hasChanges}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full h-auto p-1">
          <TabsTrigger value="basic" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex-1 gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Impact</span>
          </TabsTrigger>
          <TabsTrigger value="classification" className="flex-1 gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Classification</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="status" className="flex-1 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Status</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <BasicInfoTab formData={formData} onUpdate={updateFormData} />

        {/* Impact Tab */}
        <ImpactTab formData={formData} onUpdate={updateFormData} />

        {/* Classification Tab */}
        <TabsContent value="classification" className="space-y-4">
          <ClassificationCalculator
            impactData={impactData}
            detectionDateTime={formData.detection_datetime}
            selectedClassification={formData.classification || classificationResult.calculated}
            isOverride={formData.classification_override || false}
            overrideJustification={formData.classification_override_justification || ''}
            onClassificationChange={handleClassificationChange}
            onOverrideChange={handleOverrideChange}
            onJustificationChange={handleJustificationChange}
          />
        </TabsContent>

        {/* Details Tab */}
        <DetailsTab formData={formData} vendors={vendors} onUpdate={updateFormData} />

        {/* Status Tab */}
        <StatusTab incident={incident} />
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
